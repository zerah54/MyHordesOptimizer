import { api_texts } from '../i18n/texts';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getI18N } from '../utils/i18n';
import { addError, addSuccess } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

export function getWishlist() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/wishlist?townId=' + state.mh_user.townDetails?.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                state.wishlist = { ...response };
                resolve(state.wishlist);
            })
            .catch((error) => {
                state.wishlist = undefined;
                addError(error);
                reject(error);
            });
    });
}

/**
 * Ajoute un élément à la wishlist
 * @param item l'élément à ajouter à la wishlist
 */

export function addItemToWishlist(item) {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/wishlist/add/' + item.id + '?userId=' + state.mh_user.id + '&townId=' + state.mh_user.townDetails?.townId, {
            method: 'POST'
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.text();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                item.wishListCount = 1;
                // Rafraîchit state.wishlist (source suivie par le rendu de l'onglet "items" et par les
                // infobulles) : sans cela, un ajout fait via un objet différent de celui déjà tracké
                // (ex. bouton de l'onglet banque vs onglet items) laisse ces consommateurs périmés.
                getWishlist();
                resolve(item);
                addSuccess(getI18N(api_texts.add_to_wishlist_success));
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/** Met à jour les outils externes (BBH, GH et Fata) en fonction des paramètres sélectionnés */
