import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Injector, OnDestroy, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router, RouterOutlet } from '@angular/router';
import { forkJoin, Subscription, take } from 'rxjs';

import { RealtimeExpeditionsService } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { MapRouteService } from '../../_abstract_model/services/map-route.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { MapRouteAccess } from '../../_abstract_model/types/map-routes.class';
import { Town } from '../../_abstract_model/types/town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownListItem, TownListPageResult } from '../../_abstract_model/types/town-list-item.model';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getOwnTown } from '../../_core/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, RouterOutlet];
const material_modules: Imports = [MatIconModule, MatProgressSpinnerModule];

/** Attente maximale du hub pour suivre une ancienne ville : au-delà, la ville s'affiche en lecture seule. */
const JOIN_TOWN_TIMEOUT_MS: number = 10_000;

interface ObservedTownData {
    readonly map: Town;
    readonly page: TownListPageResult;
    readonly access: MapRouteAccess;
}

/** Rejette la promesse si elle n'est pas tenue à temps (le hub injoignable ne rend jamais la main). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve: (value: T) => void, reject: (reason: unknown) => void): void => {
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => reject(new Error(`Pas de réponse du hub en ${ms} ms`)), ms);
        promise.then(
            (value: T): void => {
                clearTimeout(timer);
                resolve(value);
            },
            (reason: unknown): void => {
                clearTimeout(timer);
                reject(reason);
            }
        );
    });
}

@Component({
    selector: 'mho-town-observer',
    templateUrl: './town-observer.component.html',
    styleUrls: ['./town-observer.component.scss'],
    imports: [...angular_common, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TownObserverComponent implements OnInit, OnDestroy {

    private readonly router: Router = inject(Router);

    private readonly route: ActivatedRoute = inject(ActivatedRoute);
    private readonly town_service: TownService = inject(TownService);
    private readonly map_route_service: MapRouteService = inject(MapRouteService);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly title_service: Title = inject(Title);
    /** Le hub n'est ouvert que pour une ancienne ville : un simple observateur n'en a pas besoin. */
    private readonly injector: Injector = inject(Injector);

    /** Le contenu (router-outlet) n'est rendu qu'une fois le contexte complet chargé, pour que chaque page observe un TownDetails complet (dont le jour). */
    protected readonly context_ready: WritableSignal<boolean> = signal<boolean>(false);
    protected readonly town_name: WritableSignal<string | null> = signal<string | null>(null);
    protected readonly town_day: WritableSignal<number | null> = signal<number | null>(null);
    /** Ancienne ville dont l'utilisateur garde la main sur les expéditions, les consignes et les tracés. */
    protected readonly can_contribute_as_former_citizen: Signal<boolean> = computed((): boolean => {
        return this.town_context.isFormerCitizen() && this.town_context.canContribute();
    });

    private param_subscription?: Subscription;
    private load_subscription?: Subscription;
    /** mapId déjà chargé : le paramMap réémet à chaque navigation entre pages enfants (params hérités), on ignore les répétitions. */
    private loaded_map_id: number | null = null;
    /** Ville observée que suit le hub (ancienne ville) : il revient à la sienne quand on la quitte. */
    private joined_map_id: number | null = null;

    public ngOnInit(): void {
        this.param_subscription = this.route.paramMap.subscribe((params: ParamMap) => {
            const raw_map_id: string | null = params.get('mapId');
            const map_id: number = Number(raw_map_id);
            if (!raw_map_id || Number.isNaN(map_id)) {
                this.redirectToTownList();
                return;
            }
            if (map_id === this.loaded_map_id) {
                return;
            }
            this.loadTown(map_id);
        });
    }

    public ngOnDestroy(): void {
        this.param_subscription?.unsubscribe();
        this.load_subscription?.unsubscribe();
        this.loaded_map_id = null;
        this.town_context.clear();
        void this.restoreOwnTown();
    }

    private loadTown(map_id: number): void {
        this.loaded_map_id = map_id;
        this.context_ready.set(false);
        // Contexte partiel : suffit à getMap() (qui lit getTown()?.town_id) le temps de résoudre le reste.
        const partial: TownDetails = new TownDetails();
        partial.town_id = map_id;
        this.town_context.setObservedTown(partial);

        // take(1) est indispensable : getMap() (Observable fait main dans town.service) émet mais
        // n'appelle jamais complete(), or forkJoin n'émet que quand toutes ses sources sont complétées.
        // Les droits ne lèvent jamais : en cas d'échec, aucun (lecture seule).
        this.load_subscription?.unsubscribe();
        this.load_subscription = forkJoin({
            map: this.town_service.getMap().pipe(take(1)),
            page: this.town_service.getTownsPaged({ id: String(map_id), page: 1, pageSize: 100 }).pipe(take(1)),
            access: this.map_route_service.getAccess(map_id).pipe(take(1))
        }).subscribe({
            next: (data: ObservedTownData): void => {
                void this.applyTown(map_id, data);
            },
            error: () => {
                this.redirectToTownList();
            }
        });
    }

    private async applyTown(map_id: number, { map, page, access }: ObservedTownData): Promise<void> {
        const item: TownListItem | undefined = page.items.find((town: TownListItem) => town.mapId === map_id);
        if (!item) {
            this.redirectToTownList();
            return;
        }
        const details: TownDetails = new TownDetails();
        details.town_id = map_id;
        details.town_x = map.town_x;
        details.town_y = map.town_y;
        details.town_max_x = map.map_width;
        details.town_max_y = map.map_height;
        details.is_chaos = map.is_chaos;
        details.is_devaste = map.is_devasted;
        details.day = map.day;
        if (item.townType) {
            details.town_type = item.townType;
        }
        this.town_context.setObservedTown(details, item.name);
        this.town_name.set(item.name);
        this.town_day.set(map.day);
        this.title_service.setTitle('MyHordes Optimizer' + ' - ' + $localize`Observation` + ' - ' + (item.name ?? String(map_id)));

        // Les pages lisent leurs droits à l'ouverture : ils sont posés avant de les afficher.
        const followed_access: MapRouteAccess = await this.followTown(map_id, access);
        if (this.loaded_map_id !== map_id) return;
        this.town_context.setObservedAccess(followed_access);
        this.context_ready.set(true);
    }

    /**
     * Ancienne ville : le hub la suit, pour que les modifications partent vers ses citoyens et que les leurs arrivent.
     * Sans le hub, la ville reste en lecture seule. Ville d'un autre : le hub revient à la sienne.
     */
    private async followTown(map_id: number, access: MapRouteAccess): Promise<MapRouteAccess> {
        if (!access.is_citizen) {
            await this.restoreOwnTown();
            return access;
        }
        try {
            await withTimeout(this.realtime().joinTown(map_id), JOIN_TOWN_TIMEOUT_MS);
            this.joined_map_id = map_id;
            return access;
        } catch (error: unknown) {
            console.warn('JoinTown', map_id, error);
            return { ...access, can_create: false };
        }
    }

    /** Le hub suivait une ville observée : il revient à celle du jeton (rien pour un mort sans ville). */
    private async restoreOwnTown(): Promise<void> {
        const joined: number | null = this.joined_map_id;
        if (joined === null) return;
        this.joined_map_id = null;
        const own_town_id: number | undefined = getOwnTown()?.town_id;
        if (!own_town_id || own_town_id === joined) return;
        try {
            await this.realtime().joinTown(own_town_id);
        } catch (error: unknown) {
            console.warn('JoinTown', own_town_id, error);
        }
    }

    private realtime(): RealtimeExpeditionsService {
        return this.injector.get(RealtimeExpeditionsService);
    }

    private redirectToTownList(): void {
        this.town_context.clear();
        this.snackbar.errorSnackbar($localize`Impossible de charger cette ville`);
        this.router.navigate(['/directory/towns']);
    }
}
