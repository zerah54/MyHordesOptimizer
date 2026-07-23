import {
    mh_optimizer_icon,
    mho_filter_citizen_list_id,
    mho_filter_omniscience_id,
    mho_search_building_field_id,
    mho_search_dump_field_id,
    mho_search_recipient_field_id,
    mho_search_registry_field_id,
    mho_search_trap_field_id
} from '../config/constants';
import { params_categories } from '../data/params';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { createCheckboxDropdown, createSingleFilterSelect } from '../utils/dom';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { normalizeString } from '../utils/notifications';
import { pageIsCitizens, pageIsConstructions, pageIsDump, pageIsMsgReceived, pageIsOmniscience, pageIsTrap, trapItemsTableElement } from '../utils/page';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);

/** Clés d'attente d'élément : une seule attente en vol par cible, quel que soit le nombre de rejeux */
const wait_key_buildings: string = 'search-fields:buildings';
const wait_key_building_tabs: string = 'search-fields:building-tabs';
const wait_key_complete_buildings: string = 'search-fields:complete-buildings';


export function displaySearchFields() {
    if (state.mho_parameters.display_search_fields) {
        displaySearchFieldOnBuildings();
        displaySearchFieldOnRecipientList();
        displaySearchFieldOnRegistry();
        displaySearchFieldOnDump();
        displaySearchFieldOnTrap();
        hideCompletedBuildings();
        displayFiltersOnOmniscience();
        displayFiltersOnCitizenList();
    }
}

/** Si l'option associée est activée, masque les chantiers complétés sur la page de chantiers */

export function hideCompletedBuildings() {

    const hideBuildings = (buildings) => {
        const building_rows = [];
        buildings.forEach((building) => {
            building_rows.push(...arrFrom(building.querySelectorAll('.building')));
        });

        /** Masque les lignes de chantiers devant être masquées */
        building_rows.forEach((building_row) => {
            if (building_row.classList.contains('complete') && !building_row.querySelector('.to_repair')) {
                building_row.classList.add('mho-hidden');
            } else {
                building_row.classList.remove('mho-hidden');
            }
        });

        /** Masque les catégories de chantiers dont toutes les lignes ont été masquées */
        buildings.forEach((building) => {
            if (arrFrom(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('mho-hidden'))) {
                building.classList.add('mho-hidden');
            } else {
                building.classList.remove('mho-hidden');
            }
        });
    };

    const showBuildings = (buildings) => {
        buildings?.forEach((building) => {
            if (building.classList.contains('mho-hidden')) {
                building.classList.remove('mho-hidden');
            }
            arrFrom(building.querySelectorAll('.building.mho-hidden')).forEach((buildingRow) => {
                buildingRow.classList.remove('mho-hidden');
            });
        });
    };

    if (!pageIsConstructions()) {
        cancelWaitForElement(wait_key_buildings);
        return;
    }

    const buildings = arrFrom(document.querySelectorAll('.buildings') || []);
    if (!state.mho_parameters.hide_completed_buildings_field) {
        cancelWaitForElement(wait_key_buildings);
        showBuildings(buildings);
        return;
    }

    if (buildings.length > 0) {
        hideBuildings(buildings);
        return;
    }

    /**
     * Les chantiers sont rendus après la navigation : on attend leur apparition.
     * L'attente est enregistrée sous une clé fixe, donc un rejeu des initialisations
     * la remplace au lieu d'empiler un observateur de plus.
     */
    waitForElement(wait_key_buildings, '.buildings', () => {
        if (!pageIsConstructions() || !state.mho_parameters.hide_completed_buildings_field) return;
        hideBuildings(arrFrom(document.querySelectorAll('.buildings') || []));
    });
}

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */

export function displaySearchFieldOnBuildings() {
    let fields_container = document.getElementById(mho_search_building_field_id);
    let searchFieldAdded = false; // Indicateur pour suivre l'ajout du champ de recherche


    const addSearchField = (tabs) => {
        if (searchFieldAdded) return; // Vérifie si le champ de recherche a déjà été ajouté

        const tabs_block = tabs.parentElement;

        fields_container = document.getElementById(mho_search_building_field_id);
        if (fields_container) return; // Vérifie si le conteneur existe déjà

        fields_container = document.createElement('div');
        fields_container.style.display = 'flex';
        fields_container.style.flexWrap = 'wrap';
        fields_container.style.alignItems = 'center';
        fields_container.style.gap = '0.5em';
        fields_container.style.marginTop = '0.5em';
        fields_container.id = mho_search_building_field_id;
        tabs_block.insertBefore(fields_container, tabs);

        const search_field_div = document.createElement('div');
        search_field_div.style.display = 'flex';
        search_field_div.style.alignItems = 'center';
        fields_container.appendChild(search_field_div);
        if (!state.mho_parameters.display_search_field_buildings) {
            search_field_div.classList.add('hidden');
        }

        const header_mho_img = document.createElement('img');
        header_mho_img.src = mh_optimizer_icon;
        header_mho_img.style.height = '24px';
        header_mho_img.style.position = 'absolute';
        search_field_div.appendChild(header_mho_img);

        const search_field = document.createElement('input');
        search_field.type = 'text';
        search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_buildings').label);
        search_field.classList.add('mho-input', 'inline');
        search_field.setAttribute('style', 'min-width: 200px; padding-left: 24px;');
        search_field_div.appendChild(search_field);

        const buildings = arrFrom(document.querySelectorAll('.buildings') || []);

        const filterBuildings = () => {
            const building_rows = [];
            buildings.forEach((building) => {
                building_rows.push(...arrFrom(building.querySelectorAll('.building')));
            });
            building_rows.forEach((building_row) => {
                const force_hide = state.mho_parameters.hide_completed_buildings_field && building_row.classList.contains('complete');

                if (force_hide) {
                    building_row.classList.add('hidden');
                } else if (normalizeString(building_row.querySelector('.building_name').innerText).indexOf(normalizeString(search_field.value)) > -1) {
                    building_row.classList.remove('hidden');
                } else {
                    building_row.classList.add('hidden');
                }
            });

            buildings.forEach((building) => {
                if (arrFrom(building.children).filter((child) => child.classList.contains('building')).every((child) => child.classList.contains('hidden'))) {
                    building.classList.add('hidden');
                } else {
                    building.classList.remove('hidden');
                }
            });
        };

        search_field.addEventListener('keyup', (event) => {
            filterBuildings();
        });

        searchFieldAdded = true; // Mettre à jour l'indicateur après l'ajout
    };

    if (state.mho_parameters.display_search_field_buildings && pageIsConstructions()) {
        if (fields_container) return;

        /**
         * Les onglets de chantiers sont rendus après la navigation. L'attente est
         * enregistrée sous une clé fixe : un rejeu des initialisations la remplace
         * au lieu d'empiler un observateur de plus.
         */
        waitForElement(wait_key_building_tabs, 'ul.buildings-tabs', (tabs: Element) => {
            if (!state.mho_parameters.display_search_field_buildings || !pageIsConstructions()) return;
            addSearchField(tabs);
        });
    } else {
        cancelWaitForElement(wait_key_building_tabs);
        if (fields_container) fields_container.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la liste des destinataires d'un message */

export function displaySearchFieldOnRecipientList() {
    let search_field = document.getElementById(mho_search_recipient_field_id);
    if (state.mho_parameters.display_search_field_recipients && pageIsMsgReceived()) {
        if (search_field) return;

        const recipients = document.querySelector('#recipient_list');
        if (recipients) {
            const search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_recipient_field_id;
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_recipients').label);
            search_field.classList.add('mho-input', 'inline');
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            search_field.addEventListener('keyup', (event) => {
                const recipients_list = arrFrom(document.querySelectorAll('.recipient.link') || []);
                recipients_list.forEach((recipient) => {
                    if (normalizeString(recipient.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                        recipient.classList.remove('hidden');
                    } else {
                        recipient.classList.add('hidden');
                    }
                });
            });

            search_field_container.appendChild(search_field);

            const header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.position = 'absolute';
            header_mho_img.style.left = '4px';

            search_field_container.appendChild(header_mho_img);
            recipients.insertBefore(search_field_container, recipients.firstElementChild);
        }
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la page de la décharge */

export function displaySearchFieldOnDump() {
    let search_field = document.getElementById(mho_search_dump_field_id);
    if (state.mho_parameters.display_search_field_dump && pageIsDump()) {
        if (search_field) return;

        const main_content = document.querySelector('.town-main-content');
        if (main_content) {
            const table = main_content.querySelector('.row-table');
            if (table) {
                const filterFunction = (name_search_field, can_be_dump_field, can_be_recovered_field) => {
                    const items_list = arrFrom(table.querySelectorAll('div.row-flex') || []);
                    items_list.forEach((item) => {
                        const item_label = item.querySelector('div.item-line img');
                        const item_counts = item.children.item(1).querySelectorAll('div');
                        const item_bank_count = +item_counts[0].innerText.replace(/\D*/, '');
                        const item_dump_count = +item_counts[1].innerText.replace(/\D*/, '');

                        const is_search_in_string = normalizeString(item_label.getAttribute('alt')).indexOf(normalizeString(name_search_field.value)) > -1;
                        const can_be_recovered = can_be_recovered_field.checked && item_dump_count > 0;
                        const can_be_dump = can_be_dump_field.checked && item_bank_count > 0;

                        if (is_search_in_string && (can_be_dump || can_be_recovered)) {
                            item.classList.remove('hidden');
                        } else {
                            item.classList.add('hidden');
                        }
                    });
                };

                const search_field_container = document.createElement('div');
                search_field_container.setAttribute('style', ' display: flex; flex-wrap: wrap; gap: 0.5em;');
                search_field_container.id = mho_search_dump_field_id;

                search_field = document.createElement('input');
                search_field.type = 'text';
                search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_dump').label);
                search_field.classList.add('mho-input', 'inline');
                search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

                search_field_container.appendChild(search_field);

                const can_be_dumped = document.createElement('div');
                search_field_container.appendChild(can_be_dumped);

                const can_be_dumped_input = document.createElement('input');
                can_be_dumped_input.type = 'checkbox';
                can_be_dumped_input.id = 'can_be_dumped';
                can_be_dumped_input.checked = true;
                can_be_dumped_input.classList.add('mho-input');
                can_be_dumped.appendChild(can_be_dumped_input);

                const can_be_dumped_label = document.createElement('label');
                can_be_dumped_label.innerText = getI18N(texts.can_be_dumped);
                can_be_dumped_label.htmlFor = 'can_be_dumped';
                can_be_dumped.appendChild(can_be_dumped_label);

                const can_be_recovered = document.createElement('div');
                search_field_container.appendChild(can_be_recovered);

                const can_be_recovered_input = document.createElement('input');
                can_be_recovered_input.type = 'checkbox';
                can_be_recovered_input.id = 'can_be_recovered';
                can_be_recovered_input.checked = true;
                can_be_recovered_input.classList.add('mho-input');
                can_be_recovered.appendChild(can_be_recovered_input);

                const can_be_recovered_label = document.createElement('label');
                can_be_recovered_label.innerText = getI18N(texts.can_be_recovered);
                can_be_recovered_label.htmlFor = 'can_be_recovered';
                can_be_recovered.appendChild(can_be_recovered_label);

                search_field.addEventListener('keyup', (event) => {
                    filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                });

                can_be_dumped_input.addEventListener('change', (event) => {
                    filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                });

                can_be_recovered.addEventListener('change', (event) => {
                    filterFunction(search_field, can_be_dumped_input, can_be_recovered_input);
                });

                const header_mho_img = document.createElement('img');
                header_mho_img.src = mh_optimizer_icon;
                header_mho_img.style.height = '24px';
                header_mho_img.style.position = 'absolute';
                header_mho_img.style.left = '16px';

                search_field_container.appendChild(header_mho_img);
                main_content.insertBefore(search_field_container, table);
            }
        }
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur le registre */

/** Nœud de l'arborescence des paramètres, réduit à ce qui est nécessaire pour retrouver un libellé */
interface ParamNode {
    id: string;
    label?: unknown;
    params?: ParamNode[];
    children?: ParamNode[];
}

/** Recherche en profondeur, pour ne pas dépendre du niveau d'imbrication exact d'une option */
function findParamNode(nodes: ParamNode[], param_id: string): ParamNode | undefined {
    const direct: ParamNode | undefined = nodes.find((node: ParamNode) => node.id === param_id);
    if (direct) return direct;

    return nodes
        .map((node: ParamNode) => findParamNode([...(node.params ?? []), ...(node.children ?? [])], param_id))
        .find((found: ParamNode | undefined) => !!found);
}

/** Libellé traduit d'une option, réutilisé comme texte indicatif du champ de recherche correspondant */
function getParamLabel(param_id: string): string {
    return getI18N(findParamNode(params_categories as ParamNode[], param_id)?.label);
}

/** Si l'option associée est activée, affiche un champ de recherche sur la liste des appâts de la page de pièges */

export function displaySearchFieldOnTrap(): void {
    const existing_field: HTMLElement | null = document.getElementById(mho_search_trap_field_id);

    if (!state.mho_parameters.display_search_field_trap || !pageIsTrap()) {
        existing_field?.remove();
        return;
    }

    if (existing_field) return;

    const table: Element | undefined = trapItemsTableElement();
    if (!table?.parentElement) return;

    const search_field_container: HTMLDivElement = document.createElement('div');
    search_field_container.id = mho_search_trap_field_id;
    search_field_container.setAttribute('style', 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.25em;');

    const header_mho_img: HTMLImageElement = document.createElement('img');
    header_mho_img.src = mh_optimizer_icon;
    header_mho_img.style.height = '24px';
    header_mho_img.style.position = 'absolute';
    search_field_container.appendChild(header_mho_img);

    const search_field: HTMLInputElement = document.createElement('input');
    search_field.type = 'text';
    search_field.placeholder = getParamLabel('display_search_field_trap');
    search_field.classList.add('mho-input', 'inline');
    search_field.setAttribute('style', 'min-width: 200px; padding-left: 24px;');
    search_field_container.appendChild(search_field);

    /** Le libellé de l'appât n'est présent en texte que dans un bloc masqué sur petit écran : on lit l'alt de l'icône, toujours renseigné */
    const filterBaits = (): void => {
        arrFrom(table.querySelectorAll(':scope > .row:not(.header)')).forEach((row: HTMLElement) => {
            const label: string = row.querySelector('img[alt]')?.getAttribute('alt') ?? '';
            if (normalizeString(label).indexOf(normalizeString(search_field.value)) > -1) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
    };

    search_field.addEventListener('keyup', () => filterBaits());

    table.parentElement.insertBefore(search_field_container, table);
}


export function displaySearchFieldOnRegistry() {
    let search_field = document.getElementById(mho_search_registry_field_id);
    if (state.mho_parameters.display_search_field_registry) {

        if (search_field) return;

        const logs = document.querySelector('hordes-log');

        if (logs) {
            const search_field_container = document.createElement('div');
            const logs_title = logs.parentElement.previousElementSibling;

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_registry_field_id;
            search_field.classList.add('mho-input');
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_registry').label);
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            search_field_container.appendChild(search_field);

            const header_mho_img = document.createElement('img');
            header_mho_img.src = mh_optimizer_icon;
            header_mho_img.style.height = '24px';
            header_mho_img.style.position = 'absolute';

            search_field_container.appendChild(header_mho_img);

            if (logs_title) {
                if (logs_title.tagName.toLowerCase() === 'H5'.toLowerCase()) {

                    search_field_container.style.marginRight = '0.5em';
                    search_field_container.style.float = 'right';
                    search_field_container.style.position = 'relative';
                    search_field_container.style.bottom = '7px';

                    search_field.classList.add('inline');


                    const first_link = logs_title.querySelector('a');
                    if (first_link) {
                        first_link.style.marginLeft = 'auto';
                    }

                    header_mho_img.style.left = (0) as any;
                } else {
                    search_field_container.style.display = 'flex';
                    search_field_container.style.justifyContent = 'center';

                    header_mho_img.style.left = '4px';
                }

                logs_title.appendChild(search_field_container);


                search_field.addEventListener('keyup', (event) => {
                    const logs_list = arrFrom(document.querySelectorAll('.log-entry .log-part-content') || []);
                    logs_list.forEach((log) => {
                        if (normalizeString(log.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                            log.parentElement.classList.remove('hidden');
                        } else {
                            log.parentElement.classList.add('hidden');
                        }
                    });
                });
            }
        }
    } else if (search_field) {
        search_field.parentElement.remove();
    }
}

/** Si l'option associée est activée, affiche le nombre de pa nécessaires pour réparer un bâtiment suffisemment pour qu'il ne soit pas détruit lors de l'attaque */

export function displayMinApOnBuildings() {
    state.tooltips_observer?.disconnect();

    if (!pageIsConstructions()) {
        cancelWaitForElement(wait_key_complete_buildings);
        return;
    }

    if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe) {
        /**
         * Les chantiers sont rendus après la navigation : on attend leur apparition au
         * lieu des dix tentatives à 100 ms d'origine, qui abandonnaient au bout d'une
         * seconde et laissaient alors les barres sans repère.
         */
        waitForElement(wait_key_complete_buildings, '.building.complete', () => {
            if (!state.mho_parameters.display_missing_ap_for_buildings_to_be_safe || !pageIsConstructions()) return;
            observeTooltipsForBuildings();
        });
    } else {
        cancelWaitForElement(wait_key_complete_buildings);

        const missing_ap_infos = document.querySelectorAll('.mho-missing-ap');
        arrFrom(missing_ap_infos).forEach((missing_ap_info) => missing_ap_info.remove());

        const mho_safe_aps = document.querySelectorAll('.mho-safe-ap');
        arrFrom(mho_safe_aps).forEach((mho_safe_ap) => mho_safe_ap.remove());
    }
}

/** Met à jour les barres de PA à partir des bulles d'aide du jeu, et suit leurs changements */
function observeTooltipsForBuildings(): void {
    const complete_buildings = document.querySelectorAll('.building.complete');

    ///////////////////////// Observe les modifications sur les tooltips pour mieux alimenter les barres /////////////////////////
    // Selectionne le noeud dont les mutations seront observées
    const tooltip_container = document.querySelector('#tooltip_container');
    /** Le conteneur de bulles appartient au jeu : sans lui, rien à observer */
    if (!tooltip_container) return;
    // Options de l'observateur (quelles sont les mutations à observer)
    const config = { childList: true, subtree: true };

    // Fonction callback à éxécuter quand une mutation est observée
    const callback = function (mutationsList) {
        if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
            const broken_buildings = arrFrom(complete_buildings).filter((complete_building) => complete_building.querySelector('.to_repair'));

            if (!broken_buildings || broken_buildings.length === 0) return;

            broken_buildings.forEach((broken_building) => {
                const bar_element = broken_building.querySelector('.ap-bar');
                const to_repair_element = broken_building.querySelector('.to_repair');
                const nb_ap_element = broken_building.querySelector('.build-req');

                to_repair_element.dispatchEvent(new Event('mouseenter'));
                const tooltip: any = document.querySelector('.tooltip:not(.mho)[style*="display: block"]');
                to_repair_element.dispatchEvent(new Event('mouseleave'));
                if (!tooltip || !tooltip.innerHTML) return;

                const tooltip_status_match = tooltip.innerText.match(/[0-9]+\/[0-9]+/);
                if (!tooltip_status_match || tooltip_status_match.length <= 0) return;
                const building_status = tooltip_status_match[0]?.split('/');

                const tooltip_match = tooltip.innerHTML.match(/[0-9]+/g);
                if (!tooltip_match || tooltip_match.length <= 0) return;

                const nb_pts_per_ap = parseInt(tooltip_match[tooltip_match.length - 1].match(/[0-9]+/)[0], 10);
                const current_pv = parseInt(building_status[0], 10);
                const total_pv = parseInt(building_status[1], 10);

                /**
                 * Bâtiment concerné, identifié par son icône. Le point final borne le nom
                 * (l'URL compilée est `…/building/<icone>.<hash>.gif`).
                 */
                const building_icon: string = broken_building.querySelector('.building_icon')?.getAttribute('src') ?? '';
                const matchesIcon = (icon_name: string): boolean => building_icon.includes(`${icon_name}.`);

                /**
                 * Pertes de PV subies pendant la nuit, à compenser pour garantir la survie.
                 *
                 * Terme d'attaque : seule la pandé inflige des dégâts aux bâtiments pendant
                 * l'attaque (côté jeu, `building_attack_damage` n'est vrai que pour ce type de
                 * ville). En RE / RNE un bâtiment ne perd rien à l'attaque.
                 *
                 * Le réacteur est écarté même en pandé car il est imperméable (`isImpervious`,
                 * donc hors de la boucle d'attaque du jeu). C'est le seul bâtiment imperméable
                 * à traiter ici : les autres ne subissent aucun dégât, ne sont donc jamais
                 * réparables, et n'atteignent jamais ce callback.
                 */
                const is_pande: boolean = state.mh_user?.townDetails?.townType?.toUpperCase() === 'PANDE';
                const is_reactor: boolean = matchesIcon('small_arma');
                const attack_loss: number = (is_pande && !is_reactor) ? Math.ceil(total_pv * 0.7) : 0;

                /**
                 * Terme propre à certains bâtiments, qui perdent des PV chaque nuit
                 * indépendamment de l'attaque, donc aussi en RE. Valeurs relevées dans
                 * `BuildingEffectListener` du jeu ; seuls ces deux-là ont une perte propre.
                 */
                let self_loss: number = 0;
                if (matchesIcon('small_fireworks')) {
                    self_loss = 20; // feux d'artifice : 20 PV fixes
                } else if (is_reactor) {
                    self_loss = 125; // réacteur soviétique : mt_rand(50, 125), pire cas retenu
                }

                /**
                 * Seuil de survie garanti, plafonné au PV max : au-delà, aucune réparation ne
                 * suffirait, le mieux possible étant alors de réparer entièrement.
                 */
                const minimum_safe: number = Math.min(total_pv, attack_loss + self_loss + 1);
                if (minimum_safe <= current_pv) return;

                const missing_pts = minimum_safe - current_pv;

                bar_element.style.display = 'flex';
                let new_ap_bar = bar_element.querySelector('.mho-safe-ap');
                if (!new_ap_bar) {
                    new_ap_bar = document.createElement('div');
                    new_ap_bar.classList.add('mho-safe-ap');
                }
                new_ap_bar.style.background = 'yellow';
                new_ap_bar.style.width = missing_pts / total_pv * 100 + '%';
                bar_element.appendChild(new_ap_bar);

                let missing_ap_info = nb_ap_element.querySelector('.mho-missing-ap');
                if (!missing_ap_info) {
                    missing_ap_info = document.createElement('span');
                    missing_ap_info.classList.add('mho-missing-ap');
                }
                missing_ap_info.style.fontWeight = 'initial';
                missing_ap_info.style.fontSize = '0.8em';
                missing_ap_info.style.overflow = 'hidden';
                missing_ap_info.style.textOverflow = 'ellipsis';
                missing_ap_info.innerText = getI18N(texts.missing_ap_explanation).replace('%VAR%', Math.ceil(missing_pts / nb_pts_per_ap));
                nb_ap_element.appendChild(missing_ap_info);
            });
        } else {
            state.tooltips_observer?.disconnect();
        }
    };

    // Créé une instance de l'observateur lié à la fonction de callback
    state.tooltips_observer = new MutationObserver(callback);
    // Commence à observer le noeud cible pour les mutations précédemment configurées
    state.tooltips_observer.observe(tooltip_container, config);

    ////////////////////////////////////////////////////////
}

/** Si l'option associée est activée, affiche des filtres sur la liste des citoyens */
function displayFiltersOnCitizenList() {
    let filter_container = document.getElementById(mho_filter_citizen_list_id);

    if (state.mho_parameters.display_filters_citizen_list && pageIsCitizens()) {
        if (filter_container) return;

        const main_content = document.querySelector('.town-main-content');
        if (!main_content) return;

        const table = main_content.querySelector('.row-table');
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));

        const professions = new Map();
        const houseLevels = new Map();

        rows.forEach((row) => {
            const profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
            if (profImg) professions.set(profImg.getAttribute('alt'), profImg.src);

            const defenseLabel = row.querySelector('.citizen-defense');
            const houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
            if (houseImg) houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);
        });

        filter_container = document.createElement('div');
        filter_container.id = mho_filter_citizen_list_id;
        filter_container.classList.add('mho-filter-bar');

        const dropdownDestroyers = [];
        let applyFilters = () => {
        };
        const triggerFilters = () => applyFilters();

        // Recherche par nom
        const nameWrapper = document.createElement('div');
        nameWrapper.classList.add('mho-search-wrapper');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = getI18N(texts.filter_search_name);
        nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
        nameWrapper.appendChild(nameInput);

        const iconImg = document.createElement('img');
        iconImg.src = mh_optimizer_icon;
        iconImg.classList.add('mho-search-icon');
        nameWrapper.appendChild(iconImg);

        filter_container.appendChild(nameWrapper);
        nameInput.addEventListener('keyup', triggerFilters);

        // Select : statut de connexion
        const { container: onlineCtnr, select: onlineSelect } = createSingleFilterSelect(
            getI18N(texts.filter_online_label),
            `${mho_filter_citizen_list_id}-online`,
            [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'online', text: getI18N(texts.filter_online_online) },
                { value: 'offline', text: getI18N(texts.filter_online_offline) }
            ]
        );
        filter_container.appendChild(onlineCtnr);
        onlineSelect.addEventListener('change', triggerFilters);

        // Volet : profession
        const {
            container: profCtnr,
            getSelectedValues: getSelectedProfessions,
            destroy: destroyProfDropdown
        } = createCheckboxDropdown(
            getI18N(texts.job),
            `${mho_filter_citizen_list_id}-profession`,
            Array.from(professions.entries()).map(([alt, src]) => ({ value: alt, text: alt, icon: src })),
            triggerFilters
        );
        filter_container.appendChild(profCtnr);
        dropdownDestroyers.push(destroyProfDropdown);

        // Volet : niveau de maison
        const {
            container: houseCtnr,
            getSelectedValues: getSelectedHouseLevels,
            destroy: destroyHouseDropdown
        } = createCheckboxDropdown(
            getI18N(texts.filter_house_level_label),
            `${mho_filter_citizen_list_id}-house-level`,
            Array.from(houseLevels.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([level, src]) => ({
                value: level,
                text: level,
                icon: src
            })),
            triggerFilters
        );
        filter_container.appendChild(houseCtnr);
        dropdownDestroyers.push(destroyHouseDropdown);

        // Select : emplacement
        const { container: locationCtnr, select: locationSelect } = createSingleFilterSelect(
            getI18N(texts.filter_location_label),
            `${mho_filter_citizen_list_id}-location`,
            [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'outside', text: getI18N(texts.filter_location_outside) },
                { value: 'inside', text: getI18N(texts.filter_location_inside) }
            ]
        );
        filter_container.appendChild(locationCtnr);
        locationSelect.addEventListener('change', triggerFilters);

        applyFilters = () => {
            const nameVal = normalizeString(nameInput.value);
            const onlineVal = onlineSelect.value;
            const locationVal = locationSelect.value;
            const selectedProfs = getSelectedProfessions();
            const selectedLvls = getSelectedHouseLevels();

            rows.forEach((row) => {
                const nameEl = row.querySelector('.userCell a.username');
                const rowName = normalizeString(nameEl?.innerText.trim() ?? '');

                const statusEl = row.querySelector('.citizen-online, .citizen-offline');
                const connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                    : statusEl?.classList.contains('citizen-offline') ? 'offline'
                        : null;

                const locEl = row.querySelector('.citizen-box.location');
                const isOutside = locEl ? /\[/.test(locEl.innerText) : false;

                const profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
                const prof = profImg?.getAttribute('alt') ?? '';

                const defenseLabel = row.querySelector('.citizen-defense');
                const houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
                const houseLevel = houseImg?.getAttribute('alt') ?? '';

                const pass = (nameVal === '' || rowName.includes(nameVal))
                    && (onlineVal === 'all' || onlineVal === connectionStatus)
                    && (locationVal === 'all' || (locationVal === 'outside') === isOutside)
                    && (selectedProfs.length === 0 || selectedProfs.includes(prof))
                    && (selectedLvls.length === 0 || selectedLvls.includes(houseLevel));

                row.classList.toggle('hidden', !pass);
            });
        };

        filter_container._mhoDestroyDropdowns = dropdownDestroyers;
        main_content.insertBefore(filter_container, table);

    } else if (filter_container) {
        filter_container._mhoDestroyDropdowns?.forEach((destroy) => destroy());
        filter_container.remove();
    }
}

/** Si l'option associée est activée, affiche des filtres sur la page Omniscience */
function displayFiltersOnOmniscience() {
    let filter_container = document.getElementById(mho_filter_omniscience_id);

    if (state.mho_parameters.display_filters_omniscience && pageIsOmniscience()) {
        if (filter_container) return;

        const main_content = document.querySelector('.town-main-content');
        if (!main_content) return;

        const table = main_content.querySelector('.row-table');
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));

        const professions = new Map();
        const houseLevels = new Map();
        const starCounts = new Set();
        const chestItems = new Map();
        let hasEmptyChest = false;

        rows.forEach((row) => {
            const profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
            if (profImg) professions.set(profImg.getAttribute('alt'), profImg.src);

            const houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
            if (houseImg) houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);

            const isDead = row.querySelector('.citizen-dead') !== null;
            if (!isDead) {
                const starsCell = row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                starCounts.add(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);
            }

            const itemImgs = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])'));
            if (itemImgs.length === 0) {
                hasEmptyChest = true;
            } else {
                itemImgs.forEach((img) => {
                    const alt = img.getAttribute('alt');
                    if (!chestItems.has(alt)) chestItems.set(alt, img.src);
                });
            }
        });

        filter_container = document.createElement('div');
        filter_container.id = mho_filter_omniscience_id;
        filter_container.classList.add('mho-filter-bar');

        const dropdownDestroyers = [];
        let applyFilters = () => {
        };
        const triggerFilters = () => applyFilters();

        // Recherche par nom
        const nameWrapper = document.createElement('div');
        nameWrapper.classList.add('mho-search-wrapper');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = getI18N(texts.filter_search_name);
        nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
        nameWrapper.appendChild(nameInput);

        const iconImg = document.createElement('img');
        iconImg.src = mh_optimizer_icon;
        iconImg.classList.add('mho-search-icon');
        nameWrapper.appendChild(iconImg);

        filter_container.appendChild(nameWrapper);
        nameInput.addEventListener('keyup', triggerFilters);

        // Select : statut de connexion
        const { container: onlineCtnr, select: onlineSelect } = createSingleFilterSelect(
            getI18N(texts.filter_online_label),
            `${mho_filter_omniscience_id}-online`,
            [
                { value: 'all', text: getI18N(texts.filter_all) },
                { value: 'online', text: getI18N(texts.filter_online_online) },
                { value: 'offline', text: getI18N(texts.filter_online_offline) }
            ]
        );
        filter_container.appendChild(onlineCtnr);
        onlineSelect.addEventListener('change', triggerFilters);

        // Volet : niveau de maison
        const {
            container: houseCtnr,
            getSelectedValues: getSelectedHouseLevels,
            destroy: destroyHouseDropdown
        } = createCheckboxDropdown(
            getI18N(texts.filter_house_level_label),
            `${mho_filter_omniscience_id}-house-level`,
            Array.from(houseLevels.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([level, src]) => ({
                value: level,
                text: level,
                icon: src
            })),
            triggerFilters
        );
        filter_container.appendChild(houseCtnr);
        dropdownDestroyers.push(destroyHouseDropdown);

        // Volet : profession
        const {
            container: profCtnr,
            getSelectedValues: getSelectedProfessions,
            destroy: destroyProfDropdown
        } = createCheckboxDropdown(
            getI18N(texts.job),
            `${mho_filter_omniscience_id}-profession`,
            Array.from(professions.entries()).map(([alt, src]) => ({ value: alt, text: alt, icon: src })),
            triggerFilters
        );
        filter_container.appendChild(profCtnr);
        dropdownDestroyers.push(destroyProfDropdown);

        // Volet : objets en coffre
        const itemOptions = [];
        if (hasEmptyChest) itemOptions.push({ value: '__empty__', text: '—' });
        chestItems.forEach((src, alt) => itemOptions.push({ value: alt, text: alt, icon: src }));

        const {
            container: itemsCtnr,
            getSelectedValues: getSelectedItems,
            destroy: destroyItemsDropdown
        } = createCheckboxDropdown(
            getI18N(texts.filter_chest_items_label),
            `${mho_filter_omniscience_id}-items`,
            itemOptions,
            triggerFilters
        );
        filter_container.appendChild(itemsCtnr);
        dropdownDestroyers.push(destroyItemsDropdown);

        // Volet : étoiles d'activité (les morts n'ont aucune case correspondante ;
        // ils ne remontent que lorsqu'aucune case n'est cochée)
        const {
            container: starsCtnr,
            getSelectedValues: getSelectedStars,
            destroy: destroyStarsDropdown
        } = createCheckboxDropdown(
            getI18N(texts.filter_stars_label),
            `${mho_filter_omniscience_id}-stars`,
            Array.from(starCounts).sort((a: number, b: number) => a - b).map((count: number) => ({
                value: String(count),
                text: count > 0 ? '★'.repeat(count) : '—'
            })),
            triggerFilters
        );
        filter_container.appendChild(starsCtnr);
        dropdownDestroyers.push(destroyStarsDropdown);

        applyFilters = () => {
            const nameVal = normalizeString(nameInput.value);
            const onlineVal = onlineSelect.value;
            const selectedProfs = getSelectedProfessions();
            const selectedLvls = getSelectedHouseLevels();
            const selectedStars = getSelectedStars();
            const selectedItems = getSelectedItems();
            const filterEmpty = selectedItems.includes('__empty__');
            const itemFilter = selectedItems.filter((value) => value !== '__empty__');

            rows.forEach((row) => {
                const nameEl = row.querySelector('.citizen-box-name a.username, .citizen-box-name-me a.username');
                const rowName = normalizeString(nameEl?.innerText.trim() ?? '');

                const statusEl = row.querySelector('.citizen-online, .citizen-offline, .citizen-dead');
                const isDead = statusEl?.classList.contains('citizen-dead') ?? false;
                const connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                    : statusEl?.classList.contains('citizen-offline') ? 'offline'
                        : null;

                const profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
                const prof = profImg?.getAttribute('alt') ?? '';

                const houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
                const houseLevel = houseImg?.getAttribute('alt') ?? '';

                const starsCell = isDead ? null : row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                const starValue = isDead ? '__dead__' : String(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);

                const rowItems = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])')).map((img) => img.getAttribute('alt'));
                const chestEmpty = rowItems.length === 0;

                const passItems = selectedItems.length === 0
                    || (filterEmpty && chestEmpty)
                    || itemFilter.some((item) => rowItems.includes(item));

                const pass = (nameVal === '' || rowName.includes(nameVal))
                    && (onlineVal === 'all' || onlineVal === connectionStatus)
                    && (selectedProfs.length === 0 || selectedProfs.includes(prof))
                    && (selectedLvls.length === 0 || selectedLvls.includes(houseLevel))
                    && (selectedStars.length === 0 || selectedStars.includes(starValue))
                    && passItems;

                row.classList.toggle('hidden', !pass);
            });
        };

        filter_container._mhoDestroyDropdowns = dropdownDestroyers;
        main_content.insertBefore(filter_container, table);

    } else if (filter_container) {
        filter_container._mhoDestroyDropdowns?.forEach((destroy) => destroy());
        filter_container.remove();
    }
}
