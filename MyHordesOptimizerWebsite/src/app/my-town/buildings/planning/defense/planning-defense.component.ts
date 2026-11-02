import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Building } from '../../../../_abstract_model/types/building.class';
import { BuildingProgress } from '../building-progress.util';
import { BuildingPlanContentDTO, PlanDefenseSourceDTO, PlanLossDTO, PlanLossKind } from '../plan.types';
import { BuildingRef, PlannedLoss } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule];

/** Chantier proposé pour une perte prévue. */
interface LossCandidate {
    id: number;
    label: string;
    icon: string;
}

/**
 * Panneau « Défense » : sources de défense libres (objets posés, veilleurs…) et pertes prévues cette nuit (chantier laissé
 * détruire, bonus d'évolution perdu).
 */
@Component({
    selector: 'mho-planning-defense',
    templateUrl: './planning-defense.component.html',
    styleUrls: ['./planning-defense.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class PlanningDefenseComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    /** Chantiers construits au soir (hors temporaires), triés par nom : ceux sur lesquels une perte peut être prévue. */
    protected readonly loss_candidates: Signal<LossCandidate[]> = computed((): LossCandidate[] => {
        const progress: ReadonlyMap<number, BuildingProgress> | undefined = this.store.evaluation()?.progressAfter;
        const icons: Map<number, string> = new Map<number, string>(this.store.catalog().map((building: Building): [number, string] => [building.id, building.img]));
        const candidates: LossCandidate[] = [];
        this.store.buildings().forEach((building: BuildingRef, id: number): void => {
            if (!building.temporary && progress?.get(id)?.built === true) {
                const img: string | undefined = icons.get(id);
                candidates.push({ id, label: building.label, icon: img ? HORDES_IMG_REPO + img : '' });
            }
        });
        return candidates.sort((a: LossCandidate, b: LossCandidate): number => a.label.localeCompare(b.label));
    });

    /**
     * Défense retirée par une perte prévue, telle que l'évaluation la compte ; nulle si le chantier n'est pas construit au soir.
     * @param {PlanLossDTO} loss Perte prévue.
     * @returns {number | null} Défense retirée.
     */
    protected lossDefense(loss: PlanLossDTO): number | null {
        return this.store.evaluation()?.losses.find((candidate: PlannedLoss): boolean => candidate.buildingId === loss.buildingId && candidate.kind === loss.kind)?.defense ?? null;
    }

    /** Ajoute une perte : premier chantier construit qui n'en a pas encore, laissé détruire. */
    protected addLoss(): void {
        const used: Set<number> = new Set<number>((this.store.draft()?.losses ?? []).map((loss: PlanLossDTO): number => loss.buildingId));
        const candidate: LossCandidate | undefined = this.loss_candidates().find((entry: LossCandidate): boolean => !used.has(entry.id)) ?? this.loss_candidates()[0];
        if (candidate === undefined) {
            return;
        }
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.losses = [...(content.losses ?? []), { buildingId: candidate.id, kind: 'destroyed' }];
        });
    }

    /**
     * Change le chantier ou le type d'une perte.
     * @param {number} index Rang de la perte.
     * @param {Partial<PlanLossDTO>} change Champ modifié.
     */
    protected setLoss(index: number, change: Partial<PlanLossDTO>): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const loss: PlanLossDTO | undefined = content.losses?.[index];
            if (loss !== undefined) {
                Object.assign(loss, change);
            }
        });
    }

    /**
     * Supprime une perte prévue.
     * @param {number} index Rang de la perte.
     */
    protected removeLoss(index: number): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.losses?.splice(index, 1);
        });
    }

    /**
     * Libellé d'un type de perte.
     * @param {PlanLossKind} kind Type.
     * @returns {string} Libellé.
     */
    protected lossKindLabel(kind: PlanLossKind): string {
        return kind === 'destroyed' ? $localize`Détruit cette nuit` : $localize`Bonus d'évolution perdu cette nuit`;
    }

    protected readonly loss_kinds: PlanLossKind[] = ['destroyed', 'bonus'];

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
