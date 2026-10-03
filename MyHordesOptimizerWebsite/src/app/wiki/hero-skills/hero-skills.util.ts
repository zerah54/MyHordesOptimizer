import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';

/** Un niveau d'un groupe de compétences, tel qu'affiché. */
export interface HeroSkillLevelView {
    readonly name: string;
    /** Points de héros nécessaires ; 0 pour les niveaux acquis d'office */
    readonly points_needed: number;
    readonly bullets: readonly string[];
}

/** Un groupe de compétences (Stratège, Universitaire…), ses niveaux dans l'ordre. */
export interface HeroSkillGroupView {
    readonly name: string;
    readonly levels: readonly HeroSkillLevelView[];
}

/** Noms des niveaux d'un groupe : ils ne figurent pas dans les données extraites du jeu. */
const LEVEL_NAMES: readonly string[] = [$localize`Débutant`, $localize`Apprenti`, $localize`Expert`, $localize`Élite`];

/** Langue de repli des textes extraits du jeu : l'allemand, langue de la source MyHordes. */
const SOURCE_LOCALE: string = 'de';

/**
 * Ce que tout habitant a, héros ou non : ce n'est pas une compétence de l'arbre, le jeu ne le décrit
 * que sur sa page. Premier groupe affiché.
 */
export function citizenBaseGroup(): HeroSkillGroupView {
    return {
        name: $localize`Compétences disponibles`,
        levels: [{
            name: $localize`Habitant`,
            points_needed: 0,
            bullets: [
                $localize`4 places dans le sac à dos`,
                $localize`4 places dans le coffre`,
                $localize`10 points de défense durant la Veille`,
                $localize`Écrire sur le forum de la ville`
            ]
        }]
    };
}

function levelName(level: number): string {
    return LEVEL_NAMES[level] ?? $localize`Niveau ${level + 1}:level:`;
}

/**
 * Arbre des compétences à partir des compétences servies par l'API : celles qui ont un groupe (les
 * anciens pouvoirs et les actions héroïques n'en ont pas), groupées dans l'ordre du jeu puis par
 * niveau. Textes dans la langue du site, à défaut en allemand.
 */
export function buildHeroSkillTree(skills: readonly HeroSkill[], locale: string): HeroSkillGroupView[] {
    const groups: Map<string, { sort: number; name: string; skills: HeroSkill[] }> = new Map<string, { sort: number; name: string; skills: HeroSkill[] }>();
    skills.forEach((skill: HeroSkill): void => {
        const key: string | undefined = skill.group?.[SOURCE_LOCALE] ?? undefined;
        if (!skill.group || !key || skill.level === null) {
            return;
        }
        const group: { sort: number; name: string; skills: HeroSkill[] } = groups.get(key) ?? {
            sort: skill.group_sort ?? Number.MAX_SAFE_INTEGER,
            name: skill.group[locale] || key,
            skills: []
        };
        group.skills.push(skill);
        groups.set(key, group);
    });
    return [...groups.values()]
        .sort((a: { sort: number; name: string }, b: { sort: number; name: string }): number => a.sort - b.sort || a.name.localeCompare(b.name))
        .map((group: { sort: number; name: string; skills: HeroSkill[] }): HeroSkillGroupView => ({
            name: group.name,
            levels: [...group.skills]
                .sort((a: HeroSkill, b: HeroSkill): number => (a.level ?? 0) - (b.level ?? 0))
                .map((skill: HeroSkill): HeroSkillLevelView => ({
                    name: levelName(skill.level ?? 0),
                    points_needed: skill.days_needed ?? 0,
                    bullets: skill.bullets[locale]?.length ? skill.bullets[locale] : (skill.bullets[SOURCE_LOCALE] ?? [])
                }))
        }));
}
