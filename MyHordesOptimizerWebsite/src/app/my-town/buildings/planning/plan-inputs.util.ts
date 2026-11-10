import { PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { Item } from '../../../_abstract_model/types/item.class';
import { expeditionPaByCitizen } from './budget.util';
import { TownDefenseFactors } from './defense-gain.util';
import { BuildingPlanContentDTO } from './plan.types';
import { BuildingRef, CitizenRef, DayInput, HomeLevelRef } from './plan-evaluation.util';
import {
    bankMap,
    buildingLevelsOf,
    buildingProgressMap,
    buildingRefs,
    builtUidsOf,
    citizenRefs,
    defenseItemIdsOf,
    expeditionParts,
    hasSlaveryOf,
    homeLevelRefs,
    homeUpgradeResources,
    itemValueMap,
    PlanTier,
    planTierMap,
    townDefenseFactors,
    workshopLevelOf
} from './planning-data.util';
import { ResourceCount } from './resources.util';

/** Données chargées et réglages d'affichage nécessaires à l'assemblage des entrées du calcul. */
export interface PlanningContext {
    data: PlanningStatic;
    days: ReadonlyMap<number, PlanningDay>;
    hard_mode: boolean;
    locale: string;
}

/**
 * Assemble les entrées de l'évaluation de journées consécutives ; l'état synchronisé n'alimente que le premier jour
 * (les suivants sont écrasés par le chaînage de `evaluateDays`).
 * @param {PlanningContext} context Données chargées.
 * @param {number} first_day Jour du premier contenu.
 * @param {BuildingPlanContentDTO[]} contents Contenu de chaque jour, à partir de `first_day`.
 * @returns {DayInput[]} Une entrée par contenu.
 */
export function buildDayInputs(context: PlanningContext, first_day: number, contents: BuildingPlanContentDTO[]): DayInput[] {
    const data: PlanningStatic = context.data;
    const citizens: CitizenRef[] = citizenRefs(data.citizens);
    const bank: Map<number, number> = bankMap(data.bank);
    const item_values: Map<number, number> = itemValueMap(data.plans.itemValues);
    const item_id_by_uid: Map<string, number> = new Map<string, number>(data.items.map((item: Item): [string, number] => [item.uid, item.id]));
    const homes: Map<number, HomeLevelRef> = homeLevelRefs(data.homes, item_id_by_uid, context.locale);
    const home_upgrades: Map<string, ReadonlyMap<number, ResourceCount[]>> = homeUpgradeResources(data.homes, item_id_by_uid);
    const workshop_level: number = workshopLevelOf(data.buildings, data.state.buildings);
    const has_slavery: boolean = hasSlaveryOf(data.buildings, data.state.buildings);
    const defense_factors: TownDefenseFactors = townDefenseFactors(data.state.defense, data.citizens, builtUidsOf(data.buildings, data.state.buildings));
    const defense_item_ids: Set<number> = defenseItemIdsOf(data.items);
    const building_levels: Map<string, number> = buildingLevelsOf(data.buildings, data.state.buildings);

    return contents.map((content: BuildingPlanContentDTO, index: number): DayInput => {
        const day: PlanningDay | undefined = context.days.get(first_day + index);
        const tiers: Map<number, PlanTier> = planTierMap(content.planTiers);
        const buildings: Map<number, BuildingRef> = buildingRefs(data.buildings, data.state.buildings, context.hard_mode, context.locale, tiers);
        const progress: ReturnType<typeof buildingProgressMap> = buildingProgressMap(data.buildings, data.state.buildings, context.hard_mode, tiers);
        return {
            content,
            buildings,
            progress,
            workshopLevel: workshop_level,
            hasSlavery: has_slavery,
            citizens,
            expeditionPa: expeditionPaByCitizen(expeditionParts(day?.expeditions ?? [])).pa,
            bank,
            itemValues: item_values,
            attack: day?.attack ?? null,
            baseDefense: data.state.defense?.total ?? 0,
            temporaryDefense: data.state.defense?.temp ?? 0,
            homes,
            homeUpgrades: home_upgrades,
            hardMode: context.hard_mode,
            defenseFactors: defense_factors,
            defenseItemIds: defense_item_ids,
            upgrades: data.upgrades,
            buildingLevels: building_levels
        };
    });
}
