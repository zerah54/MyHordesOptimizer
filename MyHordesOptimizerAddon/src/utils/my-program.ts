import { DAILY_ACTION_LABELS } from '../data/daily-action-labels';
import { HOME_UPGRADES, HOUSE_LEVEL_KEY, HOUSE_LEVEL_LABELS } from '../data/home-labels';
import { expedition_texts, program_texts } from '../i18n/texts';
import type { ApiCitizen, I18nLabel } from '../types';
import type { ApiBuildingPlan, PlanContent, PlanStep, PlanStepMode, PlanTask, TownBuildingState } from '../types/building-plan';
import { getI18N } from './i18n';

/** Uid du Bureau des esclavagistes. */
export const SLAVERY_UID: string = 'small_slave_#00';

/** Préfixe des coches propres à une consigne, rangées avec les actions quotidiennes. */
const TASK_CHECK_PREFIX: string = 'task_';

export type ProgramItem = { kind: 'step'; step: PlanStep } | { kind: 'instruction'; text: string };

/** État d'une consigne : faite ou non, et d'où vient le « fait » (donnée du citoyen ou coche de la consigne). */
export interface TaskStatus {
    done: boolean;
    source: 'data' | 'check' | null;
}

/**
 * Plan effectif d'un jour.
 * @param {readonly ApiBuildingPlan[]} plans Plans de la ville.
 * @param {number} day Jour.
 * @returns {ApiBuildingPlan | null} Plan effectif, nul s'il n'y en a pas.
 */
export function effectivePlan(plans: readonly ApiBuildingPlan[], day: number): ApiBuildingPlan | null {
    return plans.find((plan: ApiBuildingPlan): boolean => plan.day === day && plan.isEffective) ?? null;
}

/**
 * Éléments du programme d'un citoyen.
 * @param {PlanContent} content Contenu du plan.
 * @param {boolean} banned Citoyen banni.
 * @param {boolean} slavery_built Bureau des esclavagistes construit.
 * @returns {ProgramItem[]} Étapes et consignes texte, dans l'ordre.
 */
export function programItems(content: PlanContent, banned: boolean, slavery_built: boolean): ProgramItem[] {
    const items: ProgramItem[] = [];
    for (const item of banned ? content.programs.banned : content.programs.regular) {
        if (item.kind === 'instruction') {
            const text: string = item.text.trim();
            if (text !== '') {
                items.push({ kind: 'instruction', text });
            }
        } else if (!banned || slavery_built || item.kind === 'repair') {
            items.push({ kind: 'step', step: item });
        }
    }
    return items;
}

/**
 * Mode d'une étape, comme sur le site : explicite, sinon « finir » à 0 PA restants et « laisser » au-delà.
 * @param {PlanStep} step Étape.
 * @returns {PlanStepMode} Mode.
 */
export function stepMode(step: PlanStep): PlanStepMode {
    return step.mode ?? (step.targetRemaining === 0 ? 'finish' : 'leave');
}

/**
 * Étape accomplie ou non.
 * @param {PlanStep} step Étape.
 * @param {TownBuildingState | undefined} state État du chantier en base.
 * @returns {boolean | null} Nul sans état ou pour une réparation « pour survivre ».
 */
export function stepDone(step: PlanStep, state: TownBuildingState | undefined): boolean | null {
    if (state === undefined) {
        return null;
    }
    const mode: PlanStepMode = stepMode(step);
    if (step.kind === 'build') {
        return state.isBuilt || (mode === 'leave' && state.apRemaining !== null && state.apRemaining <= step.targetRemaining);
    }
    if (mode === 'survive') {
        return null;
    }
    if (state.life === null || state.maxLife === null) {
        return false;
    }
    return state.life >= (mode === 'leave' ? state.maxLife - step.targetRemaining : state.maxLife);
}

/**
 * Clé de la coche propre à une consigne.
 * @param {PlanTask} task Consigne.
 * @returns {string | null} Clé `task_<id>`, nulle sans identifiant.
 */
export function taskCheckKey(task: PlanTask): string | null {
    return typeof task.id === 'string' && task.id !== '' ? `${TASK_CHECK_PREFIX}${task.id}` : null;
}

/**
 * Contenu dont chaque consigne a un identifiant, comme `withTaskIds` du site : une consigne sans id reçoit `p<planId>u<userId>t<rang>`.
 * @param {PlanContent} content Contenu d'un plan (non modifié).
 * @param {number} plan_id Identifiant du plan.
 * @returns {PlanContent} Contenu reçu s'il est complet, sinon une copie complétée.
 */
export function withTaskIds(content: PlanContent, plan_id: number): PlanContent {
    const has_id: (task: PlanTask) => boolean = (task: PlanTask): boolean => typeof task.id === 'string' && task.id !== '';
    if (content.citizens.every((citizen: { tasks: PlanTask[] }): boolean => citizen.tasks.every(has_id))) {
        return content;
    }
    return {
        ...content,
        citizens: content.citizens.map((citizen: { userId: number; tasks: PlanTask[] }): { userId: number; tasks: PlanTask[] } => ({
            ...citizen,
            tasks: citizen.tasks.map((task: PlanTask, index: number): PlanTask => (has_id(task) ? task : { ...task, id: `p${plan_id}u${citizen.userId}t${index}` }))
        }))
    };
}

/**
 * Action quotidienne enregistrée pour un jour.
 * @param {ApiCitizen} citizen Citoyen.
 * @param {number} day Jour.
 * @param {string} key Clé de l'action.
 * @returns {boolean} Vrai si enregistrée.
 */
function hasDailyAction(citizen: ApiCitizen, day: number, key: string): boolean {
    return (citizen.dailyActions ?? []).some((action: { day: number; actionKey: string }): boolean => action.day === day && action.actionKey === key);
}

/**
 * Niveau actuel d'un élément de la maison (booléen = 0 ou 1, inconnu = 0).
 * @param {ApiCitizen} citizen Citoyen.
 * @param {string} key Clé du contenu de la maison.
 * @returns {number} Niveau.
 */
export function homeLevelOf(citizen: ApiCitizen, key: string): number {
    const value: number | boolean | undefined = citizen.home?.content?.[key];
    return typeof value === 'boolean' ? (value ? 1 : 0) : (value ?? 0);
}

/**
 * Clé de l'amélioration de la maison visée par une consigne.
 * @param {PlanTask} task Consigne.
 * @returns {string | undefined} Clé du référentiel des améliorations (hors niveau d'habitation), `undefined` sinon.
 */
export function taskUpgrade(task: PlanTask): string | undefined {
    const ref: string | null | undefined = task.ref;
    return task.kind === 'homeUpgrade' && typeof ref === 'string' && Object.hasOwn(HOME_UPGRADES, ref) && ref !== HOUSE_LEVEL_KEY ? ref : undefined;
}

/**
 * État d'une consigne pour un citoyen un jour donné.
 * @param {PlanTask} task Consigne.
 * @param {ApiCitizen} citizen Citoyen concerné.
 * @param {number} day Jour.
 * @returns {TaskStatus} État.
 */
export function taskStatus(task: PlanTask, citizen: ApiCitizen, day: number): TaskStatus {
    if (task.kind === 'action') {
        return hasDailyAction(citizen, day, task.ref ?? '') ? { done: true, source: 'data' } : { done: false, source: null };
    }
    const upgrade: string | undefined = taskUpgrade(task);
    if (upgrade !== undefined) {
        return homeLevelOf(citizen, upgrade) >= (task.level ?? 1) ? { done: true, source: 'data' } : { done: false, source: null };
    }
    if (task.kind === 'home' && typeof task.level === 'number' && homeLevelOf(citizen, HOUSE_LEVEL_KEY) >= task.level) {
        return { done: true, source: 'data' };
    }
    const check: string | null = taskCheckKey(task);
    return check !== null && hasDailyAction(citizen, day, check) ? { done: true, source: 'check' } : { done: false, source: null };
}

/**
 * Case non modifiable : un niveau de maison relevé ne se décoche pas quand il vient de MyHordes.
 * @param {PlanTask} task Consigne.
 * @param {TaskStatus} status État.
 * @param {boolean} house_editable Niveau de maison saisi à la main.
 * @returns {boolean} Vrai si verrouillée.
 */
export function taskLocked(task: PlanTask, status: TaskStatus, house_editable: boolean): boolean {
    return task.kind === 'home' && status.source === 'data' && !house_editable;
}

/**
 * Texte d'un libellé dans la langue courante.
 * @param {I18nLabel | undefined} label Libellé.
 * @returns {string} Texte, vide si absent.
 */
function t(label: I18nLabel | undefined): string {
    return getI18N(label) ?? '';
}

/**
 * Texte d'une clé de `program_texts` dans la langue courante.
 * @param {keyof typeof program_texts} key Clé.
 * @returns {string} Texte, vide si absent.
 */
export function programText(key: keyof typeof program_texts): string {
    return t(program_texts[key]);
}

/**
 * Texte d'une étape de programme, sans coût estimé.
 * @param {PlanStep} step Étape.
 * @param {string} label Libellé du chantier.
 * @param {number} max_life PV max du chantier.
 * @returns {string} Texte affichable.
 */
export function stepLabel(step: PlanStep, label: string, max_life: number): string {
    const mode: PlanStepMode = stepMode(step);
    if (step.kind === 'build') {
        return mode === 'leave' ? t(program_texts.step_leave).replace('{label}', label).replace('{n}', String(step.targetRemaining)) : label;
    }
    if (mode === 'survive') {
        return t(program_texts.repair_survive).replace('{label}', label);
    }
    if (mode === 'leave') {
        return t(program_texts.repair_until)
            .replace('{label}', label)
            .replace('{life}', String(Math.max(0, max_life - step.targetRemaining)))
            .replace('{max}', String(max_life));
    }
    return t(program_texts.repair_full).replace('{label}', label);
}

/**
 * Libellé d'une consigne, sans coût.
 * @param {PlanTask} task Consigne.
 * @returns {string} Texte affichable, « — » s'il est vide.
 */
export function taskLabel(task: PlanTask): string {
    if (task.kind === 'home') {
        return typeof task.level === 'number' ? (t(HOUSE_LEVEL_LABELS[task.level]) || `#${task.level}`) : '—';
    }
    if (task.kind === 'action') {
        const label: string = t(DAILY_ACTION_LABELS[task.ref ?? '']) || (task.ref ?? '—');
        return typeof task.count === 'number' && task.count > 1 ? `${label} ×${task.count}` : label;
    }
    const upgrade: { label: I18nLabel; max_lvl: number } | undefined = task.kind === 'homeUpgrade' && typeof task.ref === 'string' ? HOME_UPGRADES[task.ref] : undefined;
    if (upgrade !== undefined) {
        return upgrade.max_lvl > 1 && typeof task.level === 'number' ? `${t(upgrade.label)} ${t(program_texts.level_short)} ${task.level}` : t(upgrade.label);
    }
    return typeof task.label === 'string' && task.label !== '' ? task.label : '—';
}

/**
 * Libellé d'une consigne suivi de ses PA, collés à la parenthèse.
 * @param {PlanTask} task Consigne.
 * @returns {string} Texte affichable, par exemple « Fouiller les déchets (1PA) ».
 */
export function taskText(task: PlanTask): string {
    return task.pa > 0 ? `${taskLabel(task)} (${task.pa}${t(expedition_texts.ap_short)})` : taskLabel(task);
}
