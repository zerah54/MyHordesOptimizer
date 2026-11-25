import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getI18N } from '../utils/i18n';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/** Requête en vol, partagée tant qu'elle n'est pas terminée (le cache reste `state.ruins`). */
let in_flight_ruins_promise: Promise<any> | undefined;

/** Récupère les ruines ; les appels simultanés partagent une seule requête. */
export function getRuins(): Promise<any> {
    if (in_flight_ruins_promise) return in_flight_ruins_promise;
    if (state.ruins) return Promise.resolve(state.ruins);
    in_flight_ruins_promise = requestRuins().finally(() => {
        in_flight_ruins_promise = undefined;
    });
    return in_flight_ruins_promise;
}

/** Exécute la requête de ruines, ou renvoie le cache. */
function requestRuins(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        if (!state.ruins) {
            fetcher(state.api_url + '/Fetcher/ruins?userKey=' + state.external_app_id)
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    state.ruins = response.sort((a, b) => {
                        if (getI18N(a.label) < getI18N(b.label)) {
                            return -1;
                        }
                        if (getI18N(a.label) > getI18N(b.label)) {
                            return 1;
                        }
                        return 0;
                    });

                    state.ruins.forEach((ruin) => {
                        ruin.drops.sort((drop_a, drop_b) => {
                            if (drop_a.probability < drop_b.probability) {
                                return 1;
                            } else if (drop_b.probability < drop_a.probability) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });
                    });
                    resolve(state.ruins);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(state.ruins);
        }
    });
}

/** Récupère les informations de la ville */
