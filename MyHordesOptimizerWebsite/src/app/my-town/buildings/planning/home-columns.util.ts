import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { HomeLevelRef } from './plan-evaluation.util';

/** Colonnes de la maison des tableaux de citoyens : habitation, puis améliorations masquées sur petit écran. */
export const HOME_COLUMNS: readonly HomeEnum[] = [
    HomeEnum.HOUSE_LEVEL, HomeEnum.KITCHEN_LEVEL, HomeEnum.LAB_LEVEL, HomeEnum.REST_LEVEL, HomeEnum.HOUSE_DEFENSE, HomeEnum.HAS_FENCE
];

/**
 * Élément de maison d'un citoyen.
 * @param {Citizen} citizen Citoyen.
 * @param {HomeEnum} home Élément.
 * @returns {HomeWithValue | undefined} Valeur, absente sans données de maison.
 */
export function homeOf(citizen: Citizen, home: HomeEnum): HomeWithValue | undefined {
    return citizen.home?.content?.find((entry: HomeWithValue): boolean => entry.element.key === home.key);
}

/**
 * Élément de maison à afficher : habitation de niveau connu (négatif = non défini), amélioration de niveau 1 ou plus.
 * @param {HomeWithValue | undefined} entry Valeur de l'élément.
 * @returns {boolean} Vrai s'il est à afficher.
 */
export function homeDone(entry: HomeWithValue | undefined): boolean {
    if (entry === undefined) {
        return false;
    }
    if (entry.element.key === HomeEnum.HOUSE_LEVEL.key) {
        return typeof entry.value === 'number' && entry.value >= 0;
    }
    return entry.value === true || (typeof entry.value === 'number' && entry.value > 0);
}

/**
 * Icône d'en-tête d'une colonne de maison (habitation : niveau 0).
 * @param {HomeEnum} home Élément.
 * @returns {string} Chemin de l'image.
 */
export function homeHeaderIcon(home: HomeEnum): string {
    return home.value.img !== '' ? home.value.img : 'home/home_lv0.gif';
}

/**
 * Détail de la maison sur une ligne : nom de l'habitation puis améliorations faites avec leur niveau.
 * @param {Citizen} citizen Citoyen.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Niveaux d'habitation du référentiel.
 * @returns {string} Détail, vide sans données de maison.
 */
export function homeSummary(citizen: Citizen, homes: ReadonlyMap<number, HomeLevelRef>): string {
    const parts: string[] = [];
    const house: HomeWithValue | undefined = homeOf(citizen, HomeEnum.HOUSE_LEVEL);
    const house_label: string | undefined = typeof house?.value === 'number' ? homes.get(house.value)?.label : undefined;
    if (house_label !== undefined) {
        parts.push(house_label);
    }
    for (const home of HOME_COLUMNS.slice(1)) {
        const entry: HomeWithValue | undefined = homeOf(citizen, home);
        if (homeDone(entry)) {
            parts.push(entry?.value === true ? home.getLabel() : `${home.getLabel()} ${entry?.value}`);
        }
    }
    return parts.join(' · ');
}
