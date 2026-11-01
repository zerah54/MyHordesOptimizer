import { JobEnum } from '../enum/job.enum';
import { I18nLabels } from './_types';

/** Groupe de l'arbre des compétences héroïques, désigné par la lettre que les joueurs utilisent (S, U, P, E, R). */
export type HeroSkillFamily = 's' | 'u' | 'p' | 'e' | 'r';

export interface HeroSkillFamilyInfo {
    readonly key: HeroSkillFamily;
    readonly letter: string;
    /** Rang du groupe dans l'arbre de MyHordes (`groupSort` des compétences servies par l'API). */
    readonly group_sort: number;
}

/** Les cinq groupes dans l'ordre du jeu : Stratégie, Prudence, Préparation, Endurance, Repos. */
export const HERO_SKILL_FAMILIES: readonly HeroSkillFamilyInfo[] = [
    { key: 's', letter: 'S', group_sort: 0 },
    { key: 'u', letter: 'U', group_sort: 1 },
    { key: 'p', letter: 'P', group_sort: 2 },
    { key: 'e', letter: 'E', group_sort: 3 },
    { key: 'r', letter: 'R', group_sort: 4 }
];

/** Lettre de chaque groupe, par clé. */
export const HERO_SKILL_LETTERS: Readonly<Record<HeroSkillFamily, string>> = { s: 'S', u: 'U', p: 'P', e: 'E', r: 'R' };

/** Niveau le plus haut d'un groupe (Maître). */
export const MAX_HERO_SKILL_LEVEL: number = 4;

/** Niveau du citoyen dans chaque groupe : 0 pour un habitant, 1 à {@link MAX_HERO_SKILL_LEVEL} pour un héros ; `null` : inconnu. */
export type HeroSkillLevels = Readonly<Record<HeroSkillFamily, number | null>>;

export const UNKNOWN_HERO_SKILL_LEVELS: HeroSkillLevels = { s: null, u: null, p: null, e: null, r: null };

/** Noms des niveaux d'un groupe, du premier au quatrième : ils ne figurent pas dans les données extraites du jeu. */
const LEVEL_NAMES: readonly string[] = [$localize`Débutant`, $localize`Apprenti`, $localize`Expert`, $localize`Maître`];

/** Nom d'un niveau, compté à partir de 0 comme dans les données du jeu (0 : Débutant). */
export function heroSkillLevelName(level: number): string {
    return LEVEL_NAMES[level] ?? $localize`Niveau ${level + 1}:level:`;
}

/** Valeur lue de l'API : un niveau entier dans les bornes, sinon inconnu. */
export function toHeroSkillLevel(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_HERO_SKILL_LEVEL ? value : null;
}

/**
 * Un métier a-t-il des niveaux de compétences ? Tous sauf Habitant (métier inconnu compris).
 * @param {JobEnum | undefined} job Métier.
 * @returns {boolean} Vrai si les niveaux se saisissent.
 */
export function hasHeroSkills(job: JobEnum | undefined): boolean {
    return job?.key !== JobEnum.CITIZEN.key;
}

/**
 * Niveau valable pour un métier : toujours 0 pour un habitant, jamais 0 pour un héros (inconnu à la place).
 * @param {JobEnum | undefined} job Métier.
 * @param {number | null} level Niveau enregistré.
 * @returns {number | null} Niveau à retenir.
 */
export function heroSkillLevelForJob(job: JobEnum | undefined, level: number | null): number | null {
    if (!hasHeroSkills(job)) {
        return 0;
    }
    return level === 0 ? null : level;
}

/** Ce qu'il faut d'une compétence du référentiel pour nommer son groupe. */
export interface HeroSkillGroupSource {
    readonly legacy: boolean;
    readonly group: I18nLabels | null;
    readonly group_sort: number | null;
}

/**
 * Nom de chaque groupe, lu dans les compétences actuelles servies par l'API (allemand, puis lettre, à défaut).
 * @param {readonly HeroSkillGroupSource[]} skills Compétences du référentiel.
 * @param {string} locale Langue du site.
 * @returns {Record<HeroSkillFamily, string>} Nom par groupe.
 */
export function heroSkillGroupNames(skills: readonly HeroSkillGroupSource[], locale: string): Record<HeroSkillFamily, string> {
    const names: Record<HeroSkillFamily, string> = { ...HERO_SKILL_LETTERS };
    HERO_SKILL_FAMILIES.forEach((family: HeroSkillFamilyInfo): void => {
        const group: I18nLabels | null | undefined = skills.find((skill: HeroSkillGroupSource): boolean => !skill.legacy && skill.group_sort === family.group_sort)?.group;
        const name: string | undefined = group?.[locale] || group?.['de'];
        if (name) {
            names[family.key] = name;
        }
    });
    return names;
}

/**
 * Résumé d'un groupe pour un citoyen : nom du groupe et nom du niveau.
 * @param {string} group Nom du groupe.
 * @param {number | null} level Niveau (0 : aucun, null : inconnu).
 * @returns {string | null} Résumé, nul sans niveau connu.
 */
export function heroSkillSummary(group: string, level: number | null): string | null {
    return level === null || level === 0 ? null : `${group} : ${heroSkillLevelName(level - 1)}`;
}
