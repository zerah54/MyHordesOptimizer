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
    PlanningNameDialogComponent,
    PlanningNameDialogData,
    PlanningNameDialogResult
} from '../../buildings/planning/name-dialog/planning-name-dialog.component';
import { NightwatchStore } from '../nightwatch.store';
import { NightwatchPlanDTO } from '../nightwatch.types';
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
