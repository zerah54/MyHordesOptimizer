import { mh_optimizer_map_window_id, mh_optimizer_window_id, repo_img_hordes_url } from '../config/constants';
import { changelogs } from '../data/changelogs';
import { tabs_list } from '../data/tabs';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { getScriptInfo } from '../utils/version';
import { displayBank, displayItems } from './bank';
import { displayCamping } from './camping';
import { displayRecipes } from './recipes';
import { displayRuins } from './ruins';

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

    const window_box = document.createElement('div');
    window_box.id = id + '-box';
    window_box.classList.add('mho-window-box');
    window.appendChild(window_box);

    const window_drag_handler = document.createElement('div');
    window_drag_handler.id = id + '-drag-handle';
    if (!full_size) {
        window_drag_handler.style.cursor = 'move';
    }
    window_drag_handler.classList.add('mho-window-drag-handle');
    window_box.appendChild(window_drag_handler);

    const window_content = document.createElement('div');
    window_content.id = id + '-content';
    window_content.classList.add('mho-window-content');
    window_box.appendChild(window_content);

    const window_overlay = document.createElement('div');
    window_overlay.id = id + '-overlay';
    window_overlay.classList.add('mho-window-overlay');
    window_box.appendChild(window_overlay);

    const window_overlay_ul = document.createElement('ul');
    window_overlay.appendChild(window_overlay_ul);

    const window_overlay_li = document.createElement('li');
    window_overlay_ul.appendChild(window_overlay_li);

    const window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
    window_overlay_li.appendChild(window_overlay_img);

    window_overlay_img.addEventListener('click', () => {
        window.classList.remove('visible');
        const body = document.getElementsByTagName('body')[0];
        (body as any).removeAttribute('style', 'overflow: hidden');
    });

    const post_office = document.getElementById('post-office');
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
                window.style.top = (window.offsetTop - pos2) + 'px';
                window.style.left = (window.offsetLeft - pos1) + 'px';
            };
        };
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
    const window_content = document.getElementById(mh_optimizer_window_id + '-content');
    window_content.innerHTML = '';

    const tabs_div = document.createElement('div');
    tabs_div.id = 'tabs';

    window_content.appendChild(tabs_div);
    const tabs_ul = document.createElement('ul');

    const current_tabs_list = tabs_list[window_type]
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
        const tab_link = document.createElement('div');

        if (tab.icon) {
            const tab_icon = document.createElement('img');
            tab_icon.src = tab.icon;
            tab_link.appendChild(tab_icon);
        }

        const tab_text = document.createTextNode(getI18N(tab.label));
        tab_link.appendChild(tab_text);

        const tab_li = document.createElement('li');
        tab_li.appendChild(tab_link);

        if (index === 0) {
            tab_li.classList.add('selected');
            dispatchWikiToolsContent(window_type, tab);
        }

        const tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');
        tab_li.addEventListener('click', () => {
            if (!tab_li.classList.contains('selected') && tab_content !== undefined && tab_content !== null) {
                for (const li of tabs_ul.children) {
                    li.classList.remove('selected');
                }
                tab_li.classList.add('selected');
            }
            dispatchWikiToolsContent(window_type, tab);
        });

        tabs_ul.appendChild(tab_li);
    });
    tabs_div.appendChild(tabs_ul);

}

/** Crée la fenêtre de wiki */

export function createMapWindow() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const window_content = document.createElement('div');
    window_content.id = mh_optimizer_map_window_id + '-content';
    window_content.setAttribute('style', 'height: calc(100% - 26px); position: initial; margin-top: 26px;');

    const window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_hordes_url + 'icons/b_close.png';
    const window_overlay_li = document.createElement('li');
    window_overlay_li.appendChild(window_overlay_img);
    const window_overlay_ul = document.createElement('ul');
    window_overlay_ul.style.margin = '-2px -2px 0 0';
    window_overlay_ul.appendChild(window_overlay_li);

    const window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_map_window_id + '-overlay';
    window_overlay.setAttribute('style', 'cursor: move; width: 100%;');

    const window_box = document.createElement('div');
    window_box.id = mh_optimizer_map_window_id + '-box';
    window_box.draggable = true;

    const window = document.createElement('div');
    window.style.minWidth = '150px;';
    window.style.minHeight = '150px;';
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
            window_box.style.top = (window_box.offsetTop - pos2) + 'px';
            window_box.style.left = (window_box.offsetLeft - pos1) + 'px';
        };
    };
    window_overlay.appendChild(window_overlay_ul);

    window_box.appendChild(window_content);
    window_box.appendChild(window_overlay);

    window.appendChild(window_box);

    const post_office = document.getElementById('post-office');
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
    const body = document.getElementsByTagName('body')[0];
    body.setAttribute('style', 'overflow: hidden');
    createWikiToolsTabs(window_type);
}

/**
 * Crée le bloc de contenu de la page
 * @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
 */

export function createWikiToolsTabContent(window_type) {
    const window_content = document.getElementById(mh_optimizer_window_id + '-content');

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

    const list = document.getElementById(mh_optimizer_window_id + '-tab-content');
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
 * Affiche une modale personnalisée avec le contenu du changelog et un bouton OK.
 * Utilise une modale HTML/CSS au lieu de alert() pour éviter le blocage silencieux du navigateur.
 * @param {string} content      Le texte du changelog à afficher
 * @param {() => void} onConfirm  Callback appelé uniquement quand l'utilisateur clique OK
 */
export function showChangelogModal(content: string, onConfirm?: () => void): void {
    const modal_id = 'mho-changelog-modal';

    // Supprimer une éventuelle modale existante
    document.getElementById(modal_id)?.remove();

    const overlay = document.createElement('div');
    overlay.id = modal_id;
    overlay.classList.add('mho-modal-overlay');

    const box = document.createElement('div');
    box.classList.add('mho-modal-box');

    const title = document.createElement('h3');
    title.classList.add('mho-modal-title');
    title.textContent = content.split('\n')[0].trim();

    const body = document.createElement('pre');
    body.classList.add('mho-modal-body');
    body.textContent = content.split('\n').slice(1).map((line) => line.trim()).join('\n').trim();

    // Lien pour afficher l'historique complet des versions passées
    const current_version: string = getScriptInfo().version;
    const older_versions = Object.entries(changelogs).filter(([v]) => v !== current_version);

    if (older_versions.length > 0) {
        const history_toggle = document.createElement('span');
        history_toggle.classList.add('mho-changelog-history-toggle');
        history_toggle.textContent = '▶ Voir les notes de versions plus anciennes';

        const history_section = document.createElement('div');
        history_section.classList.add('mho-changelog-history-section');
        history_section.style.display = 'none';

        older_versions.forEach(([version, notes]) => {
            const version_block = document.createElement('div');
            version_block.classList.add('mho-changelog-history-block');

            const version_title = document.createElement('h4');
            version_title.classList.add('mho-changelog-history-version');
            version_title.textContent = `${getScriptInfo().name} ${version}`;

            const version_body = document.createElement('pre');
            version_body.classList.add('mho-changelog-history-body');
            version_body.textContent = notes.split('\n').map((line) => line.trim()).join('\n').trim();

            version_block.appendChild(version_title);
            version_block.appendChild(version_body);
            history_section.appendChild(version_block);
        });

        history_toggle.addEventListener('click', () => {
            const is_open = history_section.style.display !== 'none';
            history_section.style.display = is_open ? 'none' : 'block';
            history_toggle.textContent = (is_open ? '▶' : '▼') + ' Voir les notes de versions plus anciennes';
        });

        box.appendChild(title);
        box.appendChild(body);
        box.appendChild(history_toggle);
        box.appendChild(history_section);
    } else {
        box.appendChild(title);
        box.appendChild(body);
    }

    const footer = document.createElement('div');
    footer.classList.add('mho-modal-footer');

    const ok_btn = document.createElement('button');
    ok_btn.textContent = 'OK';
    ok_btn.classList.add('mho-modal-btn');
    ok_btn.addEventListener('click', () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });

    footer.appendChild(ok_btn);
    box.appendChild(footer);
    overlay.appendChild(box);

    const post_office = document.getElementById('post-office');
    if (post_office) {
        post_office.parentNode.insertBefore(overlay, post_office.nextSibling);
    } else {
        document.body.appendChild(overlay);
    }
}

/**
 * Affiche les éléments présents dans la banque
 * @param {string} tab_id
 */
