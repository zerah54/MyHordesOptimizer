import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

import { Imports } from '../../../../_abstract_model/types/_types';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../_shared/confirm-dialog/confirm-dialog.component';
import { DaySelectorComponent } from '../../../../_shared/day-selector/day-selector.component';
import { PlanningCopyDayDialogComponent, PlanningCopyDayDialogData, PlanningCopyDayDialogResult } from '../copy-day-dialog/planning-copy-day-dialog.component';
import { PlanningNameDialogComponent, PlanningNameDialogData, PlanningNameDialogResult } from '../name-dialog/planning-name-dialog.component';
import { BuildingPlanContentDTO, BuildingPlanDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { confirmDiscardChanges } from '../unsaved-changes.util';

const components: Imports = [DaySelectorComponent];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatIconModule, MatMenuModule, MatSlideToggleModule, MatTooltipModule];

/** En-tête de la page Chantiers : jour, propositions en puces (menu par proposition), gestion des bannis, état de l'enregistrement. */
@Component({
    selector: 'mho-planning-header',
    templateUrl: './planning-header.component.html',
    styleUrls: ['./planning-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class PlanningHeaderComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);

    private readonly dialog: MatDialog = inject(MatDialog);
    /** Départ de la proposition en cours (enregistrement, confirmation) : toute autre demande de changement est ignorée. */
    private leaving: boolean = false;

    /**
     * Vrai pour la proposition affichée.
     * @param {BuildingPlanDTO} plan Proposition.
     * @returns {boolean} Vrai si sélectionnée.
     */
    protected isSelected(plan: BuildingPlanDTO): boolean {
        return this.store.selected_plan()?.id === plan.id;
    }

    /**
     * Affiche un autre jour, après confirmation s'il reste des modifications non enregistrées.
     * @param {number} day Jour choisi.
     */
    protected selectDay(day: number): void {
        if (day === this.store.selected_day()) {
            return;
        }
        this.afterDiscardConfirmed((): void => this.store.selectDay(day));
    }

    /**
     * Affiche une autre proposition, après confirmation s'il reste des modifications non enregistrées.
     * @param {number} plan_id Proposition choisie.
     */
    protected selectPlan(plan_id: number): void {
        if (plan_id === this.store.selected_plan()?.id) {
            return;
        }
        this.afterDiscardConfirmed((): void => this.store.selectPlan(plan_id));
    }

    /**
     * Active ou coupe la gestion des bannis sur la proposition affichée.
     * @param {boolean} checked Nouvel état.
     */
    protected onManageBanned(checked: boolean): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.manageBanned = checked;
        });
    }

    /**
     * Prévoit ou non la ville en chaos le jour affiché (jour à venir).
     * @param {boolean} checked Nouvel état.
     */
    protected onPlannedChaos(checked: boolean): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.chaos = checked;
        });
    }

    /** Crée une proposition : vide, ou copie de la proposition affichée. */
    protected newPlan(): void {
        this.askName({ title: $localize`Nouvelle proposition`, name: $localize`Plan`, offerCopy: this.store.selected_plan() !== null },
                     (result: PlanningNameDialogResult): void => {
                         if (result.copy) {
                             // La copie emporte la copie de travail : rien n'est perdu.
                             this.store.duplicatePlan(result.name);
                         } else {
                             this.afterDiscardConfirmed((): void => this.store.createPlan(result.name));
                         }
                     });
    }

    /** Renomme la proposition affichée. */
    protected rename(): void {
        const plan: BuildingPlanDTO | null = this.store.selected_plan();
        if (plan !== null) {
            this.askName({ title: $localize`Renommer la proposition`, name: plan.name, offerCopy: false },
                         (result: PlanningNameDialogResult): void => this.store.renamePlan(result.name));
        }
    }

    /** Duplique la proposition affichée (copie de travail comprise) sous un nouveau nom. */
    protected duplicate(): void {
        const plan: BuildingPlanDTO | null = this.store.selected_plan();
        if (plan !== null) {
            this.askName({ title: $localize`Dupliquer la proposition`, name: plan.name, offerCopy: false },
                         (result: PlanningNameDialogResult): void => this.store.duplicatePlan(result.name));
        }
    }

    /** Remplace les parties cochées de la proposition affichée par celles d'un autre jour (choisi dans la boîte). */
    protected copyFromDay(): void {
        this.askDayAndName($localize`Copier depuis le jour`, (result: PlanningCopyDayDialogResult): void =>
            this.store.copyPlanFromDay(result.day, result.parts), false, true);
    }

    /** Copie la proposition du jour affiché vers un autre jour (choisi dans la boîte), sous un nouveau nom. */
    protected copyToDay(): void {
        this.askDayAndName($localize`Copier vers le jour`, (result: PlanningCopyDayDialogResult): void =>
            this.store.copyPlanBetweenDays(this.store.selected_day(), result.day, result.name), true, false);
    }

    /** Supprime la proposition affichée après confirmation (elle est partagée par toute la ville). */
    protected remove(): void {
        const plan: BuildingPlanDTO | null = this.store.selected_plan();
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
     * Applique une action qui remplace la copie de travail, après enregistrement ; confirmation seulement si celui-ci échoue.
     * Ignorée tant qu'un départ est en cours.
     * @param {() => void} apply Action à appliquer.
     */
    private afterDiscardConfirmed(apply: () => void): void {
        if (this.leaving) {
            return;
        }
        this.leaving = true;
        confirmDiscardChanges(this.store, this.dialog).pipe(finalize((): void => {
            this.leaving = false;
        })).subscribe((confirmed: boolean): void => {
            if (confirmed) {
                apply();
            }
        });
    }

    /**
     * Demande un jour et un nom (ou les parties à copier) puis applique l'action ; une boîte annulée ne fait rien.
     * @param {string} title Titre de la boîte.
     * @param {(result: PlanningCopyDayDialogResult) => void} apply Action à appliquer.
     * @param {boolean} future_only Ne propose que les jours à partir d'aujourd'hui (cible d'une copie).
     * @param {boolean} ask_parts Demande les parties à copier au lieu du nom.
     */
    private askDayAndName(title: string, apply: (result: PlanningCopyDayDialogResult) => void, future_only: boolean, ask_parts: boolean): void {
        const plan: BuildingPlanDTO | null = this.store.selected_plan();
        const today: number = this.store.current_day;
        const days: number[] = future_only ? this.store.days().filter((day: number): boolean => day >= today) : this.store.days();
        const data: PlanningCopyDayDialogData = {
            title, name: plan === null ? '' : $localize`${plan.name}:name: (copie)`, day: Math.max(this.store.selected_day(), future_only ? today : 0), days, today, askParts: ask_parts
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
