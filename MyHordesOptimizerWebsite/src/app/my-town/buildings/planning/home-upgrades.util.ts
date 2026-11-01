import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { HomeReferentialDTO, HomeUpgradeDTO, HomeUpgradeLevelDTO } from './home-referential.types';

/** Clé `HomeEnum` de chaque amélioration du référentiel du jeu (nom de l'amélioration). */
const UPGRADE_KEY_BY_NAME: Readonly<Record<string, string>> = {
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
