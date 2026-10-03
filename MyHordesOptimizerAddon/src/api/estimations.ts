import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/** Plage affinée partagée d'un jour d'attaque. */
export interface RefinedAttack {
    min: number;
    max: number;
}

/** Vue d'affinage renvoyée par l'API (jamais de seed). */
interface RefinementView {
    status: 'None' | 'Valid' | 'Invalid';
    attackMin: number | null;
    attackMax: number | null;
}

/**
 * Plage affinée partagée de l'attaque du jour `day`, ou null si aucun affinage valide (information
 * facultative : un échec reste silencieux).
 * @param day Jour attaqué.
 */
export function getRefinedAttack(day: number): Promise<RefinedAttack | null> {
    return fetcher(`${state.api_url}/AttaqueEstimation/Refinement/${day}?townId=${state.mh_user.townDetails?.townId}`)
        .then((response: Response): Promise<RefinementView | null> => response.status === 200 ? response.json() : Promise.resolve(null))
        .then((view: RefinementView | null): RefinedAttack | null =>
            view !== null && view.status === 'Valid' && view.attackMin !== null && view.attackMax !== null ? { min: view.attackMin, max: view.attackMax } : null)
        .catch((): null => null);
}

export function getEstimations() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + `/AttaqueEstimation/Estimations/${state.mh_user.townDetails?.day}?townId=${state.mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                const estimations = {
                    estimations: response,
                    today_attack: undefined,
                    tomorrow_attack: undefined
                };
                getAttackCalculation(state.mh_user.townDetails?.day, false).then((today_result) => {
                    estimations.today_attack = today_result;
                    getAttackCalculation(state.mh_user.townDetails?.day + 1, false).then((tomorrow_result) => {
                        estimations.tomorrow_attack = tomorrow_result;
                        resolve(estimations);
                    });
                });
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}


export function getAttackCalculation(day, beta) {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + `/attaqueEstimation/attackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${state.mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}


export function saveEstimations(estim_value, planif_value) {
    return new Promise<any>((resolve, reject) => {
        getEstimations().then((estimations) => {
            const new_estimations = { ...estimations.estimations };
            if (estim_value && estim_value.value && (estim_value.value.min || estim_value.value.max)) {
                /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                const new_estimations_workaround_estim = { ...new_estimations.estim };
                new_estimations_workaround_estim['_' + estim_value.percent] = { ...estim_value.value };
                new_estimations.estim = { ...new_estimations_workaround_estim };
            }
            if (planif_value && planif_value.value && (planif_value.value.min || planif_value.value.max)) {
                /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                const new_estimations_workaround_planif = { ...new_estimations.planif };
                new_estimations_workaround_planif['_' + planif_value.percent] = { ...planif_value.value };
                new_estimations.planif = { ...new_estimations_workaround_planif };
            }

            fetcher(state.api_url + `/AttaqueEstimation/Estimations?townId=${state.mh_user.townDetails?.townId}`, {
                method: 'POST',
                body: JSON.stringify(new_estimations),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, { wait_for_token: true })
                .then((response) => {
                    if (response.status === 200) {
                        return response.text();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        });
    });
}
