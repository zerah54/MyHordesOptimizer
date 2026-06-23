import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getMyExpeditions() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + `/expeditions/me/${state.mh_user.townDetails?.day}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((expeditions) => {
                state.my_expeditions = expeditions;
                resolve(expeditions);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
