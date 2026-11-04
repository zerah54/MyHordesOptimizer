import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from './plan.types';
import { newTaskId } from './task-id.util';

/** Consigne à donner à plusieurs citoyens, sans ses PA (propres à chacun). */
export interface BulkTaskTemplate {
    kind: PlanTaskKind;
    ref?: string | null;
    level?: number | null;
    label?: string | null;
}

/**
 * Clé de comparaison d'une consigne : deux consignes de même clé sont la même consigne.
 * @param {BulkTaskTemplate} task Consigne.
 * @returns {string} Clé.
 */
function sameTaskKey(task: BulkTaskTemplate): string {
    return JSON.stringify([task.kind, task.ref ?? null, task.level ?? null, (task.label ?? '').trim()]);
}

/**
 * Ajoute une consigne à chaque citoyen donné (contenu modifié en place), sauf à qui l'a déjà.
 * @param {BuildingPlanContentDTO} content Copie de travail.
 * @param {number[]} user_ids Citoyens visés.
 * @param {BulkTaskTemplate} template Consigne.
 * @param {(user_id: number) => number} pa_of PA de la consigne pour un citoyen.
 * @param {(user_id: number) => number} [count_of] Utilisations prévues d'une action pour un citoyen (1 si absent).
 * @param {(user_id: number) => number | null} [level_of] Niveau visé propre à chaque citoyen, nul s'il ne doit rien recevoir (niveau du modèle si absent).
 * @returns {number} Nombre de citoyens qui ont reçu la consigne.
 */
export function bulkAddTask(
    content: BuildingPlanContentDTO, user_ids: number[], template: BulkTaskTemplate, pa_of: (user_id: number) => number, count_of?: (user_id: number) => number,
    level_of?: (user_id: number) => number | null
): number {
    const label: string = (template.label ?? '').trim();
    let added: number = 0;
    for (const user_id of user_ids) {
        const level: number | null | undefined = level_of === undefined ? template.level : level_of(user_id);
        if (level_of !== undefined && level === null) {
            continue;
        }
        const key: string = sameTaskKey({ ...template, level });
        let entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === user_id);
        if (entry === undefined) {
            entry = { userId: user_id, tasks: [] };
            content.citizens.push(entry);
        }
        if (entry.tasks.some((task: PlanTaskDTO): boolean => sameTaskKey(task) === key)) {
            continue;
        }
        const task: PlanTaskDTO = { id: newTaskId(), kind: template.kind, pa: 0 };
        if (typeof template.ref === 'string') {
            task.ref = template.ref;
        }
        if (typeof level === 'number') {
            task.level = level;
        }
        if (template.kind === 'free' || (template.kind === 'homeUpgrade' && typeof template.ref !== 'string')) {
            task.label = label;
        }
        task.pa = pa_of(user_id);
        const count: number = count_of?.(user_id) ?? 1;
        if (count > 1) {
            task.count = count;
        }
        entry.tasks.push(task);
        added++;
    }
    return added;
}
