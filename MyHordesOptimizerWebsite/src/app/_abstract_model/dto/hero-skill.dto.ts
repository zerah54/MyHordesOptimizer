import { Dictionary, I18nLabels } from '../types/_types';

export interface HeroSkillDTO {
    name: string;
    description: I18nLabels;
    icon: string;
    label: I18nLabels;
    nbUses: number;
    /** Jours de héros (anciens pouvoirs) ou points nécessaires (compétences de l'arbre) */
    daysNeeded: number;
    /** Ancien pouvoir, hors de l'arbre des compétences */
    legacy?: boolean;
    /** Groupe de l'arbre des compétences, `null` hors de l'arbre */
    group?: I18nLabels | null;
    /** Ordre du groupe dans l'arbre */
    groupSort?: number | null;
    /** Niveau dans le groupe (0 à 3) */
    level?: number | null;
    /** Avantages du niveau, par langue */
    bullets?: Dictionary<string[]>;
}
