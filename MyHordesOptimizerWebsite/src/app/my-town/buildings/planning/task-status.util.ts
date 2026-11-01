import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { PlanTaskDTO } from './plan.types';

/** Préfixe des coches propres à une consigne, rangées avec les actions quotidiennes. */
export const TASK_CHECK_PREFIX: string = 'task_';

/** État d'une consigne : faite ou non, et d'où vient le « fait » (donnée du citoyen ou coche de la consigne). */
export interface TaskStatus {
    done: boolean;
    source: 'data' | 'check' | null;
}

/**
 * Clé de la coche propre à une consigne.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {string | null} Clé `task_<id>`, nulle sans identifiant.
 */
export function taskCheckKey(task: PlanTaskDTO): string | null {
    return typeof task.id === 'string' && task.id !== '' ? `${TASK_CHECK_PREFIX}${task.id}` : null;
}

/**
 * Amélioration visée par une consigne structurée.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {HomeEnum | undefined} Amélioration, absente pour une autre consigne ou l'ancien format libre.
 */
export function taskUpgrade(task: PlanTaskDTO): HomeEnum | undefined {
    if (task.kind !== 'homeUpgrade' || typeof task.ref !== 'string' || task.ref === HomeEnum.HOUSE_LEVEL.key) {
        return undefined;
    }
    return HomeEnum.getByKey<HomeEnum>(task.ref);
}

/**
 * Action quotidienne enregistrée pour un jour.
 * @param {Citizen} citizen Citoyen.
 * @param {number} day Jour.
 * @param {string} key Clé de l'action.
 * @returns {boolean} Vrai si enregistrée.
 */
export function hasDailyAction(citizen: Citizen, day: number, key: string): boolean {
    return (citizen.daily_actions ?? []).some((action: DailyAction): boolean => action.day === day && action.action_key === key);
}

/**
 * Niveau actuel d'un élément de la maison (booléen = 0 ou 1, inconnu = 0).
 * @param {Citizen} citizen Citoyen.
 * @param {string} key Clé `HomeEnum`.
 * @returns {number} Niveau.
 */
export function homeLevelOf(citizen: Citizen, key: string): number {
    const value: number | boolean | undefined = citizen.home?.content?.find((entry: HomeWithValue): boolean => entry.element?.key === key)?.value;
    return typeof value === 'boolean' ? (value ? 1 : 0) : (value ?? 0);
}

/**
 * État d'une consigne pour un citoyen un jour donné.
 * @param {PlanTaskDTO} task Consigne.
 * @param {Citizen} citizen Citoyen concerné.
 * @param {number} day Jour.
 * @returns {TaskStatus} État.
 */
export function taskStatus(task: PlanTaskDTO, citizen: Citizen, day: number): TaskStatus {
    if (task.kind === 'action') {
        return hasDailyAction(citizen, day, task.ref ?? '') ? { done: true, source: 'data' } : { done: false, source: null };
    }
    const upgrade: HomeEnum | undefined = taskUpgrade(task);
    if (upgrade !== undefined) {
        return homeLevelOf(citizen, upgrade.key) >= (task.level ?? 1) ? { done: true, source: 'data' } : { done: false, source: null };
    }
    if (task.kind === 'home' && typeof task.level === 'number' && homeLevelOf(citizen, HomeEnum.HOUSE_LEVEL.key) >= task.level) {
        return { done: true, source: 'data' };
    }
    const check: string | null = taskCheckKey(task);
    return check !== null && hasDailyAction(citizen, day, check) ? { done: true, source: 'check' } : { done: false, source: null };
}

/**
 * Verrou d'écriture d'une consigne : par action pour une action de chantier (deux consignes de la même action écrivent
 * la même donnée), par consigne sinon.
 * @param {number} user_id Citoyen.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {string} Clé de verrou.
 */
export function taskLockKey(user_id: number, task: PlanTaskDTO): string {
    return task.kind === 'action' ? `${user_id}:action:${task.ref ?? ''}` : `${user_id}:${task.id ?? ''}`;
}

/**
 * Case non modifiable : un niveau de maison relevé ne se décoche pas quand il vient de MyHordes.
 * @param {PlanTaskDTO} task Consigne.
 * @param {TaskStatus} status État.
 * @param {boolean} house_editable Niveau de maison saisi à la main (ville sans API externe).
 * @returns {boolean} Vrai si verrouillée.
 */
export function taskLocked(task: PlanTaskDTO, status: TaskStatus, house_editable: boolean): boolean {
    return task.kind === 'home' && status.source === 'data' && !house_editable;
}

/**
 * Programme terminé : au moins une consigne, toutes faites.
 * @param {TaskStatus[]} statuses États des consignes du citoyen.
 * @returns {boolean} Vrai si terminé.
 */
export function programDone(statuses: TaskStatus[]): boolean {
    return statuses.length > 0 && statuses.every((status: TaskStatus): boolean => status.done);
}
