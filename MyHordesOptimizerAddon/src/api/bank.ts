import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

export function getBank() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/Fetcher/bank')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                let bank = [];
                response.bank.forEach((bank_item) => {
                    bank_item.item.broken = bank_item.isBroken;
                    bank_item.item.wishListCount = bank_item.wishListCount;
                    bank.push(bank_item.item);
                });
                bank = bank.sort((item_a, item_b) => {
                    if (item_a.category.ordering > item_b.category.ordering) {
                        return 1;
                    } else if (item_a.category.ordering === item_b.category.ordering) {
                        return 0;
                    } else {
                        return -1;
                    }
                });
                resolve(bank);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/** Récupère les informations de liste de course */
