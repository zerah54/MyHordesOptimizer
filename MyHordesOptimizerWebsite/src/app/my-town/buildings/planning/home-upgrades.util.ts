import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { HomeReferentialDTO, HomeUpgradeDTO, HomeUpgradeLevelDTO } from './home-referential.types';

/** Clé `HomeEnum` de chaque amélioration du référentiel du jeu (nom de l'amélioration). */
export const UPGRADE_KEY_BY_NAME: Readonly<Record<string, string>> = {
    alarm: HomeEnum.HAS_ALARM.key,
    chest: HomeEnum.CHEST_LEVEL.key,
    curtain: HomeEnum.HAS_CURTAIN.key,
    defense: HomeEnum.HOUSE_DEFENSE.key,
    fence: HomeEnum.HAS_FENCE.key,
    kitchen: HomeEnum.KITCHEN_LEVEL.key,
    lab: HomeEnum.LAB_LEVEL.key,
    lock: HomeEnum.HAS_LOCK.key,
    rest: HomeEnum.REST_LEVEL.key
};

/**
 * Niveaux à payer pour passer du niveau actuel au niveau visé, enchaînés ; seulement le niveau visé si le niveau actuel est inconnu.
 * @param {number | null} from Niveau actuel, nul s'il est inconnu.
 * @param {number} to Niveau visé.
 * @returns {number[]} Niveaux à payer, croissants (vide si le niveau visé est déjà atteint).
 */
export function cascadeLevels(from: number | null, to: number): number[] {
    if (from === null) {
        return [to];
    }
    const levels: number[] = [];
    for (let level: number = from + 1; level <= to; level++) {
        levels.push(level);
    }
    return levels;
}

/**
 * PA cumulés des niveaux à payer pour passer du niveau actuel au niveau visé.
 * @param {(level: number) => number} ap_of PA d'un niveau.
 * @param {number | null} from Niveau actuel, nul s'il est inconnu.
 * @param {number} to Niveau visé.
 * @returns {number} PA.
 */
export function cascadeAp(ap_of: (level: number) => number, from: number | null, to: number): number {
    return cascadeLevels(from, to).reduce((sum: number, level: number): number => sum + ap_of(level), 0);
}

/**
 * Niveaux d'habitation atteignables : un agrandissement par jour, sans limite en chaos ou en Pandémonium ; tous si le niveau actuel est inconnu.
 * @param {number[]} levels Niveaux du référentiel, croissants.
 * @param {number | null} current Niveau actuel, nul s'il est inconnu.
 * @param {boolean} unlimited Ville en chaos ou en Pandémonium.
 * @returns {number[]} Niveaux proposables.
 */
export function reachableHomeLevels(levels: number[], current: number | null, unlimited: boolean): number[] {
    if (current === null) {
        return levels;
    }
    return levels.filter((level: number): boolean => (unlimited ? level > current : level === current + 1));
}

/** Amélioration de maison proposable dans une consigne, avec le coût en PA de chaque niveau. */
export interface HomeUpgradeRef {
    key: string;
    label: string;
    max_level: number;
    levels: { level: number; ap: number }[];
}

/**
 * Améliorations du référentiel connues du site, avec leur libellé traduit ; les inconnues sont ignorées.
 * @param {HomeReferentialDTO} referential Référentiel des maisons.
 * @returns {HomeUpgradeRef[]} Améliorations.
 */
export function homeUpgradeRefs(referential: HomeReferentialDTO): HomeUpgradeRef[] {
    return referential.upgrades
        .map((upgrade: HomeUpgradeDTO): HomeUpgradeRef | null => {
            const element: HomeEnum | undefined = HomeEnum.getByKey<HomeEnum>(UPGRADE_KEY_BY_NAME[upgrade.name] ?? '');
            return element === undefined ? null : {
                key: element.key,
                label: element.getLabel(),
                max_level: element.value.max_lvl,
                levels: upgrade.levels.map((level: HomeUpgradeLevelDTO): { level: number; ap: number } => ({ level: level.level, ap: level.ap }))
            };
        })
        .filter((upgrade: HomeUpgradeRef | null): upgrade is HomeUpgradeRef => upgrade !== null);
}
