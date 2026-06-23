import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function saveBath(bath_taken) {
    if (bath_taken === undefined) return;

    return new Promise<void>((resolve, reject) => {
        fetcher(state.api_url + `/town/${state.mh_user.townDetails?.townId}/user/${state.mh_user.id}/bath?day=${state.mh_user.townDetails?.day}`,
            {
                method: bath_taken ? 'POST' : 'DELETE',
            })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
