import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, Subscription } from 'rxjs';

import { MapRouteRequestDTO } from '../../../_abstract_model/dto/map-route.dto';
import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { MapRouteService } from '../../../_abstract_model/services/map-route.service';
import { MapRoute, MapRouteChange } from '../../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../../_abstract_model/types/map-route-game.class';
import { MapRouteAccess, MapRoutes } from '../../../_abstract_model/types/map-routes.class';

export type MapRoutesStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface MapRoutesState {
    /** Ville chargée, mapId tel que l'envoient les clients. */
    readonly map_id: number | null;
    readonly status: MapRoutesStatus;
    readonly access: MapRouteAccess | null;
    /** Triés par identifiant. */
    readonly routes: readonly MapRoute[];
    readonly game_routes: readonly MapRouteGame[];
}

const INITIAL_STATE: MapRoutesState = { map_id: null, status: 'idle', access: null, routes: [], game_routes: [] };

function byId(route_a: MapRoute, route_b: MapRoute): number {
    return route_a.id - route_b.id;
}

/**
 * Tracés de la ville affichée, tenus à jour en temps réel. Le hub ne diffuse que l'identifiant et la version
 * d'un tracé modifié (rien d'un tracé privé ne part vers toute la ville) : le store relit le tracé, et le
 * retire si l'API répond qu'il n'est plus visible.
 */
@Injectable({ providedIn: 'root' })
export class MapRoutesStore {
    private readonly map_route_service: MapRouteService = inject(MapRouteService);
    private readonly realtime_expeditions_service: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);

    private readonly state: WritableSignal<MapRoutesState> = signal(INITIAL_STATE);

    public readonly map_id: Signal<number | null> = computed((): number | null => this.state().map_id);
    public readonly status: Signal<MapRoutesStatus> = computed((): MapRoutesStatus => this.state().status);
    public readonly access: Signal<MapRouteAccess | null> = computed((): MapRouteAccess | null => this.state().access);
    public readonly routes: Signal<readonly MapRoute[]> = computed((): readonly MapRoute[] => this.state().routes);
    public readonly game_routes: Signal<readonly MapRouteGame[]> = computed((): readonly MapRouteGame[] => this.state().game_routes);

    private load_subscription: Subscription | undefined;
    /** Relecture en cours par tracé : une nouvelle version annule la précédente. */
    private readonly refreshes: Map<number, Subscription> = new Map<number, Subscription>();
    /** Événements reçus pendant un chargement : la réponse peut être antérieure à eux, ils sont rejoués après. */
    private readonly pending_changes: Map<number, number> = new Map<number, number>();
    private readonly pending_deletions: Set<number> = new Set<number>();

    public constructor() {
        this.realtime_expeditions_service.map_route_changed$
            .pipe(takeUntilDestroyed())
            .subscribe((change: MapRouteChange): void => this.onRouteChanged(change));
        this.realtime_expeditions_service.map_route_deleted$
            .pipe(takeUntilDestroyed())
            .subscribe((route_id: number): void => this.onRouteDeleted(route_id));
        // Événements perdus pendant la coupure : relecture complète des tracés d'un citoyen.
        this.realtime_expeditions_service.reconnected$
            .pipe(takeUntilDestroyed())
            .subscribe((): void => this.onReconnected());
    }

    /** Charge les tracés d'une ville. Rappeler avec le même mapId recharge. */
    public load(map_id: number): void {
        this.load_subscription?.unsubscribe();
        this.cancelRefreshes();
        this.pending_changes.clear();
        this.pending_deletions.clear();
        this.state.set({ ...INITIAL_STATE, map_id, status: 'loading' });
        this.load_subscription = this.map_route_service.getMapRoutes(map_id).subscribe({
            next: (result: MapRoutes): void => {
                this.state.set({
                    map_id,
                    status: 'loaded',
                    access: result.access,
                    routes: [...result.routes].sort(byId),
                    game_routes: result.game_routes
                });
                this.replayPendingEvents();
            },
            error: (): void => {
                this.state.update((state: MapRoutesState): MapRoutesState => ({ ...state, status: 'error' }));
                this.pending_changes.clear();
                this.pending_deletions.clear();
            }
        });
    }

    /**
     * Enregistre un tracé dans la ville chargée et l'affiche aussitôt, sans attendre l'écho du hub. Rejette
     * l'erreur du hub telle quelle (version périmée : `isHubConflictError`).
     */
    public async saveRoute(request: MapRouteRequestDTO): Promise<MapRoute> {
        const map_id: number = this.loadedMapId();
        const saved: MapRoute = await this.realtime_expeditions_service.saveMapRoute(map_id, request);
        if (this.state().map_id === map_id) {
            this.upsertRoute(saved);
        }
        return saved;
    }

    /** Copie un itinéraire du jeu en tracé MHO dans la ville chargée, affiché aussitôt. */
    public async copyGameRoute(game_route_id: number): Promise<MapRoute> {
        const map_id: number = this.loadedMapId();
        const saved: MapRoute = await this.realtime_expeditions_service.copyGameRoute(map_id, game_route_id);
        if (this.state().map_id === map_id) {
            this.upsertRoute(saved);
        }
        return saved;
    }

    public async deleteRoute(route_id: number): Promise<void> {
        await this.realtime_expeditions_service.deleteMapRoute(route_id);
        this.refreshes.get(route_id)?.unsubscribe();
        this.refreshes.delete(route_id);
        this.removeRoute(route_id);
    }

    /** Relit un tracé (après un refus pour version périmée) ; `null` s'il n'existe plus ou n'est plus visible. */
    public async reloadRoute(route_id: number): Promise<MapRoute | null> {
        const map_id: number = this.loadedMapId();
        const route: MapRoute | null = await firstValueFrom(this.map_route_service.getMapRoute(map_id, route_id));
        if (this.state().map_id === map_id) {
            if (route) {
                this.upsertRoute(route);
            } else {
                this.removeRoute(route_id);
            }
        }
        return route;
    }

    private loadedMapId(): number {
        const state: MapRoutesState = this.state();
        if (state.status !== 'loaded' || state.map_id === null) {
            throw new Error('MapRoutesStore : aucune ville chargée.');
        }
        return state.map_id;
    }

    private onRouteChanged(change: MapRouteChange): void {
        const state: MapRoutesState = this.state();
        if (state.status === 'loading') {
            this.pending_changes.set(change.id, Math.max(change.version, this.pending_changes.get(change.id) ?? change.version));
            return;
        }
        if (state.status !== 'loaded' || state.map_id === null || !state.access?.is_citizen) return;
        // Déjà à jour : c'est souvent l'écho de notre propre enregistrement.
        const known: MapRoute | undefined = state.routes.find((route: MapRoute): boolean => route.id === change.id);
        if (known && known.version >= change.version) return;
        this.refresh(state.map_id, change.id);
    }

    private onReconnected(): void {
        const state: MapRoutesState = this.state();
        if (state.status !== 'loaded' || state.map_id === null || !state.access?.is_citizen) return;
        this.load(state.map_id);
    }

    private onRouteDeleted(route_id: number): void {
        if (this.state().status === 'loading') {
            this.pending_deletions.add(route_id);
            this.pending_changes.delete(route_id);
            return;
        }
        this.refreshes.get(route_id)?.unsubscribe();
        this.refreshes.delete(route_id);
        this.removeRoute(route_id);
    }

    private replayPendingEvents(): void {
        for (const route_id of this.pending_deletions) {
            this.removeRoute(route_id);
        }
        const changes: MapRouteChange[] = [...this.pending_changes].map(([id, version]: [number, number]): MapRouteChange => ({ id, version }));
        this.pending_deletions.clear();
        this.pending_changes.clear();
        changes.forEach((change: MapRouteChange): void => this.onRouteChanged(change));
    }

    private refresh(map_id: number, route_id: number): void {
        this.refreshes.get(route_id)?.unsubscribe();
        const subscription: Subscription = this.map_route_service.getMapRoute(map_id, route_id).subscribe({
            next: (route: MapRoute | null): void => {
                // Ville changée entre-temps : la réponse ne la concerne plus.
                if (this.state().map_id !== map_id) return;
                if (route) {
                    this.upsertRoute(route);
                } else {
                    this.removeRoute(route_id);
                }
            },
            // Relecture ratée : on garde la version affichée, la prochaine modification resynchronisera.
            error: (): void => {
                this.refreshes.delete(route_id);
            },
            complete: (): void => {
                this.refreshes.delete(route_id);
            }
        });
        if (!subscription.closed) {
            this.refreshes.set(route_id, subscription);
        }
    }

    /** Ajoute ou remplace un tracé, sauf par une version plus ancienne que celle affichée (réponses croisées). */
    private upsertRoute(route: MapRoute): void {
        this.state.update((state: MapRoutesState): MapRoutesState => {
            const known: MapRoute | undefined = state.routes.find((candidate: MapRoute): boolean => candidate.id === route.id);
            if (known && known.version > route.version) return state;
            const others: MapRoute[] = state.routes.filter((candidate: MapRoute): boolean => candidate.id !== route.id);
            return { ...state, routes: [...others, route].sort(byId) };
        });
    }

    private removeRoute(route_id: number): void {
        this.state.update((state: MapRoutesState): MapRoutesState => {
            if (!state.routes.some((route: MapRoute): boolean => route.id === route_id)) return state;
            return { ...state, routes: state.routes.filter((route: MapRoute): boolean => route.id !== route_id) };
        });
    }

    private cancelRefreshes(): void {
        this.refreshes.forEach((subscription: Subscription): void => subscription.unsubscribe());
        this.refreshes.clear();
    }
}
