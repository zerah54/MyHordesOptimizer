import {getApiKey} from './api-key';
import {getItems} from './items';
import {getMap} from './map';
import {getRuins} from './ruins';
import {getWishlist} from './wishlist';
import {mh_user_key, mho_token_key} from '../config/constants';
import {state} from '../state';
import {fetcherWithoutBearer} from '../utils/fetch';
import {isValidToken} from '../utils/misc';
import {addError} from '../utils/notifications';
import {pageIsDesert} from '../utils/page';
import {setStorageItem} from '../utils/storage';
import {convertResponsePromiseToError} from '../utils/version';

export function getToken(force?: boolean, stop?: boolean) {
    return new Promise<void>((resolve, reject) => {
        if (state.external_app_id) {
            let tokenReceived = async () => {
                console.log('MHO - I am...', state.mh_user);

                if ((state.mh_user as any) !== '' && state.mh_user !== undefined && state.mh_user !== null) {
                    if (state.mh_user.townDetails?.townId) {
                        let get_items_promise = getItems();
                        let get_wishlist_promise = getWishlist();
                        if (pageIsDesert()) {
                            let get_ruins_promise = getRuins();
                            let get_map_promise = getMap();
                            await Promise.all([get_items_promise, get_ruins_promise, get_wishlist_promise, get_map_promise]);
                        } else {
                            let get_wishlist_promise = getWishlist()
                            await Promise.all([get_items_promise, get_wishlist_promise]);
                        }
                    } else {
                        let get_items_promise = getItems();
                        await Promise.all([get_items_promise]);
                    }
                }
            }

            if (!isValidToken() || force) {
                fetcherWithoutBearer(state.api_url + '/Authentication/Token?userKey=' + state.external_app_id)
                    .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            return convertResponsePromiseToError(response);
                        }
                    })
                    .then((response) => {
                        state.token = response;
                        state.mh_user = state.token.simpleMe;
                        if (!state.mh_user || state.mh_user.id === 0 && state.mh_user.townDetails?.townId === 0) {
                            (state.mh_user as any) = '';
                        }
                        setStorageItem(mh_user_key, state.mh_user);
                        setStorageItem(mho_token_key, state.token);

                        tokenReceived().then(() => resolve());
                    })
                    .catch((error) => {
                        if (error.status === 400 && !stop) {
                            /** Si on a une erreur 400 ça peut être parce que la clé d'app n'est pas bonne : on tente de récupérer la clé d'app une seule et unique fois pour essayer de rendre ça transparent pour l'utilisateur */
                            state.external_app_id = undefined;
                            getApiKey().then(() => {
                                getToken(false, true).then(() => {
                                    resolve();
                                });
                            });
                        } else {
                            addError(error);
                            resolve();
                        }
                    });
            } else {
                state.mh_user = state.token.simpleMe;
                tokenReceived().then(() => resolve());
            }
        } else {
            resolve();
        }
    });
}

/** Récupère les informations de la ville */
