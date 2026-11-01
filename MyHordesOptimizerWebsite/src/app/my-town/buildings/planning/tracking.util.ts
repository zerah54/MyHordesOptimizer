import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanPool, PlanTaskDTO } from './plan.types';
import { CitizenRef, HomeLevelRef } from './plan-evaluation.util';
import { taskLabel } from './planning-labels.util';
import { programDone, TaskStatus, taskStatus } from './task-status.util';

/** État d'un citoyen : consignes toutes faites, au moins une à faire, ou aucune consigne. */
export type TrackingState = 'done' | 'todo' | 'none';

/** Consigne suivie : la consigne, son libellé et son état. */
export interface TrackingTask {
    task: PlanTaskDTO;
    label: string;
    status: TaskStatus;
}

/** Ligne du suivi : un citoyen vivant et ses consignes du jour. */
export interface TrackingRow {
    citizen: Citizen;
    pool: PlanPool;
    tasks: TrackingTask[];
    state: TrackingState;
    done_count: number;
}

/** Filtres du suivi ; un ensemble de métiers vide = tous. */
export interface TrackingFilters {
    jobs: ReadonlySet<string>;
    /** Clé de `taskFilterKey`, nulle = toutes. */
    task: string | null;
    state: TrackingState | 'all';
    pool: PlanPool | 'all';
}

/**
 * Clé de filtre d'une consigne : son type, ou l'action précise.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {string} Clé (`action:<clé>`, `home`, `homeUpgrade`, `free`).
 */
export function taskFilterKey(task: PlanTaskDTO): string {
    return task.kind === 'action' ? `action:${task.ref ?? ''}` : task.kind;
}

/**
 * Lignes du suivi d'un jour, dans l'ordre des citoyens.
 * @param {Citizen[]} citizens Citoyens vivants complets.
 * @param {CitizenRef[]} refs Citoyens de la planification (poche).
 * @param {BuildingPlanContentDTO} content Proposition suivie.
 * @param {number} day Jour.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Niveaux de maison (libellés).
 * @returns {TrackingRow[]} Lignes.
 */
export function trackingRows(citizens: Citizen[], refs: CitizenRef[], content: BuildingPlanContentDTO, day: number, homes: ReadonlyMap<number, HomeLevelRef>): TrackingRow[] {
    return citizens.map((citizen: Citizen): TrackingRow => {
        const tasks: TrackingTask[] = (content.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === citizen.id)?.tasks ?? [])
            .map((task: PlanTaskDTO): TrackingTask => ({ task, label: taskLabel(task, homes), status: taskStatus(task, citizen, day) }));
        const statuses: TaskStatus[] = tasks.map((task: TrackingTask): TaskStatus => task.status);
        const banned: boolean = refs.find((ref: CitizenRef): boolean => ref.userId === citizen.id)?.banned ?? citizen.is_shunned === true;
        return {
            citizen,
            pool: banned ? 'banned' : 'regular',
            tasks,
            state: tasks.length === 0 ? 'none' : (programDone(statuses) ? 'done' : 'todo'),
            done_count: statuses.filter((status: TaskStatus): boolean => status.done).length
        };
    });
}

/**
 * État d'une ligne, sur tout le programme ou sur la seule consigne choisie (« qui n'a pas fait X »).
 * @param {TrackingRow} row Ligne.
 * @param {string | null} task_key Consigne choisie (clé de `taskFilterKey`), nulle = toutes.
 * @returns {TrackingState} État.
 */
export function rowState(row: TrackingRow, task_key: string | null): TrackingState {
    if (task_key === null) {
        return row.state;
    }
    const tasks: TrackingTask[] = row.tasks.filter((task: TrackingTask): boolean => taskFilterKey(task.task) === task_key);
    if (tasks.length === 0) {
        return 'none';
    }
    return tasks.every((task: TrackingTask): boolean => task.status.done) ? 'done' : 'todo';
}

/**
 * Lignes retenues par les filtres de métier, de poche et de consigne (l'état mis à part).
 * @param {TrackingRow[]} rows Lignes.
 * @param {TrackingFilters} filters Filtres.
 * @returns {TrackingRow[]} Lignes retenues.
 */
function scopedRows(rows: TrackingRow[], filters: TrackingFilters): TrackingRow[] {
    return rows.filter((row: TrackingRow): boolean =>
        (filters.jobs.size === 0 || filters.jobs.has(row.citizen.job?.key ?? ''))
        && (filters.task === null || rowState(row, filters.task) !== 'none')
        && (filters.pool === 'all' || row.pool === filters.pool));
}

/**
 * Lignes qui passent tous les filtres.
 * @param {TrackingRow[]} rows Lignes.
 * @param {TrackingFilters} filters Filtres.
 * @returns {TrackingRow[]} Lignes retenues.
 */
export function filterTrackingRows(rows: TrackingRow[], filters: TrackingFilters): TrackingRow[] {
    return scopedRows(rows, filters).filter((row: TrackingRow): boolean => filters.state === 'all' || rowState(row, filters.task) === filters.state);
}

/**
 * Compteur « x sur y ont terminé » : citoyens retenus par les filtres (état mis à part) ayant au moins une consigne
 * concernée, et parmi eux ceux qui l'ont faite.
 * @param {TrackingRow[]} rows Lignes.
 * @param {TrackingFilters} filters Filtres.
 * @returns {{ done: number; total: number }} Compteur.
 */
export function trackingSummary(rows: TrackingRow[], filters: TrackingFilters): { done: number; total: number } {
    const states: TrackingState[] = scopedRows(rows, filters).map((row: TrackingRow): TrackingState => rowState(row, filters.task));
    return {
        done: states.filter((state: TrackingState): boolean => state === 'done').length,
        total: states.filter((state: TrackingState): boolean => state !== 'none').length
    };
}

/**
 * Choix du filtre de consigne : types et actions présents, dans l'ordre d'apparition.
 * @param {TrackingRow[]} rows Lignes.
 * @returns {{ key: string; label: string }[]} Options (libellé de l'action, ou d'une consigne du type).
 */
export function trackingTaskOptions(rows: TrackingRow[]): { key: string; label: string }[] {
    const options: Map<string, string> = new Map<string, string>();
    for (const task of rows.flatMap((row: TrackingRow): TrackingTask[] => row.tasks)) {
        const key: string = taskFilterKey(task.task);
        if (!options.has(key)) {
            options.set(key, task.task.kind === 'action' ? task.label : '');
        }
    }
    return Array.from(options, ([key, label]: [string, string]): { key: string; label: string } => ({ key, label }));
}
