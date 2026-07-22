import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

export function getCitizens() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + `/Fetcher/citizens?userId=${state.mh_user.id}&townId=${state.mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                state.citizens = response;
                (state.citizens as any).citizens = Object.keys((state.citizens as any).citizens).map((key) => (state.citizens as any).citizens[key]);
                resolve(state.citizens);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/** Récupère les informations de la banque */
