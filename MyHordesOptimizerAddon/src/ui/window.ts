import {mh_optimizer_map_window_id, mh_optimizer_window_id, repo_img_hordes_url} from '../config/constants';
import {tabs_list} from '../data/tabs';
import {state} from '../state';
import {displayBank, displayItems} from './bank';
import {displayCamping} from './camping';
import {displayRecipes} from './recipes';
import {displayRuins} from './ruins';
import {getI18N} from '../utils/i18n';

export function createWindow(id, full_size) {
    let window = document.querySelector(`#${id}`);
    if (window) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    window = document.createElement('div');
    window.id = id;
    window.classList.add('mho-window');
    if (full_size) {
        window.classList.add('fullsize');
    }

    let window_box = document.createElement('div');
    window_box.id = id + '-box';
    window_box.classList.add('mho-window-box');
    window.appendChild(window_box);

    let window_drag_handler = document.createElement('div');
    window_drag_handler.id = id + '-drag-handle';
    if (!full_size) {
        window_drag_handler.style.cursor = 'move';
    }
    window_drag_handler.classList.add('mho-window-drag-handle');
    window_box.appendChild(window_drag_handler);

    let window_content = document.createElement('div');
    window_content.id = id + '-content';
    window_content.classList.add('mho-window-content');
    window_box.appendChild(window_content);

    let window_overlay = document.createElement('div');
    window_overlay.id = id + '-overlay';
    window_overlay.classList.add('mho-window-overlay');
    window_box.appendChild(window_overlay);

    let window_overlay_ul = document.createElement('ul');
    window_overlay.appendChild(window_overlay_ul);

    let window_overlay_li = document.createElement('li');
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
    window_overlay_li.appendChild(window_overlay_img);

    window_overlay_img.addEventListener('click', () => {
        window.classList.remove('visible');
        let body = document.getElementsByTagName('body')[0];
        (body as any).removeAttribute('style', 'overflow: hidden');
    });

    let post_office = document.getElementById('post-office');
    if (post_office) {
        post_office.parentNode.insertBefore(window, post_office.nextSibling);
    }

    if (!full_size) {
        window_drag_handler.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            // call a function whenever the cursor moves:
            document.onmousemove = (e) => {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                window.style.top = (window.offsetTop - pos2) + "px";
                window.style.left = (window.offsetLeft - pos1) + "px";
            };
        }
    }

}

/** Crée la fenêtre de wiki */

export function createWikiToolsWindow() {
    createWindow(mh_optimizer_window_id, true);
}

/**
 * Crée la liste des onglets de la page de wiki
 * @param {string} window_type
 */

export function createWikiToolsTabs(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');
    window_content.innerHTML = '';

    let tabs_div = document.createElement('div');
    tabs_div.id = 'tabs';

    window_content.appendChild(tabs_div);
    let tabs_ul = document.createElement('ul');

    let current_tabs_list = tabs_list[window_type]
        .filter((tab) => state.mh_user.townDetails?.townId || !tab.needs_town)
        .sort((a, b) => {
            if (a.ordering > b.ordering) {
                return 1;
            } else if (a.ordering === b.ordering) {
                return 0;
            } else {
                return -1;
            }
        });
    current_tabs_list.forEach((tab, index) => {
        let tab_link = document.createElement('div');

        if (tab.icon) {
            let tab_icon = document.createElement('img');
            tab_icon.src = tab.icon;
            tab_link.appendChild(tab_icon);
        }

        let tab_text = document.createTextNode(getI18N(tab.label));
        tab_link.appendChild(tab_text);

        let tab_li = document.createElement('li');
        tab_li.appendChild(tab_link);

        if (index === 0) {
            tab_li.classList.add('selected');
            dispatchWikiToolsContent(window_type, tab);
        }

        const tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
        tab_li.addEventListener('click', () => {
            if (!tab_li.classList.contains('selected') && tab_content !== undefined && tab_content !== null) {
                for (let li of tabs_ul.children) {
                    li.classList.remove('selected');
                }
                tab_li.classList.add('selected');
            }
            dispatchWikiToolsContent(window_type, tab);
        })

        tabs_ul.appendChild(tab_li);
    })
    tabs_div.appendChild(tabs_ul);

}

/** Crée la fenêtre de wiki */

export function createMapWindow() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    let window_content = document.createElement('div');
    window_content.id = mh_optimizer_map_window_id + '-content';
    window_content.setAttribute('style', 'height: calc(100% - 26px); position: initial; margin-top: 26px;');

    let window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
    let window_overlay_li = document.createElement('li');
    window_overlay_li.appendChild(window_overlay_img);
    let window_overlay_ul = document.createElement('ul');
    window_overlay_ul.style.margin = '-2px -2px 0 0';
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_map_window_id + '-overlay';
    window_overlay.setAttribute('style', 'cursor: move; width: 100%;');

    let window_box = document.createElement('div');
    window_box.id = mh_optimizer_map_window_id + '-box';
    window_box.draggable = true;

    let window = document.createElement('div');
    window.style.minWidth = '150px;'
    window.style.minHeight = '150px;'
    window.id = mh_optimizer_map_window_id;

    window_overlay.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        // call a function whenever the cursor moves:
        document.onmousemove = (e) => {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            window_box.style.top = (window_box.offsetTop - pos2) + "px";
            window_box.style.left = (window_box.offsetLeft - pos1) + "px";
        };
    }
    window_overlay.appendChild(window_overlay_ul);

    window_box.appendChild(window_content);
    window_box.appendChild(window_overlay);

    window.appendChild(window_box);

    let post_office = document.getElementById('post-office');
    if (post_office) {
        post_office.parentNode.insertBefore(window, post_office.nextSibling);
    }
    window_overlay_img.addEventListener('click', () => {
        window.classList.remove('visible');
    });

}

/**
 * Affiche la fenêtre de wiki et charge la liste d'objets si elle n'a jamais été chargée
 * @param {string} window_type
 */

export function displayWindow(window_type) {
    document.getElementById(mh_optimizer_window_id).classList.add('visible');
    let body = document.getElementsByTagName('body')[0];
    body.setAttribute('style', 'overflow: hidden');
    createWikiToolsTabs(window_type);
}

/**
 * Crée le bloc de contenu de la page
 * @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
 */

export function createWikiToolsTabContent(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');

    let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
    if (tab_content) {
        tab_content.remove();
    }
    tab_content = document.createElement('div');
    tab_content.classList.add('tab-content');
    tab_content.id = mh_optimizer_window_id + '-tab-content';

    window_content.appendChild(tab_content);
}

/**
 * Détermine quelle fonction appeler en fonction de l'onglet sélectionné
 * @param {string} window_type     Le type de l'onglet
 * @param tab                      L'onglet à afficher
 */

export function dispatchWikiToolsContent(window_type, tab) {

    createWikiToolsTabContent(window_type);

    let list = document.getElementById(mh_optimizer_window_id + '-tab-content');
    if (list) {
        list.innerHTML = '';
    }
    switch (tab.id) {
        case 'items':
            displayItems(state.items, tab.id);
            break;
        case 'recipes':
            displayRecipes();
            break;
        case 'ruins':
            displayRuins();
            break;
        case 'bank':
            displayBank(tab.id);
            break;
        case 'camping':
            displayCamping();
            break;
        default:
            break;
    }
}

/** Filtre la liste des objets */

export function filterItems(source_items) {
    return source_items;
}

/**
 * Affiche les éléments présents dans la banque
 * @param {string} tab_id
 */
