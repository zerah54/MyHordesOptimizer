import { ChangeDetectionStrategy, Component, computed, inject, model, ModelSignal, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { Imports } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { StepResult } from '../building-progress.util';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, isBuildingStep, PlanDefenseSourceDTO } from '../plan.types';
import { alertCard, PlanAlert } from '../plan-alerts.util';
import { PlanningStore } from '../planning.store';
import { itemIcon, itemLabel } from '../planning-labels.util';
import { ResourceCount } from '../resources.util';
import { TrackingRow } from '../tracking.util';

const material_modules: Imports = [MatIconModule, MatTooltipModule];

/** Pastille d'un objet manquant. */
interface MissingChip {
    itemId: number;
    label: string;
    /** Chemin complet de l'icône, vide si l'objet est inconnu. */
    icon: string;
    count: number;
}

/** Sujet de la page Chantiers. */
export type PlanningCard = 'program' | 'tracking' | 'budget' | 'resources' | 'defense';

/** Cartes cliquables de la page Chantiers : l'état de chaque sujet, qui s'affiche en dessous quand on le choisit. */
@Component({
    selector: 'mho-planning-cards',
    templateUrl: './planning-cards.component.html',
    styleUrls: ['./planning-cards.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IconApComponent, ...material_modules]
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

    /** Objets manquants, vide sans évaluation. */
    protected readonly missing_items: Signal<MissingChip[]> = computed((): MissingChip[] => {
        const items: readonly Item[] = this.store.items();
        return (this.store.evaluation()?.missing ?? []).map((resource: ResourceCount): MissingChip => ({
            itemId: resource.itemId,
            label: itemLabel(items, resource.itemId, this.locale),
            icon: itemIcon(items, resource.itemId),
            count: resource.count
        }));
    });

    /** Défense apportée par les sources libres. */
    protected readonly sources_defense: Signal<number> = computed((): number =>
        (this.store.draft()?.defenseSources ?? []).reduce((total: number, source: PlanDefenseSourceDTO): number => total + source.def * source.qty, 0));

    /** Alertes portées par la carte Programme. */
    protected readonly program_alerts: Signal<number> = computed((): number => this.countAlerts('program'));

    /** Alertes portées par la carte Citoyens et budget. */
    protected readonly budget_alerts: Signal<number> = computed((): number => this.countAlerts('budget'));

    private readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    private readonly locale: string = moment.locale();

    /**
     * Compte les alertes d'une carte.
     * @param {'program' | 'budget'} card Carte.
     * @returns {number} Nombre d'alertes.
     */
    private countAlerts(card: 'program' | 'budget'): number {
        return this.store.alerts().filter((alert: PlanAlert): boolean => alertCard(alert) === card).length;
    }
}
