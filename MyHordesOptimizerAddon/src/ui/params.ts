import {mho_parameters_key} from '../config/constants';
import {params_categories} from '../data/params';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {initOptionsWithLoginNeeded, initOptionsWithoutLoginNeeded} from '../utils/fetch';
import {getI18N} from '../utils/i18n';
import {isTouchScreen} from '../utils/misc';
import {getStorageItem, setStorageItem} from '../utils/storage';

export function createParams(content) {
    let categories_container = document.createElement('div');
    categories_container.style.maxHeight = '75vh';
    categories_container.style.overflow = 'auto';
    categories_container.id = 'categories';
    content.appendChild(categories_container);

    let params_title = document.createElement('h5');
    params_title.style.display = 'flex';
    params_title.style.justifyContent = 'space-between';
    categories_container.appendChild(params_title);

    let params_title_text = document.createElement('span');
    params_title_text.innerText = getI18N(texts.parameters_section_label);
    params_title.appendChild(params_title_text);

    let params_title_select_all = document.createElement('a');
    params_title_select_all.innerText = getI18N(texts.check_all);
    params_title_select_all.style.cursor = 'pointer';
    params_title.appendChild(params_title_select_all);

    params_title_select_all.addEventListener('click', () => {
        let unchecked = Array.from(categories_container.querySelectorAll('input.mho-param[type=checkbox]:not(:checked)'));
        unchecked.forEach((checkbox) => checkbox.click());
    });

    let categories_list = document.createElement('ul');
    categories_container.appendChild(categories_list);

    params_categories.forEach((category) => {
        let category_container = document.createElement('li');
        categories_list.appendChild(category_container);

        let category_title = document.createElement('h1');
        category_title.innerText = getI18N(category.label);
        category_container.appendChild(category_title);

        let category_content = document.createElement('ul');
        category_content.classList.add('parameters');
        category_container.appendChild(category_content);

        category.params.forEach((param) => {
            createParamItem(param, category_content, 0);
        });
    });
}


/**
 * Crée récursivement un élément de paramètre et ses enfants
 * @param {object} param        Le paramètre à afficher
 * @param {HTMLElement} parent  Le conteneur parent (ul)
 * @param {number} depth        La profondeur actuelle (0 = premier niveau)
 */

export function createParamItem(param, parent, depth) {
    const has_children = param.children && param.children.length > 0;
    const is_touch = isTouchScreen();

    let param_container = document.createElement('li');
    param_container.id = param.id;
    parent.appendChild(param_container);

    // Ligne principale : checkbox + label + help
    let param_row = document.createElement('div');
    param_row.style.display = 'flex';
    param_row.style.alignItems = 'center';
    param_row.style.justifyContent = 'space-between';
    param_container.appendChild(param_row);

    let param_input_div = document.createElement('div');
    param_input_div.style.display = 'flex';
    param_input_div.style.alignItems = 'center';
    param_input_div.style.flex = '1';
    param_row.appendChild(param_input_div);

    let param_input = document.createElement('input');
    param_input.type = 'checkbox';
    param_input.id = param.id + '_input';
    param_input.classList.add('mho-input', 'mho-param');
    param_input.checked = state.mho_parameters?.[param.id] ?? false;
    param_input_div.appendChild(param_input);

    let param_label = document.createElement('label');
    param_label.classList.add('small');
    // Sur mobile on ne lie pas le label à l'input (le clic label = toggle expand, pas check)
    param_label.htmlFor = (!is_touch && window.innerWidth > 1000) ? param.id + '_input' : '';
    param_label.innerText = getI18N(param.label);
    param_label.style.flex = '1';
    param_input_div.appendChild(param_label);

    // Flèche indicateur enfants (mobile uniquement)
    let arrow_indicator = null;
    if (has_children && is_touch) {
        arrow_indicator = document.createElement('span');
        arrow_indicator.classList.add('mho-param-arrow');
        arrow_indicator.style.marginLeft = '0.5em';
        arrow_indicator.style.transition = 'transform 0.2s';
        arrow_indicator.style.display = param_input.checked ? 'inline' : 'none';
        arrow_indicator.innerText = '▶';
        param_input_div.appendChild(arrow_indicator);
    }

    if (param.help) {
        param_row.appendChild(createHelpButton(getI18N(param.help)));
    }

    if (!has_children) {
        param_input.addEventListener('change', (event) => {
            updateParam(param.id, event.target.checked);
            initOptionsWithLoginNeeded();
            initOptionsWithoutLoginNeeded();
        });
        return;
    }

    // Conteneur enfants
    let children_container = document.createElement('ul');
    children_container.style.listStyle = 'none';
    children_container.style.display = 'none';
    param_container.appendChild(children_container);

    param.children.forEach((child) => {
        createParamItem(child, children_container, depth + 1);
    });

    // ── MOBILE ──────────────────────────────────────────────────────────────
    if (is_touch) {
        children_container.style.paddingLeft = '1em';
        children_container.style.paddingRight = '0';

        let is_expanded = false;

        const expand = () => {
            is_expanded = true;
            children_container.style.display = 'block';
            if (arrow_indicator) {
                arrow_indicator.style.transform = 'rotate(90deg)';
            }
        };

        const collapse = () => {
            is_expanded = false;
            children_container.style.display = 'none';
            if (arrow_indicator) {
                arrow_indicator.style.transform = 'rotate(0deg)';
            }
        };

        // Clic sur le label : toggle expand (seulement si coché)
        param_label.style.cursor = 'pointer';
        param_label.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!param_input.checked) {
                // Cocher l'input
                param_input.checked = true;
                updateParam(param.id, true);
                setParamChildrenChecked(param, true);
                syncChildInputs(param, true);
                if (arrow_indicator) arrow_indicator.style.display = 'inline';
                // Ne pas expand ici, juste cocher
                initOptionsWithLoginNeeded();
                initOptionsWithoutLoginNeeded();
            } else {
                // Toggle expand/collapse
                if (is_expanded) {
                    collapse();
                } else {
                    expand();
                }
            }
        });

        // Changement direct de l'input (clic sur la checkbox elle-même)
        param_input.addEventListener('change', (event) => {
            const checked = event.target.checked;
            updateParam(param.id, checked);
            setParamChildrenChecked(param, checked);
            syncChildInputs(param, checked);

            if (!checked) {
                collapse();
                if (arrow_indicator) arrow_indicator.style.display = 'none';
            } else {
                if (arrow_indicator) arrow_indicator.style.display = 'inline';
            }

            initOptionsWithLoginNeeded();
            initOptionsWithoutLoginNeeded();
        });

        // ── DESKTOP ─────────────────────────────────────────────────────────────
    } else {
        children_container.style.zIndex = String(10 + depth);
        children_container.style.width = '300px';
        children_container.style.padding = '0.25em';
        children_container.style.backgroundColor = '#5c2b20';
        children_container.style.border = '1px solid #f0d79e';
        children_container.style.outline = '1px solid #000';

        if (param_input.checked) {
            param_container.classList.add('param-has-children');
        }

        const showTooltip = () => {
            positionTooltip();
            children_container.style.display = 'block';
        };

        const hideTooltip = () => {
            children_container.style.display = 'none';
        };

        const positionTooltip = () => {
            const rect = param_container.getBoundingClientRect();
            const children_width = 300;
            const space_right = window.innerWidth - rect.right;

            children_container.style.position = 'fixed';

            if (space_right >= children_width) {
                // Assez de place à droite → tooltip flottant
                children_container.style.position = 'fixed';
                children_container.style.left = rect.right + 'px';
                children_container.style.top = rect.top - 5 + 'px';
                children_container.style.paddingLeft = '0.25em';
                children_container.style.width = '300px';
            } else {
                // Pas assez de place → comportement mobile inline
                children_container.style.position = 'relative';
                children_container.style.left = '';
                children_container.style.top = '';
                children_container.style.paddingLeft = '1em';
                children_container.style.width = '100%';
            }
        };

        let mousein = false;

        const onMouseEnter = () => {
            mousein = true;
            if (param_input.checked) {
                showTooltip();
            }
        };

        const onMouseLeave = () => {
            mousein = false;
            setTimeout(() => {
                if (!mousein) hideTooltip();
            }, 250); // délai augmenté
        };

        param_container.addEventListener('mouseenter', onMouseEnter);
        param_container.addEventListener('mouseleave', onMouseLeave);
        children_container.addEventListener('mouseenter', onMouseEnter);
        children_container.addEventListener('mouseleave', onMouseLeave);

        param_input.addEventListener('change', (event) => {
            const checked = event.target.checked;
            updateParam(param.id, checked);
            setParamChildrenChecked(param, checked);
            syncChildInputs(param, checked);

            if (checked) {
                param_container.classList.add('param-has-children');
            } else {
                param_container.classList.remove('param-has-children');
                hideTooltip();
            }

            initOptionsWithLoginNeeded();
            initOptionsWithoutLoginNeeded();
        });
    }
}

/** Synchronise visuellement les checkboxes enfants dans le DOM */

export function syncChildInputs(param, checked) {
    if (!param.children) return;
    param.children.forEach((child) => {
        const input = document.querySelector(`#${child.id}_input`);
        if (input) input.checked = checked;
        syncChildInputs(child, checked);
    });
}

/**
 * Met à jour un paramètre en storage
 * @param {string} id
 * @param {boolean} value
 */

export function updateParam(id, value) {
    if (!state.mho_parameters) state.mho_parameters = {};
    state.mho_parameters[id] = value;
    setStorageItem(mho_parameters_key, state.mho_parameters);
    getStorageItem(mho_parameters_key).then((saved) => {
        state.mho_parameters = saved;
    });
}

/**
 * Coche/décoche récursivement tous les descendants d'un paramètre
 * @param {object} param
 * @param {boolean} checked
 */

export function setParamChildrenChecked(param, checked) {
    if (!param.children) return;
    param.children.forEach((child) => {
        updateParam(child.id, checked);
        let child_input = document.querySelector(`#${child.id}_input`);
        if (child_input) child_input.checked = checked;
        setParamChildrenChecked(child, checked);
    });
}


export function createHelpButton(text_to_display) {

    let help_button = document.createElement('a');
    help_button.innerText = getI18N(texts.external_app_id_help_label);
    help_button.classList.add('help-button');

    let help_tooltip = document.createElement('div')
    help_tooltip.classList.add('tooltip', 'help', 'hidden', 'mho');
    help_tooltip.setAttribute('style', `text-transform: initial; display: block; position: absolute; width: 250px;`);
    help_tooltip.innerHTML = text_to_display;
    help_button.appendChild(help_tooltip);

    help_button.addEventListener('mouseenter', function () {
        help_tooltip.style.top = (help_button.getBoundingClientRect().top) as any;
        help_tooltip.style.right = (help_button.getBoundingClientRect().right) as any;
        help_tooltip.classList.remove('hidden');
    })
    help_button.addEventListener('mouseleave', function () {
        help_tooltip.classList.add('hidden');
    })

    return help_button
}

/** Enregistre les paramètres de l'extension */

export function saveParameters() {
    let parameters = document.getElementsByClassName('parameter');
}

/** Affiche le bouton de mise à jour des outils externes */
