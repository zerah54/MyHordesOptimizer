import { BuildingPlanContentDTO, PlanPool, PlanTownLineDTO } from './plan.types';

/** Points de construction par jour d'un technicien. */
export const TECHNICIAN_CP: number = 6;

/**
 * Vrai si la poche des bannis doit rester affichée quel que soit le réglage : banni dans la ville, BDE ou contenu côté bannis.
 * @param {BuildingPlanContentDTO} content Contenu de la proposition.
 * @param {readonly { banned: boolean }[]} citizens Citoyens de la ville.
 * @param {boolean} has_slavery Vrai si le BDE est construit.
 * @returns {boolean} Vrai si l'affichage est imposé.
 */
export function bannedPoolForced(content: BuildingPlanContentDTO, citizens: readonly { banned: boolean }[], has_slavery: boolean): boolean {
    return has_slavery
        || citizens.some((citizen: { banned: boolean }): boolean => citizen.banned)
        || content.programs.banned.length > 0
        || content.townLines.some((line: PlanTownLineDTO): boolean => line.pool === 'banned');
}

/**
 * Vrai si la poche des bannis est affichée : gestion activée sur la proposition, ou affichage imposé.
 * @param {BuildingPlanContentDTO} content Contenu de la proposition.
 * @param {readonly { banned: boolean }[]} citizens Citoyens de la ville.
 * @param {boolean} has_slavery Vrai si le BDE est construit.
 * @returns {boolean} Vrai si la poche est affichée.
 */
export function bannedPoolShown(content: BuildingPlanContentDTO, citizens: readonly { banned: boolean }[], has_slavery: boolean): boolean {
    return content.manageBanned === true || bannedPoolForced(content, citizens, has_slavery);
}

/** Données d'un citoyen pour le calcul de sa capacité. */
export interface BudgetCitizen {
    userId: number;
    banned: boolean;
    technician: boolean;
    basePa: number;
    expeditionPa: number;
    /** PA des tâches que les PC peuvent payer. */
    taskPa: number;
    /** PA des tâches payables en PA seulement (agrandissement de maison). */
    apOnlyTaskPa: number;
}

/** Capacité de travail d'un citoyen sur les chantiers. */
export interface CitizenCapacity {
    userId: number;
    banned: boolean;
    paCapacity: number;
    cpCapacity: number;
    capacity: number;
    overCommitted: boolean;
}

/** Ligne de budget de la ville : positive = PA ajoutés, négative = PA retirés. */
export interface BudgetLine {
    pool: PlanPool;
    pa: number;
}

/** Budget d'une poche : capacité des citoyens, lignes ville, coût du programme et reste. */
export interface PoolBudget {
    pool: PlanPool;
    citizenCapacity: number;
    lines: number;
    budget: number;
    cost: number;
    remaining: number;
}

/** Partie d'expédition : longueur du tracé (nulle si aucun tracé) et citoyens inscrits. */
export interface ExpeditionPartPa {
    routeLength: number | null;
    citizenIds: number[];
}

/**
 * Capacité d'un citoyen : les tâches consomment les PC avant les PA, sauf celles payables en PA seulement ; jamais négative.
 * @param {BudgetCitizen} citizen Données du citoyen.
 * @returns {CitizenCapacity} PA, PC et capacité totale utilisables sur les chantiers.
 */
export function citizenCapacity(citizen: BudgetCitizen): CitizenCapacity {
    const cp: number = citizen.technician ? TECHNICIAN_CP : 0;
    const cp_used: number = Math.min(cp, citizen.taskPa);
    const pa_used_by_tasks: number = citizen.taskPa - cp_used + citizen.apOnlyTaskPa;
    const pa_left: number = citizen.basePa - citizen.expeditionPa - pa_used_by_tasks;
    const pa_capacity: number = Math.max(0, pa_left);
    const cp_capacity: number = cp - cp_used;
    return {
        userId: citizen.userId,
        banned: citizen.banned,
        paCapacity: pa_capacity,
        cpCapacity: cp_capacity,
        capacity: pa_capacity + cp_capacity,
        overCommitted: pa_left < 0
    };
}

/**
 * Budget de chaque poche : capacité des citoyens + lignes ville − coût du programme.
 * @param {CitizenCapacity[]} capacities Capacités des citoyens.
 * @param {BudgetLine[]} lines Lignes ville.
 * @param {Record<PlanPool, number>} costs Coût en PA des étapes de chaque poche.
 * @returns {Record<PlanPool, PoolBudget>} Budget par poche.
 */
export function poolBudgets(capacities: CitizenCapacity[], lines: BudgetLine[], costs: Record<PlanPool, number>): Record<PlanPool, PoolBudget> {
    const build = (pool: PlanPool): PoolBudget => {
        const citizen_capacity: number = capacities
            .filter((capacity: CitizenCapacity): boolean => capacity.banned === (pool === 'banned'))
            .reduce((sum: number, capacity: CitizenCapacity): number => sum + capacity.capacity, 0);
        const lines_total: number = lines
            .filter((line: BudgetLine): boolean => line.pool === pool)
            .reduce((sum: number, line: BudgetLine): number => sum + line.pa, 0);
        const budget: number = citizen_capacity + lines_total;
        return { pool, citizenCapacity: citizen_capacity, lines: lines_total, budget, cost: costs[pool], remaining: budget - costs[pool] };
    };
    return { banned: build('banned'), regular: build('regular') };
}

/**
 * PA d'expédition de chaque citoyen : Σ longueur du tracé (un retour éventuel est déjà dans la boucle) sur les parties où il est inscrit.
 * @param {ExpeditionPartPa[]} parts Parties d'expédition du jour.
 * @returns {{ pa: Map<number, number>; partsWithoutRoute: number }} PA par citoyen et nombre de parties sans tracé.
 */
export function expeditionPaByCitizen(parts: ExpeditionPartPa[]): { pa: Map<number, number>; partsWithoutRoute: number } {
    const pa: Map<number, number> = new Map<number, number>();
    let parts_without_route: number = 0;
    for (const part of parts) {
        if (part.routeLength === null) {
            parts_without_route++;
            continue;
        }
        for (const id of part.citizenIds) {
            pa.set(id, (pa.get(id) ?? 0) + part.routeLength);
        }
    }
    return { pa, partsWithoutRoute: parts_without_route };
}
