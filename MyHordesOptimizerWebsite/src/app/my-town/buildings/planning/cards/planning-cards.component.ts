import { ChangeDetectionStrategy, Component, computed, inject, model, ModelSignal, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Imports } from '../../../../_abstract_model/types/_types';
import { StepResult } from '../building-progress.util';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, isBuildingStep, PlanDefenseSourceDTO } from '../plan.types';
import { alertCard, PlanAlert } from '../plan-alerts.util';
import { DayEvaluation } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { ResourceCount } from '../resources.util';
import { TrackingRow } from '../tracking.util';

const material_modules: Imports = [MatIconModule];

/** Sujet de la page Chantiers. */
export type PlanningCard = 'program' | 'tracking' | 'budget' | 'resources' | 'defense';

/** Cartes cliquables de la page Chantiers : l'état de chaque sujet, qui s'affiche en dessous quand on le choisit. */
@Component({
    selector: 'mho-planning-cards',
    templateUrl: './planning-cards.component.html',
    styleUrls: ['./planning-cards.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class PlanningCardsComponent {

    /** Carte choisie. */
    public readonly selected: ModelSignal<PlanningCard> = model<PlanningCard>('program');

    protected readonly store: PlanningStore = inject(PlanningStore);

    /** Jour à venir : aucune consigne ne peut encore être faite. */
    protected readonly future: Signal<boolean> = computed((): boolean => this.store.selected_day() > this.store.current_day);

    /** Nombre de chantiers au programme, toutes poches confondues. */
    protected readonly step_count: Signal<number> = computed((): number => {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        return draft === null ? 0 : [...draft.programs.banned, ...draft.programs.regular].filter(isBuildingStep).length;
    });

    /** PA prévus par le programme. */
    protected readonly planned_pa: Signal<number> = computed((): number =>
        (this.store.evaluation()?.results ?? []).reduce((total: number, result: StepResult): number => total + result.paCost, 0));

    /** Consignes individuelles faites et prévues, indépendamment des filtres du suivi. */
    protected readonly tasks: Signal<{ done: number; total: number }> = computed((): { done: number; total: number } =>
        this.filters.rows().reduce((sum: { done: number; total: number }, row: TrackingRow): { done: number; total: number } =>
            ({ done: sum.done + row.done_count, total: sum.total + row.tasks.length }), { done: 0, total: 0 }));

    /** Objets manquants, nul sans évaluation. */
    protected readonly missing_count: Signal<number | null> = computed((): number | null => {
        const evaluation: DayEvaluation | null = this.store.evaluation();
        return evaluation === null ? null : evaluation.missing.reduce((total: number, resource: ResourceCount): number => total + resource.count, 0);
    });

    /** Défense apportée par les sources libres. */
    protected readonly sources_defense: Signal<number> = computed((): number =>
        (this.store.draft()?.defenseSources ?? []).reduce((total: number, source: PlanDefenseSourceDTO): number => total + source.def * source.qty, 0));

    /** Alertes portées par la carte Programme. */
    protected readonly program_alerts: Signal<number> = computed((): number => this.countAlerts('program'));

    /** Alertes portées par la carte Citoyens et budget. */
    protected readonly budget_alerts: Signal<number> = computed((): number => this.countAlerts('budget'));

    private readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);

    /**
     * Compte les alertes d'une carte.
     * @param {'program' | 'budget'} card Carte.
     * @returns {number} Nombre d'alertes.
     */
    private countAlerts(card: 'program' | 'budget'): number {
        return this.store.alerts().filter((alert: PlanAlert): boolean => alertCard(alert) === card).length;
    }
}
