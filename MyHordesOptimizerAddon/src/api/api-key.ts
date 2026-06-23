import {gm_mh_external_app_id_key} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {fetcherWithoutBearer} from '../utils/fetch';
import {getI18N} from '../utils/i18n';
import {addError} from '../utils/notifications';
import {setStorageItem} from '../utils/storage';
import {convertResponsePromiseToError} from '../utils/version';

export function getApiKey() {
    return new Promise<any>((resolve, reject) => {
        if (!state.external_app_id || state.external_app_id === '') {

            fetcherWithoutBearer(location.origin + `/jx/soul/settings`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Request-Intent': 'WebNavigation',
                    'X-Render-Target': 'content'
                }
            })
                .then((response) => {
                    if (response.status === 200) {
                        return response.text();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    let manual = () => {
                        if (document.querySelector('.soul')) {
                            let manual_app_id_key = prompt(getI18N(texts.manually_add_app_id_key));
                            if (manual_app_id_key) {
                                state.external_app_id = manual_app_id_key;
                                setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
                                resolve(state.external_app_id);
                            } else {
                                reject(response);
                            }
                        }
                    }
                    let temp_body = document.createElement('body');

                    if (response) {
                        temp_body.innerHTML = response;
                        let id: any = temp_body.querySelector('#app_ext');
                        if (id && id !== '' && id !== 'not set' && id.value && id.value !== '' && id.value !== 'not set') {
                            state.external_app_id = id.value;
                            setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
                            resolve(state.external_app_id);
                        } else {
                            manual();
                        }
                    } else {
                        manual();
                    }
                })
                .catch((error) => {
                    reject(error);
                    addError(error);
                });
        } else {
            resolve(state.external_app_id);
        }
    });
}
