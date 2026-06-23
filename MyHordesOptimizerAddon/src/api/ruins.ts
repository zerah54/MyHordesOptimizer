import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {getI18N} from '../utils/i18n';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getRuins() {
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
                    })
                    resolve(state.ruins);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(state.ruins);
        }
    })
}

/** Récupère les informations de la ville */
