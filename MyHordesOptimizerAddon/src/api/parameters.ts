import {state} from '../state';
import {fetcherWithoutBearer} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError, isScriptVersionLastVersion} from '../utils/version';

export function getParameters() {
    return new Promise<void>((resolve, reject) => {
        fetcherWithoutBearer(state.api_url + '/parameters/parameters')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                state.parameters = response;
                isScriptVersionLastVersion();
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
