import { DailyActionEnum } from '../../_abstract_model/enum/daily-action.enum';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { HERO_SKILL_FAMILIES, HeroSkillFamily, HeroSkillFamilyInfo } from '../../_abstract_model/types/hero-skill-levels';
import { HeroicActionsWithValue } from '../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../_abstract_model/types/home.class';
import { Item } from '../../_abstract_model/types/item.class';
import { computeReconstructedHomeDefense } from '../../_abstract_model/utils/citizen-home-defense.util';

/** Identifiant (tri, filtre, colonne) du nombre de campings. */
export const CAMPING_COUNT_ID: string = 'camping_count';
/** Préfixe des identifiants des groupes de compétences héroïques (`skill_s`…). */
export const HERO_SKILL_ID_PREFIX: string = 'skill_';
/** Identifiant (tri) de la défense de la maison : base, métier, améliorations et objets du coffre (`computeReconstructedHomeDefense`). */
export const HOUSE_DEFENSE_ID: string = 'house_defense';
/** Identifiant (tri, filtre) du nombre de potions chamaniques bues. */
export const POTIONS_ID: string = 'potions';

/** Poids de l'état « immunisé » dans le tri de l'immunité : l'immunité prime sur le nombre de potions. */
const IMMUNE_SORT_FACTOR: number = 1_000_000;

/** Sens de tri ; vide = aucun tri. */
export type CitizenSortDirection = 'asc' | 'desc' | '';

/** Champ proposé au menu « Trier par ». */
export interface CitizenSortField {
    id: string;
    label: string;
}

/**
 * Critères de filtre des citoyens, tous combinés en ET. Un booléen absent ou une liste vide ne filtre pas.
 * Les identifiants de champ suivent les colonnes de la liste des citoyens : `daily_<clé>`, `heroic_<clé>`, `home_<clé>`,
 * `skill_<lettre>`, `camping_count`, `potions`, `immune`.
 */
export interface CitizenFilterCriteria {
    /** Citoyens retenus par leur identifiant. */
    readonly names: readonly number[];
    /** Métiers retenus (clés `JobEnum`). */
    readonly jobs: readonly string[];
    /** Champs à oui / non : valeur exigée. */
    readonly bools: Readonly<Record<string, boolean>>;
    /** Champs à niveau : valeurs acceptées. */
    readonly values: Readonly<Record<string, readonly number[]>>;
    /** Objets du sac : au moins un exigé. */
    readonly bag_ids: readonly number[];
    /** États : au moins un exigé (clés `StatusEnum`). */
    readonly status_keys: readonly string[];
}

/**
 * Critères vides : aucun citoyen écarté.
 * @returns {CitizenFilterCriteria} Critères neutres.
 */
export function emptyCitizenFilter(): CitizenFilterCriteria {
    return { names: [], jobs: [], bools: {}, values: {}, bag_ids: [], status_keys: [] };
}

/** Tri des champs par niveau maximum croissant : les booléens (max_lvl 1) d'abord, les champs à niveau ensuite. */
function byMaxLvlAsc(a: { value: { max_lvl: number } }, b: { value: { max_lvl: number } }): number {
    return a.value.max_lvl - b.value.max_lvl;
}

/** Actions héroïques, ordonnées (booléens puis niveaux). */
export const HEROIC_FIELDS: readonly HeroicActionEnum[] = [...HeroicActionEnum.getAllValues<HeroicActionEnum>()].sort(byMaxLvlAsc);

/**
 * Champs de la maison, le niveau d'habitation en tête : c'est lui qui conditionne tous les autres travaux.
 */
export const HOME_FIELDS: readonly HomeEnum[] = [
    HomeEnum.HOUSE_LEVEL,
    ...HomeEnum.getAllValues<HomeEnum>()
        .filter((home: HomeEnum): boolean => home.key !== HomeEnum.HOUSE_LEVEL.key)
        .sort(byMaxLvlAsc)
];

/**
 * Groupe de compétences désigné par un identifiant `skill_<lettre>`.
 * @param {string} id Identifiant de champ.
 * @returns {HeroSkillFamily | undefined} Groupe, absent pour un autre champ.
 */
export function heroSkillFamilyOf(id: string): HeroSkillFamily | undefined {
    return HERO_SKILL_FAMILIES.find((family: HeroSkillFamilyInfo): boolean => HERO_SKILL_ID_PREFIX + family.key === id)?.key;
}

/**
 * Action quotidienne faite un jour donné (seules les actions renseignées comptent).
 * @param {DailyAction[] | undefined} actions Actions du citoyen.
 * @param {number} day Jour.
 * @param {string} key Clé de l'action.
 * @returns {boolean} Vrai si l'action est faite ce jour-là.
 */
export function hasDailyActionOn(actions: DailyAction[] | undefined, day: number, key: string): boolean {
    return (actions ?? []).some((action: DailyAction): boolean => action.day === day && action.action_key === key && !!action.update_info);
}

/**
 * Valeur numérique d'un champ héroïque ou d'amélioration : booléen → 1/0, inconnu → -1.
 * @param {(HeroicActionsWithValue | HomeWithValue)[] | undefined} content Champs du citoyen.
 * @param {string} key Clé du champ.
 * @returns {number} Valeur.
 */
function fieldValue(content: (HeroicActionsWithValue | HomeWithValue)[] | undefined, key: string): number {
    const value: number | boolean | undefined = content?.find((item: HeroicActionsWithValue | HomeWithValue): boolean => item.element?.key === key)?.value;
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    return -1;
}

/**
 * Valeur oui / non d'un citoyen pour un champ ; nulle si inconnue ou si le champ n'est pas à oui / non.
 * @param {Citizen} citizen Citoyen.
 * @param {string} id Identifiant du champ.
 * @param {number} day Jour des actions quotidiennes.
 * @returns {boolean | null} Valeur.
 */
export function citizenBoolValue(citizen: Citizen, id: string, day: number): boolean | null {
    if (id.startsWith('daily_')) {
        return hasDailyActionOn(citizen.daily_actions, day, id.substring('daily_'.length));
    }
    if (id === 'immune') {
        return !!citizen.chamanic_detail?.is_immune_to_soul;
    }
    const value: number | boolean | undefined = id.startsWith('heroic_')
        ? citizen.heroic_actions?.content?.find((entry: HeroicActionsWithValue): boolean => entry.element?.key === id.substring('heroic_'.length))?.value
        : citizen.home?.content?.find((entry: HomeWithValue): boolean => entry.element?.key === id.substring('home_'.length))?.value;
    return typeof value === 'boolean' ? value : null;
}

/**
 * Valeur numérique d'un citoyen pour un champ à niveau ; -1 si inconnue.
 * @param {Citizen} citizen Citoyen.
 * @param {string} id Identifiant du champ.
 * @returns {number} Valeur.
 */
export function citizenNumericValue(citizen: Citizen, id: string): number {
    if (id === POTIONS_ID) {
        return citizen.chamanic_detail?.nb_potion_shaman ?? 0;
    }
    if (id === CAMPING_COUNT_ID) {
        return citizen.camping_count;
    }
    if (id === HOUSE_DEFENSE_ID) {
        return computeReconstructedHomeDefense(citizen);
    }
    const family: HeroSkillFamily | undefined = heroSkillFamilyOf(id);
    if (family !== undefined) {
        return citizen.hero_skills[family] ?? -1;
    }
    return id.startsWith('heroic_')
        ? fieldValue(citizen.heroic_actions?.content, id.substring('heroic_'.length))
        : fieldValue(citizen.home?.content, id.substring('home_'.length));
}

/**
 * Valeur de tri d'un citoyen pour un champ : nom et métier en texte (insensible à la casse), immunité avant potions,
 * action quotidienne faite (1/0), champs à niveau (inconnu = -1).
 * @param {Citizen} citizen Citoyen.
 * @param {string} id Identifiant du champ.
 * @param {number} day Jour des actions quotidiennes.
 * @returns {string | number} Valeur comparable.
 */
export function citizenSortValue(citizen: Citizen, id: string, day: number): string | number {
    if (id === 'avatar_name') {
        return (citizen.name ?? '').toLocaleLowerCase();
    }
    if (id === 'job') {
        return (citizen.job?.value?.label ?? '').toLocaleLowerCase();
    }
    if (id === 'immune') {
        return (citizen.chamanic_detail?.is_immune_to_soul ? 1 : 0) * IMMUNE_SORT_FACTOR + (citizen.chamanic_detail?.nb_potion_shaman ?? 0);
    }
    if (id.startsWith('daily_')) {
        return hasDailyActionOn(citizen.daily_actions, day, id.substring('daily_'.length)) ? 1 : 0;
    }
    if (id.startsWith('heroic_') || id.startsWith('home_') || id === CAMPING_COUNT_ID || id === HOUSE_DEFENSE_ID || heroSkillFamilyOf(id) !== undefined) {
        return citizenNumericValue(citizen, id);
    }
    return '';
}

/**
 * Le citoyen satisfait-il tous les critères ?
 * @param {Citizen} citizen Citoyen.
 * @param {CitizenFilterCriteria} criteria Critères.
 * @param {number} day Jour des actions quotidiennes.
 * @returns {boolean} Vrai s'il est retenu.
 */
export function matchesCitizenFilter(citizen: Citizen, criteria: CitizenFilterCriteria, day: number): boolean {
    if (criteria.names.length > 0 && !criteria.names.includes(citizen.id)) {
        return false;
    }
    if (criteria.jobs.length > 0 && !criteria.jobs.includes(citizen.job?.key ?? '')) {
        return false;
    }
    for (const [id, wanted] of Object.entries(criteria.bools)) {
        if (citizenBoolValue(citizen, id, day) !== wanted) {
            return false;
        }
    }
    for (const [id, wanted] of Object.entries(criteria.values)) {
        if (wanted.length > 0 && !wanted.includes(citizenNumericValue(citizen, id))) {
            return false;
        }
    }
    if (criteria.bag_ids.length > 0 && !(citizen.bag?.items ?? []).some((item: Item): boolean => criteria.bag_ids.includes(item.id))) {
        return false;
    }
    return !(criteria.status_keys.length > 0 && !(citizen.status?.icons ?? []).some((status: StatusEnum): boolean => criteria.status_keys.includes(status?.key)));
}

/**
 * Nombre de critères actifs (badge du bouton Filtres).
 * @param {CitizenFilterCriteria} criteria Critères.
 * @returns {number} Critères actifs.
 */
export function activeCitizenFilterCount(criteria: CitizenFilterCriteria): number {
    const lists: number = [criteria.names, criteria.jobs, criteria.bag_ids, criteria.status_keys]
        .filter((list: readonly (number | string)[]): boolean => list.length > 0).length;
    const values: number = Object.values(criteria.values).filter((list: readonly number[]): boolean => list.length > 0).length;
    return lists + Object.keys(criteria.bools).length + values;
}

/**
 * Champs filtrables par valeur : potions, campings, compétences, actions héroïques et améliorations à niveaux.
 * @returns {string[]} Identifiants de champ.
 */
export function citizenValueFieldIds(): string[] {
    return [
        POTIONS_ID,
        CAMPING_COUNT_ID,
        ...HERO_SKILL_FAMILIES.map((family: HeroSkillFamilyInfo): string => HERO_SKILL_ID_PREFIX + family.key),
        ...HEROIC_FIELDS.filter((action: HeroicActionEnum): boolean => action.value.max_lvl > 1).map((action: HeroicActionEnum): string => 'heroic_' + action.key),
        ...HOME_FIELDS.filter((home: HomeEnum): boolean => home.value.max_lvl > 1).map((home: HomeEnum): string => 'home_' + home.key)
    ];
}

/**
 * Valeurs réellement présentes chez les citoyens pour chaque champ à niveau (évite de proposer des valeurs que personne n'a).
 * @param {readonly Citizen[]} citizens Citoyens.
 * @returns {Record<string, number[]>} Valeurs triées par champ.
 */
export function citizenValueOptions(citizens: readonly Citizen[]): Record<string, number[]> {
    const options: Record<string, number[]> = {};
    for (const id of citizenValueFieldIds()) {
        const values: Set<number> = new Set<number>();
        citizens.forEach((citizen: Citizen): void => {
            const value: number = citizenNumericValue(citizen, id);
            if (value >= 0) {
                values.add(value);
            }
        });
        options[id] = Array.from(values).sort((a: number, b: number): number => a - b);
    }
    return options;
}

/**
 * Champs proposés au menu « Trier par ».
 * @param {readonly DailyActionEnum[]} daily_actions Actions quotidiennes affichables.
 * @param {Readonly<Record<HeroSkillFamily, string>>} hero_skill_names Nom de chaque groupe de compétences.
 * @returns {CitizenSortField[]} Champs triables.
 */
export function citizenSortFields(daily_actions: readonly DailyActionEnum[], hero_skill_names: Readonly<Record<HeroSkillFamily, string>>): CitizenSortField[] {
    return [
        { id: 'avatar_name', label: $localize`Nom` },
        { id: 'job', label: $localize`Métier` },
        { id: HOUSE_DEFENSE_ID, label: $localize`Défense de la maison` },
        { id: 'immune', label: $localize`Immunité` },
        ...daily_actions.map((action: DailyActionEnum): CitizenSortField => ({ id: 'daily_' + action.key, label: action.getLabel() })),
        ...HEROIC_FIELDS.map((action: HeroicActionEnum): CitizenSortField => ({ id: 'heroic_' + action.key, label: action.getLabel() })),
        ...HOME_FIELDS.map((home: HomeEnum): CitizenSortField => ({ id: 'home_' + home.key, label: home.getLabel() })),
        ...HERO_SKILL_FAMILIES.map((family: HeroSkillFamilyInfo): CitizenSortField => ({ id: HERO_SKILL_ID_PREFIX + family.key, label: hero_skill_names[family.key] })),
        { id: CAMPING_COUNT_ID, label: $localize`Campings` }
    ];
}

/**
 * Trie des éléments selon le citoyen qu'ils portent ; tri stable, l'ordre d'origine départage. Sans champ ou sans sens : copie inchangée.
 * @param {readonly T[]} elements Éléments à trier.
 * @param {(element: T) => Citizen} citizen_of Citoyen d'un élément.
 * @param {string} field Champ de tri.
 * @param {CitizenSortDirection} direction Sens.
 * @param {number} day Jour des actions quotidiennes.
 * @returns {T[]} Nouveau tableau trié.
 */
export function sortByCitizen<T>(elements: readonly T[], citizen_of: (element: T) => Citizen, field: string, direction: CitizenSortDirection, day: number): T[] {
    if (field === '' || direction === '') {
        return [...elements];
    }
    const factor: number = direction === 'asc' ? 1 : -1;
    return elements
        .map((element: T, index: number): { element: T; index: number; key: string | number } => ({ element, index, key: citizenSortValue(citizen_of(element), field, day) }))
        .sort((a: { index: number; key: string | number }, b: { index: number; key: string | number }): number => {
            const order: number = typeof a.key === 'number' && typeof b.key === 'number' ? a.key - b.key : String(a.key).localeCompare(String(b.key));
            return order === 0 ? a.index - b.index : order * factor;
        })
        .map((entry: { element: T }): T => entry.element);
}
