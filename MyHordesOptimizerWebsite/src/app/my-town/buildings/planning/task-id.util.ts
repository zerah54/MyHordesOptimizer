import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO } from './plan.types';

/**
 * Identifiant aléatoire d'une nouvelle consigne (10 caractères `[a-z0-9]`).
 * @returns {string} Identifiant.
 */
export function newTaskId(): string {
    const bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(10));
    return Array.from(bytes, (byte: number): string => (byte % 36).toString(36)).join('');
}

/**
 * Contenu dont chaque consigne a un identifiant : une consigne d'un contenu antérieur reçoit `p<planId>u<userId>t<rang>`, stable
 * d'un chargement à l'autre. Le contenu reçu n'est pas modifié ; il est renvoyé tel quel s'il est déjà complet.
 * @param {BuildingPlanContentDTO} content Contenu d'une proposition.
 * @param {number} plan_id Proposition (deux propositions ne partagent pas ces identifiants).
 * @returns {BuildingPlanContentDTO} Contenu complet.
 */
export function withTaskIds(content: BuildingPlanContentDTO, plan_id: number): BuildingPlanContentDTO {
    const complete: boolean = content.citizens.every((citizen: PlanCitizenDTO): boolean =>
        citizen.tasks.every((task: PlanTaskDTO): boolean => typeof task.id === 'string' && task.id !== ''));
    if (complete) {
        return content;
    }
    return {
        ...content,
        citizens: content.citizens.map((citizen: PlanCitizenDTO): PlanCitizenDTO => ({
            ...citizen,
            tasks: citizen.tasks.map((task: PlanTaskDTO, index: number): PlanTaskDTO =>
                (typeof task.id === 'string' && task.id !== '' ? task : { ...task, id: `p${plan_id}u${citizen.userId}t${index}` }))
        }))
    };
}
