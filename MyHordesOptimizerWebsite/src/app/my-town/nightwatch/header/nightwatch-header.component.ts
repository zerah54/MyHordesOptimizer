import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../_abstract_model/types/_types';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { DaySelectorComponent } from '../../../_shared/day-selector/day-selector.component';
import {
    PlanningCopyDayDialogComponent,
    PlanningCopyDayDialogData,
    PlanningCopyDayDialogResult
} from '../../buildings/planning/copy-day-dialog/planning-copy-day-dialog.component';
import {
    PlanningNameDialogComponent,
    PlanningNameDialogData,
    PlanningNameDialogResult
} from '../../buildings/planning/name-dialog/planning-name-dialog.component';
import { NightwatchStore } from '../nightwatch.store';
import { NightwatchPlanDTO, NightwatchSimulationDTO } from '../nightwatch.types';
import { defaultPlanName } from '../nightwatch-plan-name';

const components: Imports = [DaySelectorComponent];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** En-tête de la page Veilles : jour, propositions en puces (menu par proposition), état de l'enregistrement. */
@Component({
    selector: 'mho-nightwatch-header',
    templateUrl: './nightwatch-header.component.html',
    styleUrls: ['./nightwatch-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class NightwatchHeaderComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);

    private readonly dialog: MatDialog = inject(MatDialog);

    /**
     * Vrai pour la proposition affichée.
     * @param {NightwatchPlanDTO} plan Proposition.
     * @returns {boolean} Vrai si sélectionnée.
     */
    protected isSelected(plan: NightwatchPlanDTO): boolean {
        return this.store.selected_plan()?.id === plan.id;
    }

    /**
     * Libellé de la puce : nom de la proposition, suivi de celui de sa simulation s'il y en a une et qu'il diffère.
     * @param {NightwatchPlanDTO} plan Proposition.
     * @returns {string} Libellé.
     */
    protected chipLabel(plan: NightwatchPlanDTO): string {
        const simulation: NightwatchSimulationDTO | undefined = plan.simulationId === null || plan.simulationId === undefined
            ? undefined
            : this.store.simulations().find((candidate: NightwatchSimulationDTO): boolean => candidate.id === plan.simulationId);
        return simulation === undefined || simulation.name === plan.name ? plan.name : `${plan.name} (${simulation.name})`;
    }

    /**
     * Affiche un autre jour.
     * @param {number} day Jour choisi.
     */
    protected selectDay(day: number): void {
        if (day !== this.store.selected_day()) {
            this.store.selectDay(day);
        }
    }

    /**
     * Affiche une autre proposition.
     * @param {number} plan_id Proposition choisie.
     */
    protected selectPlan(plan_id: number): void {
        if (plan_id !== this.store.selected_plan()?.id) {
            this.store.selectPlan(plan_id);
        }
    }

    /** Crée une proposition : vide, ou copie de la proposition affichée. */
    protected newPlan(): void {
        this.askName({ title: $localize`Nouvelle proposition`, name: defaultPlanName(), offerCopy: this.store.selected_plan() !== null },
                     (result: PlanningNameDialogResult): void => {
                         if (result.copy) {
                             this.store.duplicatePlan(result.name);
                         } else {
                             this.store.createPlan(result.name);
                         }
                     });
    }

    /** Renomme la proposition affichée. */
    protected rename(): void {
        const plan: NightwatchPlanDTO | null = this.store.selected_plan();
        if (plan !== null) {
            this.askName({ title: $localize`Renommer la proposition`, name: plan.name, offerCopy: false },
                         (result: PlanningNameDialogResult): void => this.store.renamePlan(result.name));
        }
    }

    /** Duplique la proposition affichée sous un nouveau nom. */
    protected duplicate(): void {
        const plan: NightwatchPlanDTO | null = this.store.selected_plan();
        if (plan !== null) {
            this.askName({ title: $localize`Dupliquer la proposition`, name: plan.name, offerCopy: false },
                         (result: PlanningNameDialogResult): void => this.store.duplicatePlan(result.name));
        }
    }

    /** Remplace veilleurs et consignes de la proposition affichée par ceux d'un autre jour (choisi dans la boîte). */
    protected copyFromDay(): void {
        this.askDay($localize`Copier depuis le jour`, false, false, (result: PlanningCopyDayDialogResult): void => this.store.copyPlanFromDay(result.day));
    }

    /** Copie la proposition du jour affiché vers un autre jour (choisi dans la boîte), sous un nouveau nom. */
    protected copyToDay(): void {
        this.askDay($localize`Copier vers le jour`, true, true, (result: PlanningCopyDayDialogResult): void =>
            this.store.copyPlanBetweenDays(this.store.selected_day(), result.day, result.name));
    }

    /** Supprime la proposition affichée après confirmation (elle est partagée par toute la ville). */
    protected remove(): void {
        const plan: NightwatchPlanDTO | null = this.store.selected_plan();
        if (plan === null) {
            return;
        }
        this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
            data: { title: $localize`Supprimer la proposition`, text: $localize`La proposition « ${plan.name}:name: » sera supprimée pour toute la ville.` }
        })
            .afterClosed()
            .subscribe((confirmed: boolean | undefined): void => {
                if (confirmed) {
                    this.store.deletePlan();
                }
            });
    }

    /**
     * Demande un jour (et un nom pour une copie vers un jour) puis applique l'action ; une boîte annulée ne fait rien.
     * @param {string} title Titre de la boîte.
     * @param {boolean} future_only Ne propose que les jours à partir d'aujourd'hui (cible d'une copie).
     * @param {boolean} ask_name Demande le nom de la nouvelle proposition.
     * @param {(result: PlanningCopyDayDialogResult) => void} apply Action à appliquer.
     */
    private askDay(title: string, future_only: boolean, ask_name: boolean, apply: (result: PlanningCopyDayDialogResult) => void): void {
        const plan: NightwatchPlanDTO | null = this.store.selected_plan();
        const today: number = this.store.current_day;
        const days: number[] = future_only ? this.store.days().filter((day: number): boolean => day >= today) : this.store.days();
        const data: PlanningCopyDayDialogData = {
            title, name: plan === null ? '' : $localize`${plan.name}:name: (copie)`, day: Math.max(this.store.selected_day(), future_only ? today : 0), days, today,
            askParts: false, askName: ask_name
        };
        this.dialog.open<PlanningCopyDayDialogComponent, PlanningCopyDayDialogData, PlanningCopyDayDialogResult>(PlanningCopyDayDialogComponent, { data, width: '24rem', maxWidth: '95vw' })
            .afterClosed()
            .subscribe((result: PlanningCopyDayDialogResult | undefined): void => {
                if (result !== undefined) {
                    apply(result);
                }
            });
    }

    /**
     * Demande un nom puis applique l'action ; une boîte annulée ne fait rien.
     * @param {PlanningNameDialogData} data Paramètres de la boîte.
     * @param {(result: PlanningNameDialogResult) => void} apply Action à appliquer.
     */
    private askName(data: PlanningNameDialogData, apply: (result: PlanningNameDialogResult) => void): void {
        this.dialog.open<PlanningNameDialogComponent, PlanningNameDialogData, PlanningNameDialogResult>(PlanningNameDialogComponent, { data, width: '24rem', maxWidth: '95vw' })
            .afterClosed()
            .subscribe((result: PlanningNameDialogResult | undefined): void => {
                if (result !== undefined) {
                    apply(result);
                }
            });
    }
}
