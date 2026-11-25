import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/** Requête en vol, partagée tant qu'elle n'est pas terminée (pas un cache). */
let in_flight_map_promise: Promise<any> | undefined;

/** Récupère la carte ; les appels simultanés partagent une seule requête. */
export function getMap(): Promise<any> {
    if (in_flight_map_promise) return in_flight_map_promise;
    in_flight_map_promise = requestMap().finally(() => {
        in_flight_map_promise = undefined;
    });
    return in_flight_map_promise;
}

/** Exécute la requête de carte. */
function requestMap(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/Fetcher/map?townId=' + state.mh_user.townDetails?.townId)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                state.map = response;
                resolve(state.map);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
