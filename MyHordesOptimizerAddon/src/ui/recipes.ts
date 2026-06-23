import {getRecipes} from '../api/recipes';
import {mh_optimizer_window_id, repo_img_hordes_url} from '../config/constants';
import {getI18N} from '../utils/i18n';
import {fixMhCompiledImg} from '../utils/misc';

export function displayRecipes() {
    getRecipes().then((recipes) => {
        if (recipes) {
            let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

            let recipes_list = document.createElement('ul');
            recipes_list.id = 'recipes-list';

            tab_content.appendChild(recipes_list);

            recipes.forEach((recipe, index) => {
                if (index === 0 || recipes[index - 1].type.id !== recipe.type.id) {
                    let category_text = document.createElement('span');
                    category_text.innerText = getI18N(recipe.type.label);

                    let category_container = document.createElement('div');
                    category_container.classList.add('mho-category');
                    category_container.classList.add('mho-header');
                    category_container.appendChild(category_text);

                    recipes_list.appendChild(category_container);
                }

                recipes_list.appendChild(getRecipeElement(recipe));
            });

        }
    });
}

/** Affiche une recette */

export function getRecipeElement(recipe) {
    let recipe_container = document.createElement('tr');
    recipe_container.classList.add('recipe');

    let recipe_type_container = document.createElement('td');
    recipe_container.appendChild(recipe_type_container);

    let recipe_type_img = document.createElement('img');
    recipe_type_img.title = getI18N(recipe.type.label);
    recipe_type_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
    switch (recipe.type.id ?? recipe.type) {
        case 'Recipe::ManualAnywhere':
            recipe_type_img.src = repo_img_hordes_url + 'log/citizen.gif';
            break;
        case 'Recipe::WorkshopTypeTechSpecific':
            recipe_type_img.src = repo_img_hordes_url + 'building/small_techtable.gif';
            break;
        case 'Recipe::WorkshopType':
        case 'Recipe::WorkshopTypeShamanSpecific':
            recipe_type_img.src = repo_img_hordes_url + 'log/workshop.gif';
            break;
        default:
            recipe_type_img.src = repo_img_hordes_url + 'icons/small_move.gif';
            break;
    }
    recipe_type_container.appendChild(recipe_type_img);

    let compos_cell = document.createElement('td');
    compos_cell.classList.add('items', 'components');

    let compos_container = document.createElement('div');
    recipe.components.forEach((compo) => {
        let compo_container = document.createElement('span');
        compo_container.classList.add('item');
        if (compo.id === recipe.provoking?.id) {
            compo_container.classList.add('mho-recipe-provoking');
        }

        let component_img = document.createElement('img');
        component_img.src = repo_img_hordes_url + fixMhCompiledImg(compo?.item?.img ?? compo?.img);
        component_img.title = getI18N(compo?.item?.label ?? compo?.label);
        compo_container.appendChild(component_img);

        compos_container.appendChild(compo_container);
    })
    compos_cell.appendChild(compos_container);
    recipe_container.appendChild(compos_cell);

    let transform_img_container = document.createElement('td');
    recipe_container.appendChild(transform_img_container);

    let transform_img = document.createElement('img');
    transform_img.alt = '=>';
    transform_img.src = repo_img_hordes_url + 'icons/small_move.gif';
    transform_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
    transform_img_container.appendChild(transform_img);

    let results_cell = document.createElement('td');
    results_cell.classList.add('items', 'results');

    let results_container = document.createElement('div');
    recipe.result.forEach((result) => {
        let result_container = document.createElement('span');
        result_container.classList.add('item');

        let result_img = document.createElement('img');
        result_img.src = repo_img_hordes_url + fixMhCompiledImg(result.item?.img);
        result_img.title = getI18N(result.item.label);
        result_container.appendChild(result_img);

        if (result.probability !== 1) {
            let result_proba = document.createElement('span');
            result_proba.setAttribute('style', 'font-style: italic; color: #ddab76;');
            result_proba.classList.add('label_text');
            result_proba.innerText = Math.round(result.probability * 100) + '%';
            result_container.appendChild(result_proba);
        }

        results_container.appendChild(result_container);
    })
    results_cell.appendChild(results_container);
    recipe_container.appendChild(results_cell);
    return recipe_container;
}

/**
 * Crée un bouton d'aide
 * @param {string} text_to_display    Le contenu de la popup d'aide
 */
