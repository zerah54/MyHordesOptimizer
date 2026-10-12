import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ExpeditionOrdersUpdate, RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ExpeditionService } from '../../../_abstract_model/services/expedition.service';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { buildCellOrderIndex, CellOrderIndex } from './map-cell-orders';

export type DayExpeditionsStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface DayExpeditionsState {
    /** Ville chargée, mapId tel que l'envoient les clients. */
    readonly map_id: number | null;
    readonly day: number | null;
    readonly status: DayExpeditionsStatus;
    readonly expeditions: readonly Expedition[];
}

const INITIAL_STATE: DayExpeditionsState = { map_id: null, day: null, status: 'idle', expeditions: [] };
const EMPTY_INDEX: CellOrderIndex = new Map();
const NO_EXPEDITIONS: readonly Expedition[] = [];

/** Délai de regroupement des relectures : une rafale d'événements du hub n'en déclenche qu'une. */
const REFRESH_DELAY: number = 250;

/**
 * Expéditions du jour de la ville affichée, pour la carte : consignes par case, parties et tracés liés. Les listes
 * de consignes reçues du hub remplacent celles de leur propriétaire ; tout autre changement des expéditions du jour
 * (partie, place, expédition, import d'un jour) relit la liste, une seule fois par rafale. Un événement reçu
 * pendant une lecture en relance une : la réponse pourrait lui être antérieure.
 */
@Injectable({ providedIn: 'root' })
export class DayExpeditionsStore {
    private readonly expedition_service: ExpeditionService = inject(ExpeditionService);
    private readonly realtime_expeditions_service: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);

    private readonly state: WritableSignal<DayExpeditionsState> = signal(INITIAL_STATE);

    public readonly map_id: Signal<number | null> = computed((): number | null => this.state().map_id);
    public readonly day: Signal<number | null> = computed((): number | null => this.state().day);
    public readonly status: Signal<DayExpeditionsStatus> = computed((): DayExpeditionsStatus => this.state().status);
    /**
     * Expéditions chargées de la ville affichée ; vide tant qu'elles ne sont pas chargées, ou si le store tient
     * une autre ville (ville observée) : rien d'une ville ne s'affiche sur la carte d'une autre.
     */
    public readonly expeditions: Signal<readonly Expedition[]> = computed((): readonly Expedition[] => {
        const state: DayExpeditionsState = this.state();
        return state.status === 'loaded' && state.map_id === getTown()?.town_id ? state.expeditions : NO_EXPEDITIONS;
    });
    /** Consignes par case des expéditions du jour (même réserve). */
    public readonly cell_orders: Signal<CellOrderIndex> = computed((): CellOrderIndex => {
        const expeditions: readonly Expedition[] = this.expeditions();
        return expeditions.length ? buildCellOrderIndex(expeditions) : EMPTY_INDEX;
    });

    private load_subscription: Subscription | undefined;
    private refresh_timer: ReturnType<typeof setTimeout> | null = null;
    /** Lecture en cours (premier chargement ou relecture). */
    private reading: boolean = false;
    /** Un événement est arrivé pendant la lecture en cours : sa réponse peut lui être antérieure. */
    private stale: boolean = false;

    public constructor() {
        const service: RealtimeExpeditionsService = this.realtime_expeditions_service;
        // Une expédition inconnue peut être une nouvelle expédition du jour : l'événement ne dit pas son jour.
        const structure$: Observable<boolean> = merge(
            service.expedition_updated$.pipe(map((): boolean => true)),
            service.expeditions_updated$.pipe(map((): boolean => true)),
            service.expedition_deleted$.pipe(map((id: number): boolean => this.hasExpedition(id))),
            service.expedition_part_updated$.pipe(map((part: ExpeditionPart): boolean => this.hasExpedition(part.expedition_id))),
            service.expedition_part_deleted$.pipe(map((id: number): boolean => this.findPart(id) !== null)),
            service.expedition_citizen_updated$.pipe(map((citizen: CitizenExpedition): boolean => this.hasExpedition(citizen.expedition_id))),
            service.expedition_citizen_deleted$.pipe(map((id: number): boolean => this.hasCitizen(id))),
            service.expedition_order_deleted$.pipe(map((): boolean => true))
        );
        // Pendant une lecture, la liste n'est pas encore là pour dire si l'événement la concerne.
        structure$.pipe(takeUntilDestroyed()).subscribe((concerned: boolean): void => {
            if (concerned || this.reading) this.invalidate();
        });
        service.expedition_part_orders_updated$
            .pipe(takeUntilDestroyed())
            .subscribe((update: ExpeditionOrdersUpdate): void => this.onPartOrders(update));
        service.expedition_citizen_orders_updated$
            .pipe(takeUntilDestroyed())
            .subscribe((update: ExpeditionOrdersUpdate): void => this.onCitizenOrders(update));
        service.expedition_order_updated$
            .pipe(takeUntilDestroyed())
            .subscribe((order: ExpeditionOrder): void => this.onOrder(order));
        // Événements perdus pendant la coupure : relecture.
        service.reconnected$
            .pipe(takeUntilDestroyed())
            .subscribe((): void => this.invalidate());
    }

    /** Charge les expéditions d'un jour d'une ville ; sans effet si elles sont déjà chargées ou en cours. */
    public load(map_id: number, day: number): void {
        const state: DayExpeditionsState = this.state();
        if (state.map_id === map_id && state.day === day && (state.status === 'loaded' || state.status === 'loading')) return;
        this.cancelRefresh();
        this.state.set({ ...INITIAL_STATE, map_id, day, status: 'loading' });
        this.read(map_id, day);
    }

    private read(map_id: number, day: number): void {
        this.load_subscription?.unsubscribe();
        this.reading = true;
        this.stale = false;
        this.load_subscription = this.expedition_service.getExpeditions(day).subscribe({
            next: (expeditions: Expedition[]): void => {
                this.reading = false;
                const state: DayExpeditionsState = this.state();
                if (state.map_id !== map_id || state.day !== day) return;
                this.state.set({ map_id, day, status: 'loaded', expeditions });
                if (this.stale) {
                    this.stale = false;
                    this.invalidate();
                }
            },
            // Relecture ratée : la liste affichée reste, le prochain événement relancera.
            error: (): void => {
                this.reading = false;
                this.stale = false;
                this.state.update((state: DayExpeditionsState): DayExpeditionsState => state.status === 'loading' ? { ...state, status: 'error' } : state);
            }
        });
    }

    /** Relecture différée ; pendant une lecture, la réponse attendue sera suivie d'une autre. */
    private invalidate(): void {
        const state: DayExpeditionsState = this.state();
        if (state.map_id === null || state.day === null) return;
        if (this.reading) {
            this.stale = true;
            return;
        }
        if (state.status !== 'loaded' || this.refresh_timer !== null) return;
        const { map_id, day }: { map_id: number; day: number } = { map_id: state.map_id, day: state.day };
        this.refresh_timer = setTimeout((): void => {
            this.refresh_timer = null;
            this.read(map_id, day);
        }, REFRESH_DELAY);
    }

    private cancelRefresh(): void {
        if (this.refresh_timer !== null) {
            clearTimeout(this.refresh_timer);
            this.refresh_timer = null;
        }
        this.load_subscription?.unsubscribe();
        this.reading = false;
        this.stale = false;
    }

    private onPartOrders(update: ExpeditionOrdersUpdate): void {
        if (this.reading) this.stale = true;
        if (update.owner_id === null) {
            this.invalidate();
            return;
        }
        const owner_id: number = update.owner_id;
        if (this.findPart(owner_id) === null) return;
        this.replaceParts((part: ExpeditionPart): ExpeditionPart | null => part.id === owner_id ? withPart(part, { orders: update.orders }) : null);
    }

    private onCitizenOrders(update: ExpeditionOrdersUpdate): void {
        if (this.reading) this.stale = true;
        if (update.owner_id === null) {
            this.invalidate();
            return;
        }
        const owner_id: number = update.owner_id;
        if (!this.hasCitizen(owner_id)) return;
        this.replaceParts((part: ExpeditionPart): ExpeditionPart | null => {
            if (!part.citizens.some((citizen: CitizenExpedition): boolean => citizen.id === owner_id)) return null;
            return withPart(part, {
                citizens: part.citizens.map((citizen: CitizenExpedition): CitizenExpedition => citizen.id === owner_id ? withCitizen(citizen, update.orders) : citizen)
            });
        });
    }

    /** Une consigne cochée ou modifiée : remplacée dans la liste de son propriétaire. */
    private onOrder(order: ExpeditionOrder): void {
        if (this.reading) this.stale = true;
        if (!this.hasExpedition(order.expeditions_id)) return;
        const replace: (orders: readonly ExpeditionOrder[]) => ExpeditionOrder[] | null = (orders: readonly ExpeditionOrder[]): ExpeditionOrder[] | null => {
            if (!orders.some((candidate: ExpeditionOrder): boolean => candidate.id === order.id)) return null;
            return orders.map((candidate: ExpeditionOrder): ExpeditionOrder => candidate.id === order.id ? order : candidate);
        };
        this.replaceParts((part: ExpeditionPart): ExpeditionPart | null => {
            const part_orders: ExpeditionOrder[] | null = replace(part.orders ?? []);
            if (part_orders) return withPart(part, { orders: part_orders });
            let changed: boolean = false;
            const citizens: CitizenExpedition[] = part.citizens.map((citizen: CitizenExpedition): CitizenExpedition => {
                const citizen_orders: ExpeditionOrder[] | null = replace(citizen.orders ?? []);
                if (!citizen_orders) return citizen;
                changed = true;
                return withCitizen(citizen, citizen_orders);
            });
            return changed ? withPart(part, { citizens }) : null;
        });
    }

    /** Remplace les parties que `change` renvoie (les autres restent), avec leurs expéditions. */
    private replaceParts(change: (part: ExpeditionPart) => ExpeditionPart | null): void {
        this.state.update((state: DayExpeditionsState): DayExpeditionsState => {
            if (state.status !== 'loaded') return state;
            let changed: boolean = false;
            const expeditions: Expedition[] = state.expeditions.map((expedition: Expedition): Expedition => {
                let expedition_changed: boolean = false;
                const parts: ExpeditionPart[] = expedition.parts.map((part: ExpeditionPart): ExpeditionPart => {
                    const replaced: ExpeditionPart | null = change(part);
                    if (!replaced) return part;
                    expedition_changed = true;
                    return replaced;
                });
                if (!expedition_changed) return expedition;
                changed = true;
                return Object.assign(new Expedition(), expedition, { parts });
            });
            return changed ? { ...state, expeditions } : state;
        });
    }

    private hasExpedition(expedition_id: number | undefined): boolean {
        return expedition_id !== undefined && this.state().expeditions.some((expedition: Expedition): boolean => expedition.id === expedition_id);
    }

    private findPart(part_id: number): ExpeditionPart | null {
        for (const expedition of this.state().expeditions) {
            const part: ExpeditionPart | undefined = expedition.parts.find((candidate: ExpeditionPart): boolean => candidate.id === part_id);
            if (part) return part;
        }
        return null;
    }

    private hasCitizen(citizen_id: number): boolean {
        return this.state().expeditions.some((expedition: Expedition): boolean => expedition.parts
            .some((part: ExpeditionPart): boolean => part.citizens.some((citizen: CitizenExpedition): boolean => citizen.id === citizen_id)));
    }
}

function withPart(part: ExpeditionPart, changes: Partial<Pick<ExpeditionPart, 'orders' | 'citizens'>>): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), part, changes);
}

function withCitizen(citizen: CitizenExpedition, orders: ExpeditionOrder[]): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), citizen, { orders });
}
