import {
    gm_mh_external_app_id_key,
    is_mh_beta,
    is_mh_local,
    mh_user_key,
    mho_parameters_key,
    mho_token_key
} from './constants';
import {state} from '../state';
import {getStorageItem} from '../utils/storage';

// Runs once at script load: resolves environment URLs and restores
// persisted state (parameters, cached user/token) from storage.
export function bootstrap() {

    if (is_mh_beta) {
        state.website = `https://myhordes-optimizer-beta.web.app/`;
        state.api_url = `https://api.myhordesoptimizer.fr/beta`;
    } else if (is_mh_local) {
        state.website = `http://localhost:4200/`;
        state.api_url = `http://localhost:5001`;
    } else {
        state.website = `https://myhordes-optimizer.web.app/`
        state.api_url = `https://api.myhordesoptimizer.fr`;
    }

    getStorageItem(mho_parameters_key).then((params) => {
        state.mho_parameters = params || {};
    });
    getStorageItem(mh_user_key).then((user) => {
        state.mh_user = user;
    });
    getStorageItem(gm_mh_external_app_id_key).then((app_id) => {
        state.external_app_id = app_id;
    });
    getStorageItem(mho_token_key).then((saved_token) => {
        state.token = saved_token;
    });
}
