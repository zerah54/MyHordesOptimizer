import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getTranslation(string_to_translate, source_language) {
    return new Promise<any>((resolve, reject) => {
        if (string_to_translate && string_to_translate !== '') {
            let locale = 'locale=' + source_language;
            let sourceString = 'sourceString=' + string_to_translate;
            fetcher(state.api_url + '/Translation?' + locale + '&' + sourceString)
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
        }
    });
}

/** Récupère la liste complète des recettes */
