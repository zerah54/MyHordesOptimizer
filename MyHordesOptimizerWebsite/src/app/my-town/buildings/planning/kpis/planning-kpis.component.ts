import { ChangeDetectionStrategy, Component, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { Imports } from '../../../../_abstract_model/types/_types';
import { BuildingPlanContentDTO } from '../plan.types';
import { alertAnchor, PlanAlert } from '../plan-alerts.util';
import { DayEvaluation } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';
import { itemLabel } from '../planning-labels.util';
import { ResourceCount } from '../resources.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatTooltipModule];

/** Chiffres clés du plan, épinglés en haut de la page : défense, PA restants par poche, manques, alertes. */
@Component({
    selector: 'mho-planning-kpis',
    templateUrl: './planning-kpis.component.html',
    styleUrls: ['./planning-kpis.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.flat]': 'flat()'
    },
    imports: [...angular_common, ...material_modules]
})
export class PlanningKpisComponent {

    /** La défense seule, sans cadre : la page porte le budget, les manques et les alertes sur ses cartes. */
    public readonly flat: InputSignal<boolean> = input<boolean>(false);

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly editing: WritableSignal<boolean> = signal(false);

    private readonly locale: string = moment.locale();


    /**
     * État de la défense : reste à couvrir, surplus ou attaque inconnue.
     * @param {DayEvaluation} evaluation Évaluation du jour.
     * @returns {'gap' | 'surplus' | 'unknown'} État.
     */
    protected defenseState(evaluation: DayEvaluation): 'gap' | 'surplus' | 'unknown' {
        if (evaluation.defenseGap === null) {
            return 'unknown';
        }
        return evaluation.defenseGap > 0 ? 'gap' : 'surplus';
    }

    /**
     * Écart de défense sans signe.
     * @param {DayEvaluation} evaluation Évaluation du jour.
     * @returns {number} Écart absolu.
     */
    protected defenseAmount(evaluation: DayEvaluation): number {
        return Math.abs(evaluation.defenseGap ?? 0);
    }

    /**
     * Résumé des ressources manquantes.
     * @param {ResourceCount[]} missing Manques.
     * @returns {string} « 2 Bois, 1 Ferraille ».
     */
    protected missingLabel(missing: ResourceCount[]): string {
        return missing.map((resource: ResourceCount): string => `${resource.count} ${itemLabel(this.store.items(), resource.itemId, this.locale)}`).join(', ');
    }

    /**
     * Amène à l'élément du programme concerné par une alerte.
     * @param {PlanAlert} alert Alerte choisie.
     */
    protected goTo(alert: PlanAlert): void {
        const id: string | null = alertAnchor(alert);
        if (id !== null) {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Applique l'attaque saisie après un court délai ; un champ vide revient à l'attaque estimée.
     * @param {unknown} value Valeur saisie.
     */
    protected onAttack(value: unknown): void {
        const attack: number | null = value === null || value === undefined || value === '' ? null : toNonNegativeInt(value);
        this.store.deferEdit('attack', (content: BuildingPlanContentDTO): void => {
            content.attackOverride = attack;
        });
    }

    /**
     * Applique le débordement autorisé après un court délai.
     * @param {unknown} value Valeur saisie ; invalide ou négative = 0.
     */
    protected onOverflow(value: unknown): void {
        const overflow: number = toNonNegativeInt(value);
        this.store.deferEdit('overflow', (content: BuildingPlanContentDTO): void => {
            content.allowedOverflow = overflow;
        });
    }
}
