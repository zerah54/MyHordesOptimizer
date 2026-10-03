import { TownTypeId } from '../../_abstract_model/types/_types';

const const_ratio_base: number = 0.5;
const const_ratio_low: number = 0.75;
const conf_attack_by_mode: Record<TownTypeId, number> = {
    RE: 1.1,
    PANDE: 1.1,
    RNE: 1.1,
    CUSTOM: 1.1
};

function getMinRatio(day: number, town_type: TownTypeId): number {
    const max_ratio: number = conf_attack_by_mode[town_type];
    if (day <= 3) {
        return const_ratio_low;
    } else {
        return max_ratio;
    }
}

function getMaxRatio(day: number, town_type: TownTypeId): number {
    const max_ratio: number = conf_attack_by_mode[town_type];
    if (day <= 1) {
        return const_ratio_base;
    } else if (day <= 3) {
        return const_ratio_low;
    } else {
        return max_ratio;
    }
}

export function getMinAttack(day: number, town_type: TownTypeId): number {
    return Math.round(getMinRatio(day, town_type) * Math.pow(Math.max(1, day - 1) * 0.75 + 2.5, 3));
}

export function getMaxAttack(day: number, town_type: TownTypeId): number {
    return Math.round(getMaxRatio(day, town_type) * Math.pow(day * 0.75 + 3.5, 3));
}

/** Pénalité d'attaque par âme rouge sous le niveau SPA 2 (BuildingValueQuery::NightlyRedSoulPenalty par défaut). */
export const RED_SOUL_PENALTY: number = 0.04;
/** Pénalité réduite par âme rouge à partir du niveau SPA 2 (bâtiment votable item_soul_blue_static). */
export const RED_SOUL_PENALTY_PURIFIED: number = 0.02;
/** Niveau du bâtiment SPA à partir duquel la pénalité par âme passe à 2 %. */
export const PURIFIED_SPA_LEVEL: number = 2;

/**
 * Facteur d'attaque des âmes rouges : min(1 + p·âmes, plafond). p dépend du niveau SPA (0-3) en vigueur
 * au moment considéré : 4 % sous le niveau 2, 2 % à partir du niveau 2. Plafond 1,2 (défaut du jeu, aussi
 * retenu pour CUSTOM), 666 en Pandé.
 * @param souls Âmes rouges présentes.
 * @param town_type Type de la ville.
 * @param spa_level Niveau du bâtiment SPA (0-3, défaut 0 = pénalité 4 %).
 */
export function getSoulFactor(souls: number, town_type: TownTypeId, spa_level: number = 0): number {
    const cap: number = town_type === 'PANDE' ? 666 : 1.2;
    const penalty: number = spa_level >= PURIFIED_SPA_LEVEL ? RED_SOUL_PENALTY_PURIFIED : RED_SOUL_PENALTY;
    return Math.min(1 + penalty * souls, cap);
}
