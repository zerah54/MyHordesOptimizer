import {action_types} from '../i18n/texts';
import {state} from '../state';
import {fetcher} from '../utils/fetch';
import {addError} from '../utils/notifications';
import {convertResponsePromiseToError} from '../utils/version';

export function getRecipes() {
    return new Promise<any>((resolve, reject) => {
        if (!state.recipes) {
            fetcher(state.api_url + '/Fetcher/recipes')
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return convertResponsePromiseToError(response);
                    }
                })
                .then((response) => {
                    let new_recipes = response
                        .map((recipe) => {
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
                            return new_recipe;
                        })
                        .sort((a, b) => {
                            if (a.type?.ordering > b.type?.ordering) {
                                return 1;
                            } else if (a.type?.ordering === b.type?.ordering) {
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                    state.recipes = new_recipes;
                    resolve(state.recipes);
                })
                .catch((error) => {
                    addError(error);
                    reject(error);
                });
        } else {
            resolve(state.recipes);
        }
    });
}

/** Récupère la liste complète des paramètres en base */
