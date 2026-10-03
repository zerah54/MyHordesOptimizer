import { texts } from '../i18n/texts';
import { state } from '../state';
import type { I18nLabel } from '../types';
import { fetcher } from '../utils/fetch';
import { getI18N } from '../utils/i18n';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/**
 * Paramètres postés à `/Camping/Calculate` (`CampingParametersDto` côté API). Les écrans les lisent
 * dans le DOM : un nombre peut y arriver en texte, l'API le convertit.
 */
export interface CampingParameters {
    townType: string;
    job: string;
    distance: number | string;
    campings: number | string;
    proCamper: boolean;
    hiddenCampers: number;
    objects: number;
    vest: boolean;
    tomb: boolean;
    r4: boolean;
    zombies: number;
    night: boolean;
    devastated: boolean;
    phare: boolean;
    improve: number;
    objectImprove: number;
    ruinBonus: number;
    ruinBuryCount: number;
    ruinCapacity: number;
    /** Bâtiment choisi dans la liste : propre aux écrans, ignoré par l'API. */
    ruin?: string;
}

/** Réponse de `/Camping/Calculate` (le détail par facteur, `details`, n'est pas lu ici). */
export interface CampingOdds {
    /** Somme brute des facteurs, en %, sans plafond ni plancher. */
    probability: number;
    /** Chance réelle : bornée à 0 % et au plafond (90 %, 99 % avec R4, 100 % pour l'ermite). */
    boundedProbability: number;
    label: I18nLabel;
}

/**
 * Texte du résultat : libellé du jeu et chance réelle. Le brut suit entre parenthèses quand le
 * plafond ou le plancher l'a modifié ; la parenthèse répétait jusqu'ici la chance réelle.
 */
export function formatCampingResult(camping_result: CampingOdds): string {
    const result: string = `${getI18N(camping_result.label)} - ${camping_result.boundedProbability}%`;
    if (camping_result.probability === camping_result.boundedProbability) {
        return result;
    }
    return `${result} (${getI18N(texts.camping_raw_probability)} ${camping_result.probability}%)`;
}

export function calculateCamping(camping_parameters: CampingParameters): Promise<CampingOdds> {
    // Négatif, vide, absent ou non numérique : aucun camping déjà effectué.
    if (!(Number(camping_parameters.campings) > 0)) {
        camping_parameters.campings = 0;
    }
    return new Promise<CampingOdds>((resolve: (value: CampingOdds) => void, reject: (reason: unknown) => void): void => {
        fetcher(state.api_url + '/Camping/Calculate',
                {
                    method: 'POST',
                    body: JSON.stringify(camping_parameters),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            .then((response: Response): Promise<CampingOdds> => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((camping_result: CampingOdds): void => {
                const result: HTMLElement | null = document.querySelector('#camping-result');
                if (result) {
                    result.innerText = formatCampingResult(camping_result);
                }
                resolve(camping_result);
            })
            .catch((error: unknown): void => {
                addError(error);
                reject(error);
            });
    });
}
