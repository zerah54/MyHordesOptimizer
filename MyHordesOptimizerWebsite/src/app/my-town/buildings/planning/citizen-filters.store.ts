import { computed, inject, Injectable, linkedSignal, Signal, signal, WritableSignal } from '@angular/core';

import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenFilterSortStore } from '../../../_shared/citizen-filters/citizen-filter-sort.store';
import { CitizenFilterCriteria, citizenValueOptions, matchesCitizenFilter, sortByCitizen } from '../../../_shared/citizen-filters/citizen-filter-sort.util';
import { BuildingPlanContentDTO, PlanPool } from './plan.types';
import { PlanningStore } from './planning.store';
import { filterTrackingRows, TrackingFilters, TrackingRow, trackingRows, TrackingState, trackingSummary, trackingTaskOptions } from './tracking.util';

/**
 * Filtres des citoyens partagés par les panneaux Budget et Suivi de la page Chantiers (fourni par la page) : filtrer ou trier dans
 * l'un filtre ou trie aussi l'autre. Les critères portés par le citoyen (nom, métier, maison, actions, sac…) et le tri viennent du
 * `CitizenFilterSortStore` commun au site ; la consigne, l'état et la poche sont propres à la page.
 */
@Injectable()
export class CitizenFiltersStore {

    private readonly store: PlanningStore = inject(PlanningStore);
    /** Critères et tri communs au site. */
    public readonly citizen_filters: CitizenFilterSortStore = inject(CitizenFilterSortStore);

    /** Consigne retenue (clé de `taskFilterKey`), nulle = toutes. */
    public readonly task: WritableSignal<string | null> = signal<string | null>(null);
    public readonly state: WritableSignal<TrackingState | 'all'> = signal<TrackingState | 'all'>('all');
    public readonly pool: WritableSignal<PlanPool | 'all'> = signal<PlanPool | 'all'>('all');

    /** Toutes les lignes du jour affiché. */
    public readonly rows: Signal<TrackingRow[]> = computed((): TrackingRow[] => {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        return draft === null ? [] : trackingRows(this.store.citizens_full(), this.store.citizens(), draft, this.store.selected_day(), this.store.homes());
    });

    public readonly filters: Signal<TrackingFilters> = computed((): TrackingFilters => {
        const criteria: CitizenFilterCriteria = this.citizen_filters.criteria();
        const day: number = this.store.selected_day();
        return {
            citizen_match: (citizen: Citizen): boolean => matchesCitizenFilter(citizen, criteria, day),
            task: this.task(),
            state: this.state(),
            pool: this.pool()
        };
    });

    /** Lignes retenues par les filtres, dans l'ordre du tri choisi (ordre de la ville sans tri). */
    public readonly shown_rows: Signal<TrackingRow[]> = computed((): TrackingRow[] => sortByCitizen(
        filterTrackingRows(this.rows(), this.filters()),
        (row: TrackingRow): Citizen => row.citizen,
        this.citizen_filters.sort_field(),
        this.citizen_filters.sort_direction(),
        this.store.selected_day()
    ));

    /** Citoyens retenus par les filtres. */
    public readonly shown_user_ids: Signal<ReadonlySet<number>> = computed((): ReadonlySet<number> =>
        new Set<number>(this.shown_rows().map((row: TrackingRow): number => row.citizen.id)));

    /** Citoyens cochés pour l'ajout groupé ; un citoyen masqué par les filtres en sort. */
    public readonly selected: WritableSignal<ReadonlySet<number>> = linkedSignal<ReadonlySet<number>, ReadonlySet<number>>({
        source: this.shown_user_ids,
        computation: (shown: ReadonlySet<number>, previous?: { source: ReadonlySet<number>; value: ReadonlySet<number> }): ReadonlySet<number> =>
            new Set<number>([...previous?.value ?? []].filter((user_id: number): boolean => shown.has(user_id)))
    });

    /** Tous les citoyens affichés sont cochés. */
    public readonly all_selected: Signal<boolean> = computed((): boolean => this.selected().size > 0 && this.selected().size === this.shown_user_ids().size);

    /** Compteur « x / y ont terminé », selon les filtres et la consigne choisie. */
    public readonly summary: Signal<{ done: number; total: number }> = computed((): { done: number; total: number } => trackingSummary(this.rows(), this.filters()));

    /** Filtre de poche utile seulement s'il y a des bannis. */
    public readonly has_banned: Signal<boolean> = computed((): boolean => this.rows().some((row: TrackingRow): boolean => row.pool === 'banned'));

    /** Un filtre au moins est actif. */
    public readonly filtered: Signal<boolean> = computed((): boolean =>
        this.citizen_filters.active_count() > 0 || this.task() !== null || this.state() !== 'all' || this.pool() !== 'all');

    /** Valeurs présentes chez les citoyens pour chaque champ à niveau (options du panneau de filtres). */
    public readonly value_options: Signal<Record<string, number[]>> = computed((): Record<string, number[]> => citizenValueOptions(this.store.citizens_full()));

    /** Types et actions de consigne présents. */
    public readonly task_options: Signal<{ key: string; label: string }[]> = computed((): { key: string; label: string }[] => trackingTaskOptions(this.rows()));

    /**
     * Coche ou décoche un citoyen.
     * @param {number} user_id Citoyen.
     */
    public toggle(user_id: number): void {
        const selected: Set<number> = new Set<number>(this.selected());
        if (!selected.delete(user_id)) {
            selected.add(user_id);
        }
        this.selected.set(selected);
    }

    /** Coche tous les citoyens affichés, ou les décoche tous s'ils l'étaient déjà. */
    public toggleAll(): void {
        this.selected.set(this.all_selected() ? new Set<number>() : new Set<number>(this.shown_user_ids()));
    }

    /** Rétablit tous les filtres (le tri est conservé). */
    public reset(): void {
        this.citizen_filters.reset();
        this.task.set(null);
        this.state.set('all');
        this.pool.set('all');
    }
}
