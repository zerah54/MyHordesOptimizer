import { HomeEnum } from '../enum/home.enum';
import { JobEnum } from '../enum/job.enum';
import { Property } from '../enum/property.enum';
import { Citizen } from '../types/citizen.class';
import { HomeWithValue } from '../types/home.class';
import { Item } from '../types/item.class';

/** Objets comptant double dans item_defense (calculate_home_def), en plus du tag 'defence'. */
const DOUBLE_WEIGHT_ITEM_UIDS: readonly string[] = ['soul_blue_#00', 'soul_blue_#01', 'soul_red_#00'];

/**
 * Reconstruit la défense de maison d'un citoyen à partir des composantes connues :
 * baseDef + renfort/clôture (citoyens héroïques uniquement) + objets de défense en coffre.
 * Best-effort : additionalDefense/temporaryDefense (bonus d'objets consommés) ne sont pas reconstructibles
 * (pas de source scrapable) — le résultat est un plancher, jamais un plafond.
 */
export function computeReconstructedHomeDefense(citizen: Citizen): number {
    const isHeroic: boolean = citizen.job?.key !== JobEnum.CITIZEN.key;
    const jobDefense: number = isHeroic ? 2 + (citizen.job?.key === JobEnum.GUARDIAN.key ? 1 : 0) : 0;
    const upgradesDefense: number = isHeroic ? computeUpgradesDefense(citizen) : 0;
    const itemDefense: number = computeItemDefense(citizen);
    return (citizen.house_defense ?? 0) + jobDefense + upgradesDefense + itemDefense;
}

function computeUpgradesDefense(citizen: Citizen): number {
    const renfortLevelValue: number | boolean | undefined = homeContentValue(citizen, HomeEnum.HOUSE_DEFENSE);
    const renfortLevel: number = Math.max(0, typeof renfortLevelValue === 'number' ? renfortLevelValue : 0);
    const hasFence: boolean = !!homeContentValue(citizen, HomeEnum.HAS_FENCE);
    const renfortDefense: number = renfortLevel <= 6 ? renfortLevel : 6 + 2 * (renfortLevel - 6);
    return renfortDefense + (hasFence ? 3 : 0);
}

function homeContentValue(citizen: Citizen, element: HomeEnum): number | boolean | undefined {
    const entry: HomeWithValue | undefined = citizen.home?.content
        ?.find((content: HomeWithValue) => content.element?.key === element.key);
    return entry?.value;
}

function computeItemDefense(citizen: Citizen): number {
    const items: Item[] = citizen.chest?.items ?? [];
    return items
        .filter((item: Item) => !item.is_broken)
        .reduce((total: number, item: Item) => {
            if (item.properties.some((property: Property) => property?.key === Property.DEFENCE.key)) {
                return total + 1;
            }
            if (DOUBLE_WEIGHT_ITEM_UIDS.includes(item.uid)) {
                return total + 2;
            }
            return total;
        }, 0);
}
