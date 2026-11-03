import { BuildingUpgradesDTO, CEMETERY_RATIO_EFFECT, TOWN_DEFENSE_SCALE_EFFECT, upgradeEffect } from './building-upgrades.types';
import {
    CEMETERY_UID,
    CIRCULAR_QUARTERS_UID,
    COFFINS_BONUS_PER_DEAD,
    COFFINS_UID,
    DEFENSE_ADJUSTMENT_UID,
    DEFENSE_FIXINGS_STEP,
    DEFENSE_FIXINGS_UID,
    FORTIFIED_HOMES_BONUS,
    FORTIFIED_HOMES_UID,
    HOME_DEFENSE_FACTOR,
    HOME_DEFENSE_FACTOR_CIRCULAR
} from './defense-rules.const';
import { BuildingRef } from './plan-evaluation.util';
import { ResourceCount } from './resources.util';

/** Composantes de la défense de la ville que touchent les chantiers à effet indirect. */
export interface TownDefenseFactors {
    /** Objets de défense en banque. */
    defenseItems: number;
    /** Multiplicateur des objets de défense (1 sans Fixations de défenses). */
    itemFactor: number;
    /** Somme brute des défenses de maison des citoyens vivants, avant le pourcentage compté par la ville. */
    homeRaw: number;
    /** Citoyens vivants. */
    alive: number;
    /** Citoyens morts. */
    dead: number;
    /** Échelle de toute la défense (Ajustement défensif), 1 sans. */
    scale: number;
}

/** Ce qu'il faut pour calculer le gain réel des chantiers d'une journée. */
export interface DefenseGainContext {
    /** Uids des chantiers construits au début de la journée. */
    builtBefore: ReadonlySet<string>;
    factors: TownDefenseFactors;
    /** Objets qui comptent comme objets de défense (propriété `defence`). */
    defenseItemIds: ReadonlySet<number>;
    /** Évolutions des chantiers (valeurs par niveau extraites du jeu). */
    upgrades: BuildingUpgradesDTO;
    /** Défense totale de la ville au début de la journée, échelle comprise. */
    baseDefense: number;
}

/** Gain de défense de la journée et composantes au soir. */
export interface DefenseGainResult {
    /** Défense ajoutée à la ville, échelle globale comprise. */
    total: number;
    factorsAfter: TownDefenseFactors;
}

/**
 * Pourcentage de la défense des maisons compté par la ville.
 * @param {boolean} circular Quartiers circulaires construits.
 * @returns {number} Facteur.
 */
export function homeDefenseFactor(circular: boolean): number {
    return circular ? HOME_DEFENSE_FACTOR_CIRCULAR : HOME_DEFENSE_FACTOR;
}

/**
 * Objets de défense que consomme une liste de ressources.
 * @param {readonly ResourceCount[]} resources Ressources.
 * @param {ReadonlySet<number>} defense_item_ids Objets de défense.
 * @returns {number} Objets de défense consommés.
 */
function consumedDefenseItems(resources: readonly ResourceCount[], defense_item_ids: ReadonlySet<number>): number {
    return resources.reduce((sum: number, resource: ResourceCount): number => sum + (defense_item_ids.has(resource.itemId) ? resource.count : 0), 0);
}

/**
 * Défense réellement gagnée par la ville avec les chantiers terminés et les montées de maison de la journée :
 * - défense propre des chantiers ;
 * - moins la défense des objets de défense consommés en banque (arrondi de la banque à l'inférieur, comme le jeu) ;
 * - Habitations fortifiées : +4 par maison de citoyen vivant, comptée à 40 % (80 % avec Quartiers circulaires) ;
 * - Quartiers circulaires : la défense des maisons passe de 40 % à 80 % ;
 * - Fixations de défenses : multiplicateur des objets de défense +0,5 ;
 * - Cimetière cadenassé : défense par mort de son niveau 0 (donnée d'évolution) ;
 * - Cercueils sur ressorts : +10 par mort (le cimetière doit être construit) ;
 * - le tout multiplié par l'échelle globale de la défense ; l'Ajustement défensif construit dans la journée change cette
 *   échelle pour toute la défense de la ville (valeur de son niveau 0).
 * @param {readonly BuildingRef[]} completed Chantiers terminés dans la journée.
 * @param {number} home_raw_gain Défense de maison brute gagnée par les montées de niveau du plan.
 * @param {DefenseGainContext} context État de la ville au début de la journée.
 * @param {number} voted_item_step Hausse du multiplicateur des objets de défense par le vote du soir sur les Fixations.
 * @returns {DefenseGainResult} Gain et composantes au soir.
 */
export function defenseGain(completed: readonly BuildingRef[], home_raw_gain: number, context: DefenseGainContext, voted_item_step: number = 0): DefenseGainResult {
    const factors: TownDefenseFactors = context.factors;
    const completed_uids: ReadonlySet<string> = new Set<string>(completed.map((building: BuildingRef): string => building.uid));
    const is_new = (uid: string): boolean => completed_uids.has(uid) && !context.builtBefore.has(uid);
    const built_after = (uid: string): boolean => context.builtBefore.has(uid) || completed_uids.has(uid);

    const homes_before: number = Math.floor(factors.homeRaw * homeDefenseFactor(context.builtBefore.has(CIRCULAR_QUARTERS_UID)));
    const home_raw_after: number = factors.homeRaw + home_raw_gain + (is_new(FORTIFIED_HOMES_UID) ? FORTIFIED_HOMES_BONUS * factors.alive : 0);
    const homes_after: number = Math.floor(home_raw_after * homeDefenseFactor(built_after(CIRCULAR_QUARTERS_UID)));

    const consumed: number = Math.min(
        factors.defenseItems,
        completed.reduce((sum: number, building: BuildingRef): number => sum + consumedDefenseItems(building.resources, context.defenseItemIds), 0)
    );
    const item_factor_after: number = factors.itemFactor + (is_new(DEFENSE_FIXINGS_UID) ? DEFENSE_FIXINGS_STEP : 0) + voted_item_step;
    const items_before: number = Math.floor(factors.defenseItems * factors.itemFactor);
    const items_after: number = Math.floor((factors.defenseItems - consumed) * item_factor_after);

    const own_defense: number = completed.reduce((sum: number, building: BuildingRef): number => sum + building.defence, 0);
    const cemetery: number = is_new(CEMETERY_UID) ? (upgradeEffect(context.upgrades, CEMETERY_UID, CEMETERY_RATIO_EFFECT, 0) ?? 0) * factors.dead : 0;
    const coffins: number = is_new(COFFINS_UID) && built_after(CEMETERY_UID) ? COFFINS_BONUS_PER_DEAD * factors.dead : 0;

    const raw_gain: number = own_defense + (homes_after - homes_before) + (items_after - items_before) + cemetery + coffins;
    const scale_after: number = is_new(DEFENSE_ADJUSTMENT_UID)
        ? (upgradeEffect(context.upgrades, DEFENSE_ADJUSTMENT_UID, TOWN_DEFENSE_SCALE_EFFECT, 0) ?? factors.scale)
        : factors.scale;
    // Défense de départ ramenée hors échelle, pour appliquer une échelle qui change à toute la ville.
    const unscaled_base: number = factors.scale > 0 ? context.baseDefense / factors.scale : context.baseDefense;
    return {
        total: Math.round((unscaled_base + raw_gain) * scale_after) - Math.round(unscaled_base * factors.scale),
        factorsAfter: {
            ...factors,
            defenseItems: factors.defenseItems - consumed,
            itemFactor: item_factor_after,
            homeRaw: home_raw_after,
            scale: scale_after
        }
    };
}

/**
 * Défense réellement apportée par un chantier terminé seul, dans l'état de la ville au début de la journée.
 * @param {BuildingRef} building Chantier.
 * @param {DefenseGainContext} context État de la ville.
 * @returns {number} Gain réel.
 */
export function buildingDefenseGain(building: BuildingRef, context: DefenseGainContext): number {
    return defenseGain([building], 0, context).total;
}

/** Défense affichée par chantier et gain du vote sur les objets de défense. */
export interface PlannedDefense {
    /** Gain par id de chantier. */
    buildings: Map<number, number>;
    /** Gain du vote sur les Fixations de défenses (objets de défense en banque), 0 sans. */
    vote: number;
}

/** Ordre de calcul de la défense affichée : d'abord les chantiers dont l'effet sert aux autres, Quartiers circulaires en dernier. */
const GAIN_RANKS: ReadonlyMap<string, number> = new Map<string, number>([
    [DEFENSE_ADJUSTMENT_UID, 0],
    [DEFENSE_FIXINGS_UID, 1],
    [CEMETERY_UID, 3],
    [CIRCULAR_QUARTERS_UID, 5]
]);
/** Le vote sur les Fixations compte juste après elles, avant les chantiers qui consomment des objets de défense. */
const VOTE_RANK: number = 2;
const DEFAULT_RANK: number = 4;

/**
 * Défense affichée par chantier, dans l'état du soir (chantiers terminés dans la journée et vote) ; les chantiers du jour sont
 * ajoutés l'un après l'autre, si bien que leur somme et le vote égalent le gain de la journée :
 * - Ajustement défensif, Fixations de défenses, leur vote et Cimetière cadenassé comptent sur l'état actuel de la ville ; les
 *   autres chantiers comptent à leur échelle, à leur multiplicateur d'objets et avec le cimetière ;
 * - Quartiers circulaires comptent en dernier, avec les maisons ajoutées dans la journée (Habitations fortifiées, montées de maison).
 * Un chantier non terminé dans la journée compte comme s'il s'ajoutait à l'état du soir.
 * @param {readonly BuildingRef[]} completed Chantiers terminés dans la journée.
 * @param {readonly BuildingRef[]} pending Chantiers à construire non terminés dans la journée.
 * @param {number} home_raw_gain Défense de maison brute gagnée par les montées de niveau du plan.
 * @param {DefenseGainContext} context État de la ville au début de la journée.
 * @param {number} voted_item_step Hausse du multiplicateur des objets de défense par le vote du soir sur les Fixations.
 * @returns {PlannedDefense} Défense par chantier et gain du vote.
 */
export function plannedDefenseGains(
    completed: readonly BuildingRef[],
    pending: readonly BuildingRef[],
    home_raw_gain: number,
    context: DefenseGainContext,
    voted_item_step: number
): PlannedDefense {
    const total = (buildings: readonly BuildingRef[], voted: boolean): number => defenseGain(buildings, home_raw_gain, context, voted ? voted_item_step : 0).total;
    const rank = (building: BuildingRef): number => GAIN_RANKS.get(building.uid) ?? DEFAULT_RANK;
    // null : le vote.
    const steps: (BuildingRef | null)[] = [...completed].sort((a: BuildingRef, b: BuildingRef): number => rank(a) - rank(b));
    const vote_index: number = steps.findIndex((step: BuildingRef | null): boolean => step !== null && rank(step) > VOTE_RANK);
    steps.splice(vote_index === -1 ? steps.length : vote_index, 0, null);

    const gains: Map<number, number> = new Map<number, number>();
    const done: BuildingRef[] = [];
    let voted: boolean = false;
    let vote: number = 0;
    let current: number = total(done, voted);
    for (const step of steps) {
        if (step === null) {
            voted = true;
        } else {
            done.push(step);
        }
        const next: number = total(done, voted);
        if (step === null) {
            vote = next - current;
        } else {
            gains.set(step.id, next - current);
        }
        current = next;
    }
    for (const building of pending) {
        gains.set(building.id, total([...done, building], voted) - current);
    }
    return { buildings: gains, vote };
}

/**
 * Facteurs neutres : aucun effet indirect (ville inconnue).
 * @returns {TownDefenseFactors} Facteurs.
 */
export function neutralDefenseFactors(): TownDefenseFactors {
    return { defenseItems: 0, itemFactor: 1, homeRaw: 0, alive: 0, dead: 0, scale: 1 };
}
