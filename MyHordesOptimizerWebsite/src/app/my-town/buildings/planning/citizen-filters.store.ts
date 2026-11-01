import { computed, inject, Injectable, linkedSignal, Signal, signal, WritableSignal } from '@angular/core';

import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { BuildingPlanContentDTO, PlanPool } from './plan.types';
import { PlanningStore } from './planning.store';
import { filterTrackingRows, TrackingFilters, TrackingRow, trackingRows, TrackingState, trackingSummary, trackingTaskOptions } from './tracking.util';

/**
 * Filtres des citoyens partagés par les panneaux Budget et Suivi de la page Chantiers (fourni par la page) :
 * filtrer dans l'un filtre aussi l'autre.
 */
@Injectable()
export class CitizenFiltersStore {

    private readonly store: PlanningStore = inject(PlanningStore);

    /** Métiers retenus (vide = tous). */
    public readonly jobs: WritableSignal<ReadonlySet<string>> = signal<ReadonlySet<string>>(new Set<string>());
    /** Consigne retenue (clé de `taskFilterKey`), nulle = toutes. */
    public readonly task: WritableSignal<string | null> = signal<string | null>(null);
    public readonly state: WritableSignal<TrackingState | 'all'> = signal<TrackingState | 'all'>('all');
    public readonly pool: WritableSignal<PlanPool | 'all'> = signal<PlanPool | 'all'>('all');

    /** Toutes les lignes du jour affiché. */
    public readonly rows: Signal<TrackingRow[]> = computed((): TrackingRow[] => {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        return draft === null ? [] : trackingRows(this.store.citizens_full(), this.store.citizens(), draft, this.store.selected_day(), this.store.homes());
    });

    public readonly filters: Signal<TrackingFilters> = computed((): TrackingFilters => ({ jobs: this.jobs(), task: this.task(), state: this.state(), pool: this.pool() }));

    /** Lignes retenues par les filtres. */
    public readonly shown_rows: Signal<TrackingRow[]> = computed((): TrackingRow[] => filterTrackingRows(this.rows(), this.filters()));

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
        this.jobs().size > 0 || this.task() !== null || this.state() !== 'all' || this.pool() !== 'all');

    /** Métiers présents dans la ville, dans l'ordre du référentiel. */
    public readonly job_options: Signal<JobEnum[]> = computed((): JobEnum[] => {
        const present: Set<string> = new Set<string>(this.store.citizens_full().map((citizen: Citizen): string => citizen.job?.key ?? ''));
        return JobEnum.getAllValues<JobEnum>().filter((job: JobEnum): boolean => present.has(job.key));
    });

    /** Types et actions de consigne présents. */
    public readonly task_options: Signal<{ key: string; label: string }[]> = computed((): { key: string; label: string }[] => trackingTaskOptions(this.rows()));

    /**
     * Retient les métiers choisis.
     * @param {string[]} keys Clés `JobEnum`.
     */
    public onJobs(keys: string[]): void {
        this.jobs.set(new Set<string>(keys));
    }

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

    /** Rétablit tous les filtres. */
    public reset(): void {
        this.jobs.set(new Set<string>());
        this.task.set(null);
        this.state.set('all');
        this.pool.set('all');
    }
}
