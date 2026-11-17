import { BuildingPlanContentDTO, isBuildingStep, PlanItemDTO } from './plan.types';
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
