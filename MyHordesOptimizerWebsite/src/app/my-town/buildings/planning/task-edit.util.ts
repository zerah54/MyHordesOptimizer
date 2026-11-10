import { dailyActionAp, dailyActionDefaultUses, DailyActionEnum, isPlannableAction } from '../../../_abstract_model/enum/daily-action.enum';
import { HeroSkillLevels } from '../../../_abstract_model/types/hero-skill-levels';
import { cascadeAp, HomeUpgradeRef } from './home-upgrades.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO } from './plan.types';

/**
 * Entrée d'un citoyen dans le contenu, créée à la demande.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {number} user_id Identifiant du citoyen.
 * @returns {PlanCitizenDTO} Entrée du citoyen.
 */
export function entryFor(content: BuildingPlanContentDTO, user_id: number): PlanCitizenDTO {
    let entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === user_id);
    if (entry === undefined) {
        entry = { userId: user_id, tasks: [] };
        content.citizens.push(entry);
    }
    return entry;
}

/**
 * PA d'un niveau d'amélioration du référentiel.
 * @param {HomeUpgradeRef} upgrade Amélioration.
 * @param {number} level Niveau visé.
 * @returns {number} PA (0 si le niveau est inconnu).
 */
export function upgradeAp(upgrade: HomeUpgradeRef, level: number): number {
    return upgrade.levels.find((candidate: { level: number; ap: number }): boolean => candidate.level === level)?.ap ?? 0;
}

/**
 * Actions proposables pour une consigne : celles disponibles ce jour qui peuvent faire l'objet d'une consigne, plus l'action déjà choisie.
 * @param {readonly DailyActionEnum[]} available Actions disponibles ce jour.
 * @param {string | null} [current_ref] Action déjà choisie.
 * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
 */
export function plannableActions(available: readonly DailyActionEnum[], current_ref: string | null = null): DailyActionEnum[] {
    const keys: Set<string> = new Set<string>(available.map((action: DailyActionEnum): string => action.key));
    return DailyActionEnum.getAllValues<DailyActionEnum>()
        .filter((action: DailyActionEnum): boolean => isPlannableAction(action) && (keys.has(action.key) || action.key === current_ref));
}

/**
 * Valeurs d'une consigne d'action : utilisations proposées au citoyen (absentes = une seule) et leurs PA.
 * @param {DailyActionEnum} action Action.
 * @param {string | null} job_key Clé `JobEnum` du métier, nulle si inconnu.
 * @param {HeroSkillLevels | null} hero_skills Niveaux des compétences héroïques, nuls si inconnus.
 * @returns {Pick<PlanTaskDTO, 'ref' | 'pa' | 'count'>} Action, PA et utilisations.
 */
export function actionDefaults(action: DailyActionEnum, job_key: string | null, hero_skills: HeroSkillLevels | null): Pick<PlanTaskDTO, 'ref' | 'pa' | 'count'> {
    const count: number = dailyActionDefaultUses(action, job_key, hero_skills);
    const pa: number = dailyActionAp(action, job_key, count, hero_skills);
    return count > 1 ? { ref: action.key, pa, count } : { ref: action.key, pa };
}

/**
 * Valeurs d'une consigne d'amélioration : niveau suivant celui du citoyen, PA des niveaux manquants.
 * @param {HomeUpgradeRef} upgrade Amélioration.
 * @param {number | null} current Niveau actuel, nul s'il est inconnu.
 * @returns {Pick<PlanTaskDTO, 'ref' | 'level' | 'pa'>} Amélioration, niveau et PA.
 */
export function upgradeDefaults(upgrade: HomeUpgradeRef, current: number | null): Pick<PlanTaskDTO, 'ref' | 'level' | 'pa'> {
    const level: number = Math.min((current ?? 0) + 1, upgrade.max_level);
    return { ref: upgrade.key, level, pa: cascadeAp((value: number): number => upgradeAp(upgrade, value), current, level) };
}
