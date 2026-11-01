import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { Item } from '../../../_abstract_model/types/item.class';
import { StepResult } from './building-progress.util';
import { PlanStepDTO, PlanStepMode, PlanTaskDTO, stepMode } from './plan.types';
import { HomeLevelRef } from './plan-evaluation.util';

/**
 * Libellé d'un objet : dans la langue demandée, sinon son uid, sinon son identifiant.
 * @param {readonly Item[]} items Objets connus.
 * @param {number} item_id Identifiant de l'objet.
 * @param {string} locale Langue du site.
 * @returns {string} Libellé affichable.
 */
export function itemLabel(items: readonly Item[], item_id: number, locale: string): string {
    const item: Item | undefined = items.find((candidate: Item): boolean => candidate.id === item_id);
    return item === undefined ? `#${item_id}` : (item.label?.[locale] ?? item.uid);
}

/**
 * Rapport défense / coût affiché : deux décimales, « ∞ » pour un coût nul avec de la défense, « — » sans rapport.
 * @param {number | null} ratio Rapport calculé.
 * @returns {string} Texte affichable.
 */
export function ratioLabel(ratio: number | null): string {
    if (ratio === null) {
        return '—';
    }
    return Number.isFinite(ratio) ? ratio.toFixed(2) : '∞';
}

/**
 * Texte d'une étape de programme selon son mode : terminer, laisser à N PA, réparer entièrement, pour passer la nuit ou
 * jusqu'à N PV (ces deux derniers avec leur coût estimé).
 * @param {string} label Libellé du chantier.
 * @param {StepResult} result Étape évaluée.
 * @param {number} max_life PV max du chantier.
 * @returns {string} Texte affichable.
 */
export function stepLabel(label: string, result: StepResult, max_life: number): string {
    const step: PlanStepDTO = result.step;
    const mode: PlanStepMode = stepMode(step);
    const cost: number = result.paCost;
    if (step.kind === 'build') {
        return mode === 'leave'
            ? $localize`Laisser ${label}:label: à ${step.targetRemaining}:remaining: :ap:`
            : $localize`Terminer ${label}:label:`;
    }
    if (mode === 'survive') {
        return $localize`Réparer ${label}:label: pour passer la nuit (≈ ${cost}:cost: :ap:)`;
    }
    if (mode === 'leave') {
        const life: number = Math.max(0, max_life - step.targetRemaining);
        return $localize`Réparer ${label}:label: jusqu'à ${life}:life:/${max_life}:max: PV (≈ ${cost}:cost: :ap:)`;
    }
    return $localize`Réparer entièrement ${label}:label:`;
}

/**
 * Libellé d'une consigne : niveau de maison traduit, action de chantier, amélioration et niveau visé, ou texte libre ;
 * « — » s'il est vide.
 * @param {PlanTaskDTO} task Consigne du citoyen.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Niveaux de maison du référentiel.
 * @returns {string} Texte affichable, sans coût.
 */
export function taskLabel(task: PlanTaskDTO, homes: ReadonlyMap<number, HomeLevelRef>): string {
    if (task.kind === 'home') {
        return task.level === undefined || task.level === null ? '—' : (homes.get(task.level)?.label ?? `#${task.level}`);
    }
    if (task.kind === 'action') {
        return DailyActionEnum.getByKey<DailyActionEnum>(task.ref ?? '')?.getLabel() ?? task.ref ?? '—';
    }
    const upgrade: HomeEnum | undefined = task.kind === 'homeUpgrade' && typeof task.ref === 'string' ? HomeEnum.getByKey<HomeEnum>(task.ref) : undefined;
    if (upgrade !== undefined) {
        return upgrade.value.max_lvl > 1 && typeof task.level === 'number' ? `${upgrade.getLabel()} ${$localize`niv.`} ${task.level}` : upgrade.getLabel();
    }
    return task.label === undefined || task.label === null || task.label === '' ? '—' : task.label;
}
