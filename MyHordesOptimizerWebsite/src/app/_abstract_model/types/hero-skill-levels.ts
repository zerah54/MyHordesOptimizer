/** Groupe de l'arbre des capacités héroïques, désigné par la lettre que les joueurs utilisent (S, U, P, E, R). */
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

/** Niveau le plus haut d'un groupe (Élite). 0 : aucun niveau. */
export const MAX_HERO_SKILL_LEVEL: number = 4;

/** Niveau du citoyen dans chaque groupe, de 0 à {@link MAX_HERO_SKILL_LEVEL} ; `null` : inconnu. */
export type HeroSkillLevels = Readonly<Record<HeroSkillFamily, number | null>>;

export const UNKNOWN_HERO_SKILL_LEVELS: HeroSkillLevels = { s: null, u: null, p: null, e: null, r: null };

/** Noms des niveaux d'un groupe, du premier au quatrième : ils ne figurent pas dans les données extraites du jeu. */
const LEVEL_NAMES: readonly string[] = [$localize`Débutant`, $localize`Apprenti`, $localize`Expert`, $localize`Élite`];

/** Nom d'un niveau, compté à partir de 0 comme dans les données du jeu (0 : Débutant). */
export function heroSkillLevelName(level: number): string {
    return LEVEL_NAMES[level] ?? $localize`Niveau ${level + 1}:level:`;
}

/** Valeur lue de l'API : un niveau entier dans les bornes, sinon inconnu. */
export function toHeroSkillLevel(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_HERO_SKILL_LEVEL ? value : null;
}
