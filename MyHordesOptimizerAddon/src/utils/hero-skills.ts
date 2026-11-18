/**
 * Niveaux S.U.P.E.R. du joueur, au format de l'API MHO (`CitizenHeroSkillLevelsDto`) :
 * 0 aucune capacité, 1 à 4 de Débutant à Maître.
 */
export interface HeroSkillLevels {
    S: number;
    U: number;
    P: number;
    E: number;
    R: number;
}

type HeroSkillGroup = keyof HeroSkillLevels;

/**
 * Libellés des niveaux de MyHordes (Anfänger, Lehrling, Experte, Meister), dans l'ordre et dans
 * toutes les langues du jeu. Le niveau MHO est l'index + 1.
 */
const level_labels: readonly (readonly string[])[] = [
    ['débutant', 'beginner', 'anfänger', 'novato'],
    ['apprenti', 'apprentice', 'lehrling', 'aprendiz'],
    ['expert', 'experte', 'experto'],
    ['maître', 'master', 'meister', 'maestro']
];

/**
 * Groupe d'après son nom traduit : l'initiale donne S.U.P.E.R. dans toutes les langues du jeu
 * (Stratège / Strategist / Strategie / Sabio, Universitaire / University / Umsicht / Universitario…).
 */
function readGroup(name: string | null | undefined): HeroSkillGroup | undefined {
    const initial: string = (name ?? '').trim().charAt(0).toUpperCase();
    return 'SUPER'.includes(initial) && initial !== '' ? initial as HeroSkillGroup : undefined;
}

function readLevel(label: string | null | undefined): number | undefined {
    const normalized: string = (label ?? '').trim().toLowerCase();
    const index: number = level_labels.findIndex((labels: readonly string[]): boolean => labels.includes(normalized));
    return index < 0 ? undefined : index + 1;
}

function noSkill(): HeroSkillLevels {
    return { S: 0, U: 0, P: 0, E: 0, R: 0 };
}

/**
 * Onglet « Capacités actives » de `soul/heroskill`. Chaque groupe y liste les niveaux inférieurs
 * puis le niveau actif : seul le dernier libellé compte ; un groupe vide vaut 0.
 * @return undefined si l'onglet est absent (hors ville) ou si un groupe ou un niveau est illisible :
 *         l'API écrase les cinq niveaux, on n'envoie donc rien plutôt qu'une valeur fausse.
 */
export function readActiveHeroSkills(root: ParentNode): HeroSkillLevels | undefined {
    const tab: Element | null = root.querySelector('[x-tab-group="skill-page"][x-tab-id="current"][x-tab-target]');
    if (!tab) return undefined;

    const levels: HeroSkillLevels = noSkill();
    for (const group_block of Array.from(tab.querySelectorAll('.skills-history'))) {
        const group: HeroSkillGroup | undefined = readGroup(group_block.querySelector('.header')?.textContent);
        if (!group) return undefined;
        const labels: Element[] = Array.from(group_block.querySelectorAll('.ability-indicator b.small'));
        if (labels.length === 0) continue;
        const level: number | undefined = readLevel(labels[labels.length - 1].textContent);
        if (level === undefined) return undefined;
        levels[group] = level;
    }
    return levels;
}

/**
 * Récapitulatif affiché avant de valider l'entrée en ville : une ligne « groupe | niveau » par
 * capacité choisie. Un groupe absent n'a aucune capacité (0).
 * @return undefined sans capacité affichée (métier non héros) ou si une ligne est illisible.
 */
export function readOnboardingHeroSkills(dialog: ParentNode): HeroSkillLevels | undefined {
    const level_elements: Element[] = Array.from(dialog.querySelectorAll('span + span > b'));
    if (level_elements.length === 0) return undefined;

    const levels: HeroSkillLevels = noSkill();
    for (const level_element of level_elements) {
        const group: HeroSkillGroup | undefined = readGroup(level_element.parentElement?.previousElementSibling?.textContent);
        const level: number | undefined = readLevel(level_element.textContent);
        if (!group || level === undefined) return undefined;
        levels[group] = level;
    }
    return levels;
}
