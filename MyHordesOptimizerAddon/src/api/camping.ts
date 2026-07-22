import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getI18N } from '../utils/i18n';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

export function calculateCamping(camping_parameters) {
    if (camping_parameters.campings < 0 || camping_parameters.campings === null || camping_parameters.campings === undefined || camping_parameters.campings === '') {
        camping_parameters.campings = 0;
    }
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/Camping/Calculate',
                {
                    method: 'POST',
                    body: JSON.stringify(camping_parameters),
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
            .then((camping_result) => {
                const result = document.querySelector('#camping-result');
                if (result) {
                    result.innerText = result ? `${getI18N(camping_result.label)} - ${camping_result.boundedProbability}% (${camping_result.boundedProbability}%)` : '';
                }
                resolve(camping_result);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
