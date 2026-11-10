import { state } from '../state';
import type { ApiExpedition } from '../types';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/** Ville et jour d'un chargement de `my_expeditions` ; `undefined` sans ville connue. */
export function myExpeditionsKey(): string | undefined {
    const town_id: number | undefined = state.mh_user?.townDetails?.townId;
    const day: number | undefined = state.mh_user?.townDetails?.day;
    return town_id && day ? `${town_id}:${day}` : undefined;
}

/** Expéditions du jour auxquelles je suis inscrit (toutes leurs parties), avec tracés liés et consignes par case ; met à jour `state.my_expeditions`, sans notification d'erreur (à l'appelant). */
export async function loadMyExpeditions(): Promise<ApiExpedition[]> {
    const key: string | undefined = myExpeditionsKey();
    if (!key) return [];

    /** Route réservée aux citoyens connectés : le jeton est attendu s'il est en cours de renouvellement */
    const response: Response = await fetcher(`${state.api_url}/expeditions/me/${state.mh_user.townDetails.day}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }, { wait_for_token: true });
    if (response.status !== 200) {
        return convertResponsePromiseToError(response);
    }
    const body: unknown = await response.json();
    const expeditions: ApiExpedition[] = Array.isArray(body) ? body as ApiExpedition[] : [];

    /** La ville ou le jour ont pu changer pendant l'appel : la réponse ne vaut que pour ceux de la demande */
    if (myExpeditionsKey() === key) {
        state.my_expeditions = expeditions;
        state.my_expeditions_key = key;
        state.my_expeditions_loaded_at = Date.now();
    }
    return expeditions;
}

/** Comme `loadMyExpeditions`, avec notification d'erreur (ouverture de la fenêtre des expéditions). */
export function getMyExpeditions(): Promise<ApiExpedition[]> {
    return loadMyExpeditions().catch((error: unknown): Promise<never> => {
        addError(error);
        return Promise.reject(error);
    });
}
