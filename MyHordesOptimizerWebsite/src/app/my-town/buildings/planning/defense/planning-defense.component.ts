import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../../_abstract_model/types/_types';
import { BuildingPlanContentDTO, PlanDefenseSourceDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

/** Panneau « Défense hors chantiers » : sources de défense libres (objets posés, veilleurs…). */
@Component({
    selector: 'mho-planning-defense',
    templateUrl: './planning-defense.component.html',
    styleUrls: ['./planning-defense.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class PlanningDefenseComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);


    /** Ajoute une source de défense vide. */
    protected addSource(): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.defenseSources.push({ label: '', pa: 0, def: 0, qty: 1 });
        });
    }

    /**
     * Supprime une source de défense.
     * @param {number} index Rang de la source.
     */
    protected removeSource(index: number): void {
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.defenseSources.splice(index, 1);
        });
    }

    /**
     * Applique le libellé d'une source après un court délai.
     * @param {number} index Rang de la source.
     * @param {string} value Libellé saisi.
     */
    protected onSourceLabel(index: number, value: string): void {
        this.store.deferEdit(`source-label:${index}`, this.sourceEdit(index, (source: PlanDefenseSourceDTO): void => {
            source.label = value;
        }));
    }

    /**
     * Applique un nombre saisi sur une source (PA, défense ou quantité) après un court délai.
     * @param {number} index Rang de la source.
     * @param {'pa' | 'def' | 'qty'} field Champ modifié.
     * @param {unknown} value Valeur saisie ; invalide ou négative = 0.
     */
    protected onSourceNumber(index: number, field: 'pa' | 'def' | 'qty', value: unknown): void {
        const parsed: number = toNonNegativeInt(value);
        this.store.deferEdit(`source-${field}:${index}`, this.sourceEdit(index, (source: PlanDefenseSourceDTO): void => {
            source[field] = parsed;
        }));
    }

    /**
     * Modification d'une source de défense, sans effet si la source a disparu.
     * @param {number} index Rang de la source.
     * @param {(source: PlanDefenseSourceDTO) => void} mutate Modification.
     * @returns {(content: BuildingPlanContentDTO) => void} Modification de la copie de travail.
     */
    private sourceEdit(index: number, mutate: (source: PlanDefenseSourceDTO) => void): (content: BuildingPlanContentDTO) => void {
        return (content: BuildingPlanContentDTO): void => {
            const source: PlanDefenseSourceDTO | undefined = content.defenseSources[index];
            if (source !== undefined) {
                mutate(source);
            }
        };
    }
}
