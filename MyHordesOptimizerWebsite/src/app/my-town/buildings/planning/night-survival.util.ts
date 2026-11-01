/** Uid du réacteur : perd 50 à 125 PV chaque nuit, imperméable à l'attaque. */
export const REACTOR_UID: string = 'small_arma_#00';

/** Uid des feux d'artifice : perdent 20 PV chaque nuit après l'attaque. */
export const FIREWORKS_UID: string = 'small_fireworks_#00';

/** Perte propre du réacteur retenue : pire cas de `mt_rand(50, 125)`. */
const REACTOR_LOSS: number = 125;

/** Perte propre des feux d'artifice. */
const FIREWORKS_LOSS: number = 20;

/** Part maximale des PV qu'une attaque de Pandémonium retire à un chantier. */
const ATTACK_SHARE: number = 0.7;

/** Ce qui détermine les pertes de PV d'un chantier la nuit. */
export interface NightExposure {
    uid: string;
    maxLife: number;
    temporary: boolean;
    breakable: boolean;
}

/**
 * PV qu'un chantier construit peut perdre la nuit, dans le pire cas (règles du jeu, `NightlyHandler` et `BuildingEffectListener`).
 * @param {NightExposure} building Chantier.
 * @param {boolean} hard_mode Vrai en Pandémonium (seul mode où l'attaque abîme les chantiers).
 * @returns {number} Perte maximale (≥ 0).
 */
export function nightLifeLoss(building: NightExposure, hard_mode: boolean): number {
    const attacked: boolean = hard_mode && building.breakable && !building.temporary && building.maxLife > 0 && building.uid !== REACTOR_UID;
    const attack_loss: number = attacked ? Math.ceil(building.maxLife * ATTACK_SHARE) : 0;
    return attack_loss + ownNightLoss(building.uid);
}

/**
 * Perte de PV propre à un chantier chaque nuit, indépendante de l'attaque (tous types de ville), pire cas.
 * @param {string} uid Uid du chantier.
 * @returns {number} 125 pour le réacteur, 20 pour les feux d'artifice, 0 sinon.
 */
export function ownNightLoss(uid: string): number {
    if (uid === REACTOR_UID) {
        return REACTOR_LOSS;
    }
    return uid === FIREWORKS_UID ? FIREWORKS_LOSS : 0;
}

/**
 * PV à avoir avant la nuit pour être sûr de la passer ; au-delà des PV max, réparer entièrement est le mieux possible.
 * @param {number} max_life PV max du chantier.
 * @param {number} loss Perte maximale de la nuit.
 * @returns {number} PV minimum.
 */
export function minimumSafeLife(max_life: number, loss: number): number {
    return Math.min(max_life, loss + 1);
}
