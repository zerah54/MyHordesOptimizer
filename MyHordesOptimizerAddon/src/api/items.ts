import {is_mh_beta} from '../config/constants';
import {action_types} from '../i18n/texts';
import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getItems() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + '/Fetcher/items' + (state.mh_user && state.mh_user.townDetails && state.mh_user.townDetails?.townId > 0 ? ('?townId=' + state.mh_user.townDetails?.townId) : ''))
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                let new_items = {...response}
                new_items = response
                    .sort((a, b) => a.category.ordering - b.category.ordering)
                    .filter((item) => is_mh_beta ? true : +item.id !== 302);
                new_items?.forEach((new_item) => {
                    new_item.recipes = new_item?.recipes?.map((recipe) => {
                        let new_recipe = {...recipe};
                        let new_recipe_components = [];
                        new_recipe.components.forEach((component) => {
                            for (let i = 0; i < component.count; i++) {
                                new_recipe_components.push(component.item);
                            }
                        })
                        new_recipe.components = new_recipe_components;
                        new_recipe.type = action_types.find((type) => type.id === new_recipe.type);
                        if (!new_recipe.type) {
                            console.warn('missing recipe type', recipe.type);
                        }
                        new_recipe.result = new_recipe.result.sort((a, b) => b.probability - a.probability);
                        return new_recipe;
                    })
                })
                state.items = new_items;
                resolve(state.items);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
