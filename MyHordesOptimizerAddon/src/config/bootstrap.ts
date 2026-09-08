import { state } from '../state';
import { getStorageItem } from '../utils/storage';
import { gm_mh_external_app_id_key, is_mh_beta, is_mh_local, mho_parameters_key, mho_token_key } from './constants';

// Runs once at script load: resolves environment URLs and restores
// persisted state (parameters, token, app id) from storage. `mh_user` (game
// data, not a credential) is deliberately excluded — see comment below.
// La promesse doit être attendue avant toute initialisation : de nombreuses
// fonctions déréférencent directement `state.mho_parameters`.
export async function bootstrap(): Promise<void> {

    if (is_mh_beta) {
        state.website = 'https://myhordes-optimizer-beta.web.app/';
        state.api_url = 'https://api.myhordesoptimizer.fr/beta';
    } else if (is_mh_local) {
        state.website = 'http://localhost:4200/';
        /**
         * Le profil de lancement de l'API expose 5001 en HTTPS et 5000 en HTTP
         * (`Properties/launchSettings.json`). On vise directement le port HTTPS :
         * `UseHttpsRedirection` renverrait sinon la requête de 5000 vers 5001, et une
         * redirection fait échouer la requête préliminaire CORS.
         */
        state.api_url = 'https://localhost:5001';
    } else {
        state.website = 'https://myhordes-optimizer.web.app/';
        state.api_url = 'https://api.myhordesoptimizer.fr';
    }

    // Valeur par défaut immédiate : le reste du script suppose l'objet toujours défini
    state.mho_parameters = {};

    const [params, app_id, saved_token] = await Promise.all([
        getStorageItem(mho_parameters_key),
        getStorageItem(gm_mh_external_app_id_key),
        getStorageItem(mho_token_key)
    ]);

    state.mho_parameters = params || {};
    /**
     * `mh_user` (identité + ville) est une donnée de jeu, pas un credential : elle n'est plus
     * persistée (cf. `api/token.ts`/`api/update.ts`) et reste `undefined` ici. Elle n'est
     * peuplée que par un `getToken()` frais, après résolution — jamais depuis le stockage.
     */
    state.external_app_id = app_id;
    state.token = saved_token;
}
