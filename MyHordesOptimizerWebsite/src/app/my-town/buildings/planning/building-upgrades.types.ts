import { I18nLabels } from '../../../_abstract_model/types/_types';

/** Valeurs d'un effet d'évolution, du niveau 0 au niveau maximum (nulle quand le jeu la calcule). */
export interface BuildingUpgradeEffectDTO {
    levels: (number | null)[];
    default: number | null;
    /** Fichier du jeu où la valeur est écrite. */
    source: string;
}

/** Évolutions d'un chantier (`Fetcher/BuildingUpgrades`, fichier de l'extracteur). */
export interface BuildingUpgradeDTO {
    maxLevel: number;
    /** Texte de base et un texte par niveau (`levels[0]` = niveau 1), traduits. */
    texts?: { base: I18nLabels | null; levels: I18nLabels[] };
    /** Nom de l'effet dans le code du jeu → valeurs par niveau. */
    effects?: Record<string, BuildingUpgradeEffectDTO>;
}

/** Évolutions par uid de chantier. */
export type BuildingUpgradesDTO = Record<string, BuildingUpgradeDTO>;

/** Défense ajoutée par niveau (`BuildingUpgradeListener`). */
export const DEFENSE_INCREMENT_EFFECT: string = 'defenseIncrement';
/** Multiple de la défense propre ajouté par niveau (`BuildingUpgradeListener`). */
export const DEFENSE_MULTIPLIER_EFFECT: string = 'defenseMultiplier';
/** Échelle de toute la défense par niveau de l'Ajustement défensif (`BuildingQueryListener`). */
export const TOWN_DEFENSE_SCALE_EFFECT: string = 'OverallTownDefenseScale';
/** Défense par mort selon le niveau du Cimetière (`TownHandler::calculate_town_def`). */
export const CEMETERY_RATIO_EFFECT: string = 'calculate_town_def.ratio';

/**
 * Valeur d'un effet à un niveau : valeur du niveau, sinon défaut ; nulle si inconnue.
 * @param {BuildingUpgradesDTO} upgrades Évolutions.
 * @param {string} uid Chantier.
 * @param {string} effect Effet.
 * @param {number} level Niveau.
 * @returns {number | null} Valeur.
 */
export function upgradeEffect(upgrades: BuildingUpgradesDTO, uid: string, effect: string, level: number): number | null {
    const values: BuildingUpgradeEffectDTO | undefined = upgrades[uid]?.effects?.[effect];
    if (values === undefined) {
        return null;
    }
    return values.levels[level] ?? values.default;
}

/**
 * Bonus de défense d'un chantier à un niveau, comme le jeu le calcule : multiple de sa défense propre + défense ajoutée.
 * @param {BuildingUpgradesDTO} upgrades Évolutions.
 * @param {string} uid Chantier.
 * @param {number} own_defense Défense propre du chantier.
 * @param {number} level Niveau.
 * @returns {number} Bonus.
 */
export function upgradeDefenseBonus(upgrades: BuildingUpgradesDTO, uid: string, own_defense: number, level: number): number {
    return (upgradeEffect(upgrades, uid, DEFENSE_MULTIPLIER_EFFECT, level) ?? 0) * own_defense + (upgradeEffect(upgrades, uid, DEFENSE_INCREMENT_EFFECT, level) ?? 0);
}

/**
 * Texte d'un niveau dans la langue du site (allemand à défaut) ; nul sans texte.
 * @param {BuildingUpgradesDTO} upgrades Évolutions.
 * @param {string} uid Chantier.
 * @param {number} level Niveau (0 pour le texte de base).
 * @param {string} locale Langue du site.
 * @returns {string | null} Texte.
 */
export function upgradeLevelText(upgrades: BuildingUpgradesDTO, uid: string, level: number, locale: string): string | null {
    const texts: BuildingUpgradeDTO['texts'] = upgrades[uid]?.texts;
    const text: I18nLabels | null | undefined = level === 0 ? texts?.base : texts?.levels[level - 1];
    return text ? (text[locale] ?? text['de'] ?? null) : null;
}
