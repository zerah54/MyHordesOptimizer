import { displayedBagCapacity } from '../../_shared/bag/bag-capacity.util';
import { NightwatchCityDefenseDTO, NightwatchPlanContentDTO, NightwatchPlanDTO } from './nightwatch.types';

/** Défense de la ville résolue : tous les postes renseignés (`fddCoefficient` décimal, `adLevel` -1 = non construit, 0 à 3). */
export interface CityDefenseValues {
    buildings: number;
    upgrades: number;
    wall: number;
    bankDefenseItems: number;
    homes: number;
    guardians: number;
    guardTowerPa: number;
    souls: number;
    cemetery: number;
    eveningVote: number;
    dumpContribution: number;
    fddCoefficient: number;
    adLevel: number;
}

/** Bonus de l'Autel du Dernier Désespoir par niveau (-1 = non construit). */
export const AD_COEFFICIENTS: Readonly<Record<number, number>> = { [-1]: 0, 0: 0.10, 1: 0.11, 2: 0.12, 3: 0.13 };

const DEFENSE_KEYS: readonly (keyof CityDefenseValues)[] = [
    'buildings', 'upgrades', 'wall', 'bankDefenseItems', 'homes', 'guardians', 'guardTowerPa', 'souls',
    'cemetery', 'eveningVote', 'dumpContribution', 'fddCoefficient', 'adLevel'
];

/**
 * Défense de la ville de chaque jour : valeur saisie, sinon la dernière saisie des jours précédents, sinon le pré-remplissage du jour.
 * @param {readonly NightwatchPlanDTO[]} days Propositions retenues, par jour croissant.
 * @param {CityDefenseValues | readonly CityDefenseValues[]} prefill Pré-remplissage commun, ou un par jour (même ordre que `days`).
 * @returns {CityDefenseValues[]} Une défense résolue par jour.
 */
export function resolvedCityDefense(days: readonly NightwatchPlanDTO[], prefill: CityDefenseValues | readonly CityDefenseValues[]): CityDefenseValues[] {
    const last_entered: Partial<CityDefenseValues> = {};
    return days.map((day: NightwatchPlanDTO, index: number): CityDefenseValues => {
        const entered: NightwatchCityDefenseDTO | null | undefined = day.content.cityDefense;
        const prefill_of_day: CityDefenseValues = isPrefillList(prefill) ? prefill[index] : prefill;
        const resolved: CityDefenseValues = { ...prefill_of_day };
        for (const key of DEFENSE_KEYS) {
            const value: number | null | undefined = entered?.[key];
            if (value !== null && value !== undefined) {
                last_entered[key] = value;
            }
            resolved[key] = last_entered[key] ?? prefill_of_day[key];
        }
        return resolved;
    });
}

/**
 * Distingue un pré-remplissage par jour d'un pré-remplissage commun.
 * @param {CityDefenseValues | readonly CityDefenseValues[]} prefill Pré-remplissage.
 * @returns {boolean} Vrai si un pré-remplissage par jour.
 */
function isPrefillList(prefill: CityDefenseValues | readonly CityDefenseValues[]): prefill is readonly CityDefenseValues[] {
    return Array.isArray(prefill);
}

/**
 * Objectif hors AD : attaque ajustée (réduction, débordement, réacteur) divisée par le bonus de l'AD, arrondie au supérieur.
 * @param {number} attack Attaque estimée.
 * @param {number} ad_level Niveau de l'AD (-1 = non construit).
 * @param {NightwatchPlanContentDTO} content Contenu de la proposition (débordement, réduction, réacteur).
 * @returns {number} Objectif hors AD.
 */
export function attackGoal(attack: number, ad_level: number, content: NightwatchPlanContentDTO): number {
    const to_cover: number = attack * (100 - (content.attackReductionPercent ?? 0)) / 100
        - (content.allowedOverflow ?? 0) + (content.reactorDamage ?? 0);
    return Math.ceil(to_cover / (1 + (AD_COEFFICIENTS[ad_level] ?? 0)));
}

/**
 * Défense de la ville hors veille : somme des postes, objets de défense multipliés par le coefficient FDD.
 * @param {CityDefenseValues} defense Défense de la ville du jour.
 * @returns {number} Total des postes.
 */
export function cityDefenseTotal(defense: CityDefenseValues): number {
    return defense.wall + defense.bankDefenseItems * defense.fddCoefficient + defense.buildings
        + defense.upgrades + defense.cemetery + defense.eveningVote + defense.guardians + defense.homes
        + defense.guardTowerPa + defense.souls + defense.dumpContribution;
}

/**
 * Défense restant à couvrir par les veilleurs : objectif hors AD moins les postes.
 * @param {number} attack Attaque estimée.
 * @param {CityDefenseValues} defense Défense de la ville du jour.
 * @param {NightwatchPlanContentDTO} content Contenu de la proposition (débordement, réduction, réacteur).
 * @returns {number} Reste à couvrir, négatif si la ville est déjà couverte.
 */
export function remainingToCover(attack: number, defense: CityDefenseValues, content: NightwatchPlanContentDTO): number {
    return Math.ceil(attackGoal(attack, defense.adLevel, content) - cityDefenseTotal(defense));
}

/**
 * Veilles passées d'un citoyen : réelles plus celles de la simulation du jour courant (inclus) au jour considéré (exclu).
 * @param {readonly NightwatchPlanDTO[]} days Propositions de la simulation.
 * @param {number} day Jour considéré (exclu).
 * @param {number} user_id Citoyen.
 * @param {number} real_past Veilles réelles effectuées avant le jour courant.
 * @param {number} current_day Jour courant : les jours antérieurs sont déjà comptés dans `real_past`.
 * @returns {number} Nombre de veilles.
 */
export function simulationPastWatches(days: readonly NightwatchPlanDTO[], day: number, user_id: number, real_past: number, current_day: number): number {
    return real_past + days.filter((d: NightwatchPlanDTO): boolean =>
        d.day >= current_day && d.day < day && d.content.watchers.some((w: { userId: number }): boolean => w.userId === user_id)).length;
}

/**
 * Stock au jour donné : retire les objets à usage unique consommés les jours antérieurs.
 * @param {Record<number, number>} stock Stock de départ.
 * @param {readonly NightwatchPlanDTO[]} days Propositions de la simulation.
 * @param {number} day Jour considéré (exclu).
 * @param {ReadonlySet<number>} single_use_ids Objets à usage unique.
 * @returns {Record<number, number>} Stock restant, plancher 0.
 */
export function remainingStock(
    stock: Record<number, number>, days: readonly NightwatchPlanDTO[], day: number, single_use_ids: ReadonlySet<number>
): Record<number, number> {
    const result: Record<number, number> = { ...stock };
    for (const d of days.filter((p: NightwatchPlanDTO): boolean => p.day < day)) {
        for (const [id, quantity] of Object.entries(d.content.globalItems ?? {}) as [string, number][]) {
            const item_id: number = Number(id);
            if (single_use_ids.has(item_id) && item_id in result) {
                result[item_id] = Math.max(0, result[item_id] - quantity);
            }
        }
    }
    return result;
}

/**
 * Places de sac et encombrants offerts par un groupe de veilleurs.
 * @param {readonly { endurance_level: number | null; item_uids: readonly string[]; is_guardian: boolean }[]} watchers Veilleurs.
 * @returns {{ slots: number; slots_known: boolean; heavy: number }} Places (minimum garanti si un niveau est inconnu) et encombrants.
 */
export function offeredCapacity(
    watchers: readonly { endurance_level: number | null; item_uids: readonly string[]; is_guardian: boolean }[]
): { slots: number; slots_known: boolean; heavy: number } {
    return {
        slots: watchers.reduce((sum: number, w: { endurance_level: number | null; item_uids: readonly string[] }): number => sum + displayedBagCapacity(w.endurance_level, w.item_uids), 0),
        slots_known: watchers.every((w: { endurance_level: number | null }): boolean => w.endurance_level !== null),
        heavy: watchers.reduce((sum: number, w: { is_guardian: boolean }): number => sum + (w.is_guardian ? 2 : 1), 0)
    };
}

/**
 * Verdict de couverture et nombre de veilleurs manquants.
 * @param {number} remaining Défense restant à couvrir.
 * @param {number} watch_defense Défense apportée par les veilleurs.
 * @param {number} average_watcher_defense Défense moyenne d'un veilleur.
 * @returns {{ covered: boolean; missing_watchers: number | null }} Couvert ; manquants (nul si moyenne inexploitable).
 */
export function verdict(remaining: number, watch_defense: number, average_watcher_defense: number): { covered: boolean; missing_watchers: number | null } {
    if (watch_defense >= remaining) {
        return { covered: true, missing_watchers: 0 };
    }
    return {
        covered: false,
        missing_watchers: average_watcher_defense <= 0 ? null : Math.ceil((remaining - watch_defense) / average_watcher_defense)
    };
}
