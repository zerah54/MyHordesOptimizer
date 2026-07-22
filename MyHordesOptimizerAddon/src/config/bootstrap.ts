import { state } from '../state';
import { getStorageItem } from '../utils/storage';
import { gm_mh_external_app_id_key, is_mh_beta, is_mh_local, mh_user_key, mho_parameters_key, mho_token_key } from './constants';

// Runs once at script load: resolves environment URLs and restores
// persisted state (parameters, cached user/token) from storage.
// La promesse doit être attendue avant toute initialisation : de nombreuses
// fonctions déréférencent directement `state.mho_parameters`.
export async function bootstrap(): Promise<void> {

    if (is_mh_beta) {
        state.website = 'https://myhordes-optimizer-beta.web.app/';
        state.api_url = 'https://api.myhordesoptimizer.fr/beta';
    } else if (is_mh_local) {
        state.website = 'http://localhost:4200/';
        state.api_url = 'http://localhost:5001';
    } else {
        state.website = 'https://myhordes-optimizer.web.app/';
        state.api_url = 'https://api.myhordesoptimizer.fr';
    }

    // Valeur par défaut immédiate : le reste du script suppose l'objet toujours défini
    state.mho_parameters = {};

    const [params, user, app_id, saved_token] = await Promise.all([
        getStorageItem(mho_parameters_key),
        getStorageItem(mh_user_key),
        getStorageItem(gm_mh_external_app_id_key),
        getStorageItem(mho_token_key)
    ]);

    state.mho_parameters = params || {};
    state.mh_user = user;
    state.external_app_id = app_id;
    state.token = saved_token;
}
