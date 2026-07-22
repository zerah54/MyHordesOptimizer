import { mh_user_key, mho_token_key } from '../config/constants';
import { state } from '../state';
import { fetcherWithoutBearer } from '../utils/fetch';
import { isValidToken } from '../utils/misc';
import { addError } from '../utils/notifications';
import { pageIsDesert } from '../utils/page';
import { setStorageItem } from '../utils/storage';
import { convertResponsePromiseToError } from '../utils/version';
import { getApiKey } from './api-key';
import { getItems } from './items';
import { getMap } from './map';
import { getRuins } from './ruins';
import { getWishlist } from './wishlist';

/**
 * Authentification en cours, partagée par tous les appelants.
 * Sans ce partage, chaque appel API dont le token paraît invalide (y compris via
 * `shouldRefreshMe()`, cf. `isValidToken()`) lance sa propre authentification, et chacune
 * recharge derrière elle objets, liste de courses, et sur le désert carte et ruines.
 */
let in_flight_token_promise: Promise<void> | undefined;
/** True si l'authentification en cours a été demandée en mode forcé */
let in_flight_is_forced: boolean = false;

/**
 * Récupère le token, en réutilisant l'authentification déjà en cours s'il y en a une.
 * @param {boolean} force   Ignore le token en cache et en redemande un nouveau
 * @param {boolean} stop    Interdit la seconde tentative après récupération de la clé d'app
 */
export function getToken(force?: boolean, stop?: boolean): Promise<void> {
    if (in_flight_token_promise) {
        /**
         * Un appel forcé exige des données fraîches : s'il survient derrière un appel non
         * forcé, qui a pu se contenter du token en cache, on l'enchaîne plutôt que de le
         * confondre avec lui. Dans tous les autres cas, l'appel en cours fait déjà le travail.
         */
        if (!force || in_flight_is_forced) return in_flight_token_promise;
        return in_flight_token_promise.then(() => getToken(true, stop));
    }

    in_flight_is_forced = !!force;
    in_flight_token_promise = requestToken(force, stop)
        .finally(() => {
            in_flight_token_promise = undefined;
            in_flight_is_forced = false;
        });

    return in_flight_token_promise;
}

/**
 * Termine l'authentification quoi qu'il arrive au chargement des données qui la suit.
 * L'authentification étant partagée par tous les appelants, une promesse qui ne se
 * résoudrait pas les bloquerait tous, définitivement. Les erreurs sont déjà signalées
 * à l'utilisateur par chacun des chargements concernés.
 */
function settleAfterTokenReceived(token_received: Promise<void>, resolve: () => void): void {
    token_received
        .catch((error: unknown) => console.error('MHO - chargement des données après authentification en échec', error))
        .then(() => resolve());
}

/**
 * Exécute réellement l'authentification. Appelée uniquement par `getToken` et par sa
 * propre relance interne : celle-ci doit court-circuiter le partage ci-dessus, sinon elle
 * attendrait l'authentification dont elle fait elle-même partie.
 */
function requestToken(force?: boolean, stop?: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (state.external_app_id) {
            const tokenReceived = async () => {
                console.log('MHO - I am...', state.mh_user);

                if ((state.mh_user as any) !== '' && state.mh_user !== undefined && state.mh_user !== null) {
                    if (state.mh_user.townDetails?.townId) {
                        const get_items_promise = getItems();
                        const get_wishlist_promise = getWishlist();
                        if (pageIsDesert()) {
                            const get_ruins_promise = getRuins();
                            const get_map_promise = getMap();
                            await Promise.all([get_items_promise, get_ruins_promise, get_wishlist_promise, get_map_promise]);
                        } else {
                            const get_wishlist_promise = getWishlist();
                            await Promise.all([get_items_promise, get_wishlist_promise]);
                        }
                    } else {
                        const get_items_promise = getItems();
                        await Promise.all([get_items_promise]);
                    }
                }
            };

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

                        settleAfterTokenReceived(tokenReceived(), resolve);
                    })
                    .catch((error) => {
                        if (error.status === 400 && !stop) {
                            /** Si on a une erreur 400 ça peut être parce que la clé d'app n'est pas bonne : on tente de récupérer la clé d'app une seule et unique fois pour essayer de rendre ça transparent pour l'utilisateur */
                            state.external_app_id = undefined;
                            getApiKey().then(() => {
                                requestToken(false, true).then(() => {
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
                settleAfterTokenReceived(tokenReceived(), resolve);
            }
        } else {
            resolve();
        }
    });
}

/** Récupère les informations de la ville */
