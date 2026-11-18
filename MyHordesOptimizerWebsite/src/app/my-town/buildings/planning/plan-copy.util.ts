import { BuildingPlanContentDTO, isBuildingStep, PlanCitizenDTO, PlanItemDTO } from './plan.types';
import { sanitizeContent } from './program-edit.util';

/**
 * Contenu à copier vers un autre jour : copie profonde sans les étapes de construction des chantiers déjà construits
 * (réparations et consignes conservées), budget validé remis à nul.
 * @param {BuildingPlanContentDTO} content Contenu source (non modifié).
 * @param {ReadonlySet<number>} built_ids Chantiers déjà construits.
 * @returns {BuildingPlanContentDTO} Nouveau contenu.
 */
export function contentForCopy(content: BuildingPlanContentDTO, built_ids: ReadonlySet<number>): BuildingPlanContentDTO {
    const copy: BuildingPlanContentDTO = sanitizeContent(structuredClone(content));
    const keep = (item: PlanItemDTO): boolean => !isBuildingStep(item) || item.kind !== 'build' || !built_ids.has(item.buildingId);
    copy.programs = { banned: copy.programs.banned.filter(keep), regular: copy.programs.regular.filter(keep) };
    copy.validatedBudget = null;
    return copy;
}

/** Parties d'une proposition à copier depuis un autre jour. */
export interface CopyParts {
    budget: boolean;
    programs: boolean;
}

/**
 * Remplace dans la cible les parties choisies par celles de la copie ; le reste de la cible est gardé.
 * Budget : réglages de budget, lignes ville, saisies des citoyens hors consignes individuelles (budget validé remis à nul).
 * Programmes : programmes des deux poches, consignes du jour, votes du soir, consignes individuelles.
 * @param {BuildingPlanContentDTO} target Contenu de la proposition remplacée (non modifié).
 * @param {BuildingPlanContentDTO} copied Contenu issu de {@link contentForCopy} (non modifié).
 * @param {CopyParts} parts Parties à copier.
 * @returns {BuildingPlanContentDTO} Nouveau contenu.
 */
export function mergeCopiedParts(target: BuildingPlanContentDTO, copied: BuildingPlanContentDTO, parts: CopyParts): BuildingPlanContentDTO {
    const result: BuildingPlanContentDTO = structuredClone(target);
    const source: BuildingPlanContentDTO = structuredClone(copied);
    if (parts.budget) {
        result.basePa = source.basePa;
        result.budgetMode = source.budgetMode;
        result.basePaTier = source.basePaTier;
        result.expeditionRab = source.expeditionRab;
        result.townLines = source.townLines;
        result.manageBanned = source.manageBanned;
        result.validatedBudget = null;
    }
    if (parts.programs) {
        result.programs = source.programs;
        result.instructions = source.instructions;
        result.eveningVoteBuildingId = source.eveningVoteBuildingId;
        result.eveningSecondVoteBuildingId = source.eveningSecondVoteBuildingId;
    }
    const ids: number[] = [...new Set<number>([...result.citizens, ...source.citizens].map((citizen: PlanCitizenDTO): number => citizen.userId))];
    result.citizens = ids.map((user_id: number): PlanCitizenDTO => {
        const of = (content: BuildingPlanContentDTO): PlanCitizenDTO | undefined =>
            content.citizens.find((citizen: PlanCitizenDTO): boolean => citizen.userId === user_id);
        const { tasks: _ignored, ...settings } = (parts.budget ? of(source) : of(result)) ?? { userId: user_id, tasks: [] };
        return { ...settings, userId: user_id, tasks: (parts.programs ? of(source) : of(result))?.tasks ?? [] };
    });
    return result;
}
