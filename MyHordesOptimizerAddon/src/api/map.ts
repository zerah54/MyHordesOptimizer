import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getMap() {
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
