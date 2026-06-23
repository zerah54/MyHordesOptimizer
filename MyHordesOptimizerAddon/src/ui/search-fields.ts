import {
    mh_optimizer_icon,
    mho_filter_citizen_list_id,
    mho_filter_omniscience_id,
    mho_search_building_field_id,
    mho_search_dump_field_id,
    mho_search_recipient_field_id,
    mho_search_registry_field_id
} from '../config/constants';
import {params_categories} from '../data/params';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {createCheckboxDropdown, createSingleFilterSelect} from '../utils/dom';
import {getI18N} from '../utils/i18n';
import {normalizeString} from '../utils/notifications';
import {pageIsCitizens, pageIsConstructions, pageIsDump, pageIsMsgReceived, pageIsOmniscience} from '../utils/page';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);


export function displaySearchFields() {
    if (state.mho_parameters.display_search_fields) {
        displaySearchFieldOnBuildings();
        displaySearchFieldOnRecipientList();
        displaySearchFieldOnRegistry();
        displaySearchFieldOnDump();
        hideCompletedBuildings();
        displayFiltersOnOmniscience();
        displayFiltersOnCitizenList();
    }
}

/** Si l'option associée est activée, masque les chantiers complétés sur la page de chantiers */

export function hideCompletedBuildings() {

    let hideBuildings = (buildings) => {
        let building_rows = [];
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
    }

    let showBuildings = (buildings) => {
        buildings?.forEach((building) => {
            if (building.classList.contains('mho-hidden')) {
                building.classList.remove('mho-hidden');
            }
            arrFrom(building.querySelectorAll('.building.mho-hidden')).forEach((buildingRow) => {
                buildingRow.classList.remove('mho-hidden');
            });
        });
    }

    let observeBuildings = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    let buildings = arrFrom(document.querySelectorAll('.buildings') || []);
                    if (buildings.length > 0) {
                        hideBuildings(buildings);
                        observer.disconnect();
                    }
                }
            });
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    if (pageIsConstructions()) {
        let buildings = arrFrom(document.querySelectorAll('.buildings') || []);
        if (state.mho_parameters.hide_completed_buildings_field) {
            if (buildings.length > 0) {
                hideBuildings(buildings);
            } else {
                observeBuildings();
            }
        } else {
            showBuildings(buildings);
        }
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */

export function displaySearchFieldOnBuildings() {
    let fields_container = document.getElementById(mho_search_building_field_id);
    let searchFieldAdded = false; // Indicateur pour suivre l'ajout du champ de recherche


    let addSearchField = (tabs) => {
        if (searchFieldAdded) return; // Vérifie si le champ de recherche a déjà été ajouté

        let tabs_block = tabs.parentElement;

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

        let search_field_div = document.createElement('div');
        search_field_div.style.display = 'flex';
        search_field_div.style.alignItems = 'center';
        fields_container.appendChild(search_field_div);
        if (!state.mho_parameters.display_search_field_buildings) {
            search_field_div.classList.add('hidden');
        }

        let header_mho_img = document.createElement('img');
        header_mho_img.src = mh_optimizer_icon;
        header_mho_img.style.height = '24px';
        header_mho_img.style.position = 'absolute';
        search_field_div.appendChild(header_mho_img);

        let search_field = document.createElement('input');
        search_field.type = 'text';
        search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_buildings').label);
        search_field.classList.add('mho-input', 'inline');
        search_field.setAttribute('style', 'min-width: 200px; padding-left: 24px;');
        search_field_div.appendChild(search_field);

        let buildings = arrFrom(document.querySelectorAll('.buildings') || []);

        let filterBuildings = () => {
            let building_rows = [];
            buildings.forEach((building) => {
                building_rows.push(...arrFrom(building.querySelectorAll('.building')));
            });
            building_rows.forEach((building_row) => {
                let force_hide = state.mho_parameters.hide_completed_buildings_field && building_row.classList.contains('complete');

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
    }

    let observeTabs = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    let tabs = document.querySelector('ul.buildings-tabs');
                    if (tabs) {
                        addSearchField(tabs);
                        observer.disconnect();
                    }
                }
            });
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    if (state.mho_parameters.display_search_field_buildings && pageIsConstructions()) {
        if (fields_container) return;

        let tabs = document.querySelector('ul.buildings-tabs');
        if (tabs) {
            addSearchField(tabs);
        } else {
            observeTabs();
        }
    } else if (fields_container) {
        fields_container.remove();
    }
}

/** Si l'option associée est activée, affiche un champ de recherche sur la liste des destinataires d'un message */

export function displaySearchFieldOnRecipientList() {
    let search_field = document.getElementById(mho_search_recipient_field_id);
    if (state.mho_parameters.display_search_field_recipients && pageIsMsgReceived()) {
        if (search_field) return;

        let recipients = document.querySelector('#recipient_list');
        if (recipients) {
            let search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_recipient_field_id;
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_recipients').label);
            search_field.classList.add('mho-input', 'inline');
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            search_field.addEventListener('keyup', (event) => {
                let recipients_list = arrFrom(document.querySelectorAll('.recipient.link') || []);
                recipients_list.forEach((recipient) => {
                    if (normalizeString(recipient.innerText).indexOf(normalizeString(search_field.value)) > -1) {
                        recipient.classList.remove('hidden');
                    } else {
                        recipient.classList.add('hidden');
                    }
                });
            });

            search_field_container.appendChild(search_field);

            let header_mho_img = document.createElement('img');
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

        let main_content = document.querySelector('.town-main-content');
        if (main_content) {
            let table = main_content.querySelector('.row-table');
            if (table) {
                let filterFunction = (name_search_field, can_be_dump_field, can_be_recovered_field) => {
                    let items_list = arrFrom(table.querySelectorAll('div.row-flex') || []);
                    items_list.forEach((item) => {
                        let item_label = item.querySelector('div.item-line img');
                        let item_counts = item.children.item(1).querySelectorAll('div');
                        let item_bank_count = +item_counts[0].innerText.replace(/\D*/, '');
                        let item_dump_count = +item_counts[1].innerText.replace(/\D*/, '');

                        let is_search_in_string = normalizeString(item_label.getAttribute('alt')).indexOf(normalizeString(name_search_field.value)) > -1;
                        let can_be_recovered = can_be_recovered_field.checked && item_dump_count > 0;
                        let can_be_dump = can_be_dump_field.checked && item_bank_count > 0;

                        if (is_search_in_string && (can_be_dump || can_be_recovered)) {
                            item.classList.remove('hidden');
                        } else {
                            item.classList.add('hidden');
                        }
                    });
                }

                let search_field_container = document.createElement('div');
                search_field_container.setAttribute('style', ' display: flex; flex-wrap: wrap; gap: 0.5em;');
                search_field_container.id = mho_search_dump_field_id;

                search_field = document.createElement('input');
                search_field.type = 'text';
                search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_dump').label);
                search_field.classList.add('mho-input', 'inline');
                search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

                search_field_container.appendChild(search_field);

                let can_be_dumped = document.createElement('div');
                search_field_container.appendChild(can_be_dumped);

                let can_be_dumped_input = document.createElement('input');
                can_be_dumped_input.type = 'checkbox';
                can_be_dumped_input.id = 'can_be_dumped';
                can_be_dumped_input.checked = true;
                can_be_dumped_input.classList.add('mho-input');
                can_be_dumped.appendChild(can_be_dumped_input);

                let can_be_dumped_label = document.createElement('label');
                can_be_dumped_label.innerText = getI18N(texts.can_be_dumped);
                can_be_dumped_label.htmlFor = 'can_be_dumped';
                can_be_dumped.appendChild(can_be_dumped_label);

                let can_be_recovered = document.createElement('div');
                search_field_container.appendChild(can_be_recovered);

                let can_be_recovered_input = document.createElement('input');
                can_be_recovered_input.type = 'checkbox';
                can_be_recovered_input.id = 'can_be_recovered';
                can_be_recovered_input.checked = true;
                can_be_recovered_input.classList.add('mho-input');
                can_be_recovered.appendChild(can_be_recovered_input);

                let can_be_recovered_label = document.createElement('label');
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

                let header_mho_img = document.createElement('img');
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

export function displaySearchFieldOnRegistry() {
    let search_field = document.getElementById(mho_search_registry_field_id);
    if (state.mho_parameters.display_search_field_registry) {

        if (search_field) return;

        let logs = document.querySelector('hordes-log');

        if (logs) {
            let search_field_container = document.createElement('div');
            let logs_title = logs.parentElement.previousElementSibling;

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_registry_field_id;
            search_field.classList.add('mho-input');
            search_field.placeholder = getI18N(params_categories.find((category) => category.id === 'display').params.find((param) => param.id === 'sort_and_filter').children.find((param) => param.id === 'display_search_fields').children.find((child) => child.id === 'display_search_field_registry').label);
            search_field.setAttribute('style', 'padding-left: 24px; margin-bottom: 0.25em;');

            search_field_container.appendChild(search_field);

            let header_mho_img = document.createElement('img');
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


                    let first_link = logs_title.querySelector('a');
                    if (first_link) {
                        first_link.style.marginLeft = 'auto';
                    }

                    header_mho_img.style.left = (0) as any;
                } else {
                    search_field_container.style.display = 'flex';
                    search_field_container.style.justifyContent = 'center';

                    header_mho_img.style.left = '4px';
                }

                logs_title.appendChild(search_field_container)


                search_field.addEventListener('keyup', (event) => {
                    let logs_list = arrFrom(document.querySelectorAll('.log-entry .log-part-content') || []);
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

export function displayMinApOnBuildings(count = 0) {
    state.tooltips_observer?.disconnect();
    if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
        let complete_buildings = document.querySelectorAll('.building.complete');
        if ((!complete_buildings || complete_buildings.length === 0) && count < 10) {
            setTimeout(() => {
                displayMinApOnBuildings(count + 1);
            }, 100);
            return;
        }

        ///////////////////////// Observe les modifications sur les tooltips pour mieux alimenter les barres /////////////////////////
        // Selectionne le noeud dont les mutations seront observées
        let tooltip_container = document.querySelector('#tooltip_container');
        // Options de l'observateur (quelles sont les mutations à observer)
        let config = {childList: true, subtree: true};

        // Fonction callback à éxécuter quand une mutation est observée
        let callback = function (mutationsList) {
            if (state.mho_parameters.display_missing_ap_for_buildings_to_be_safe && pageIsConstructions()) {
                let broken_buildings = arrFrom(complete_buildings).filter((complete_building) => complete_building.querySelector('.to_repair'));

                if (!broken_buildings || broken_buildings.length === 0) return;

                broken_buildings.forEach((broken_building) => {
                    let bar_element = broken_building.querySelector('.ap-bar');
                    let to_repair_element = broken_building.querySelector('.to_repair');
                    let nb_ap_element = broken_building.querySelector('.build-req');

                    to_repair_element.dispatchEvent(new Event('mouseenter'));
                    let tooltip: any = document.querySelector('.tooltip:not(.mho)[style*="display: block"]');
                    to_repair_element.dispatchEvent(new Event('mouseleave'));
                    if (!tooltip || !tooltip.innerHTML) return;

                    let tooltip_status_match = tooltip.innerText.match(/[0-9]+\/[0-9]+/);
                    if (!tooltip_status_match || tooltip_status_match.length <= 0) return;
                    let building_status = tooltip_status_match[0]?.split('/');

                    let tooltip_match = tooltip.innerHTML.match(/[0-9]+/g);
                    if (!tooltip_match || tooltip_match.length <= 0) return;

                    let nb_pts_per_ap = parseInt(tooltip_match[tooltip_match.length - 1].match(/[0-9]+/)[0], 10);
                    let current_pv = parseInt(building_status[0], 10);
                    let total_pv = parseInt(building_status[1], 10);

                    let minimum_safe = Math.ceil(total_pv * 70 / 100) + 1
                    if (minimum_safe <= current_pv) return;

                    let missing_pts = minimum_safe - current_pv;

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
                        missing_ap_info = document.createElement('span')
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


    } else if (pageIsConstructions()) {
        let missing_ap_infos = document.querySelectorAll('.mho-missing-ap');
        if (!missing_ap_infos) return;
        arrFrom(missing_ap_infos).forEach((missing_ap_info) => missing_ap_info.remove())

        let mho_safe_aps = document.querySelectorAll('.mho-safe-ap');
        if (!mho_safe_aps) return;
        arrFrom(mho_safe_aps).forEach((mho_safe_ap) => mho_safe_ap.remove());
    }
}

/** Si l'option associée est activée, affiche des filtres sur la liste des citoyens */
function displayFiltersOnCitizenList() {
    let filter_container = document.getElementById(mho_filter_citizen_list_id);

    if (state.mho_parameters.display_filters_citizen_list && pageIsCitizens()) {
        if (filter_container) return;

        let main_content = document.querySelector('.town-main-content');
        if (!main_content) return;

        let table = main_content.querySelector('.row-table');
        if (!table) return;

        let rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));

        let professions = new Map();
        let houseLevels = new Map();

        rows.forEach((row) => {
            let profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
            if (profImg) professions.set(profImg.getAttribute('alt'), profImg.src);

            let defenseLabel = row.querySelector('.citizen-defense');
            let houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
            if (houseImg) houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);
        });

        filter_container = document.createElement('div');
        filter_container.id = mho_filter_citizen_list_id;
        filter_container.classList.add('mho-filter-bar');

        let dropdownDestroyers = [];
        let applyFilters = () => {
        };
        let triggerFilters = () => applyFilters();

        // Recherche par nom
        let nameWrapper = document.createElement('div');
        nameWrapper.classList.add('mho-search-wrapper');

        let nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = getI18N(texts.filter_search_name);
        nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
        nameWrapper.appendChild(nameInput);

        let iconImg = document.createElement('img');
        iconImg.src = mh_optimizer_icon;
        iconImg.classList.add('mho-search-icon');
        nameWrapper.appendChild(iconImg);

        filter_container.appendChild(nameWrapper);
        nameInput.addEventListener('keyup', triggerFilters);

        // Select : statut de connexion
        let {container: onlineCtnr, select: onlineSelect} = createSingleFilterSelect(
            getI18N(texts.filter_online_label),
            `${mho_filter_citizen_list_id}-online`,
            [
                {value: 'all', text: getI18N(texts.filter_all)},
                {value: 'online', text: getI18N(texts.filter_online_online)},
                {value: 'offline', text: getI18N(texts.filter_online_offline)}
            ]
        );
        filter_container.appendChild(onlineCtnr);
        onlineSelect.addEventListener('change', triggerFilters);

        // Volet : profession
        let {
            container: profCtnr,
            getSelectedValues: getSelectedProfessions,
            destroy: destroyProfDropdown
        } = createCheckboxDropdown(
            getI18N(texts.job),
            `${mho_filter_citizen_list_id}-profession`,
            Array.from(professions.entries()).map(([alt, src]) => ({value: alt, text: alt, icon: src})),
            triggerFilters
        );
        filter_container.appendChild(profCtnr);
        dropdownDestroyers.push(destroyProfDropdown);

        // Volet : niveau de maison
        let {
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
        let {container: locationCtnr, select: locationSelect} = createSingleFilterSelect(
            getI18N(texts.filter_location_label),
            `${mho_filter_citizen_list_id}-location`,
            [
                {value: 'all', text: getI18N(texts.filter_all)},
                {value: 'outside', text: getI18N(texts.filter_location_outside)},
                {value: 'inside', text: getI18N(texts.filter_location_inside)}
            ]
        );
        filter_container.appendChild(locationCtnr);
        locationSelect.addEventListener('change', triggerFilters);

        applyFilters = () => {
            let nameVal = normalizeString(nameInput.value);
            let onlineVal = onlineSelect.value;
            let locationVal = locationSelect.value;
            let selectedProfs = getSelectedProfessions();
            let selectedLvls = getSelectedHouseLevels();

            rows.forEach((row) => {
                let nameEl = row.querySelector('.userCell a.username');
                let rowName = normalizeString(nameEl?.innerText.trim() ?? '');

                let statusEl = row.querySelector('.citizen-online, .citizen-offline');
                let connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                    : statusEl?.classList.contains('citizen-offline') ? 'offline'
                        : null;

                let locEl = row.querySelector('.citizen-box.location');
                let isOutside = locEl ? /\[/.test(locEl.innerText) : false;

                let profImg = row.querySelector('.userCell img[alt]:not([alt=""])');
                let prof = profImg?.getAttribute('alt') ?? '';

                let defenseLabel = row.querySelector('.citizen-defense');
                let houseImg = defenseLabel?.closest('.citizen-box')?.querySelector('img[alt]');
                let houseLevel = houseImg?.getAttribute('alt') ?? '';

                let pass = (nameVal === '' || rowName.includes(nameVal))
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

        let main_content = document.querySelector('.town-main-content');
        if (!main_content) return;

        let table = main_content.querySelector('.row-table');
        if (!table) return;

        let rows = Array.from(table.querySelectorAll('div.row-flex:not(.header)'));

        let professions = new Map();
        let houseLevels = new Map();
        let starCounts = new Set();
        let chestItems = new Map();
        let hasEmptyChest = false;

        rows.forEach((row) => {
            let profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
            if (profImg) professions.set(profImg.getAttribute('alt'), profImg.src);

            let houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
            if (houseImg) houseLevels.set(houseImg.getAttribute('alt'), houseImg.src);

            let isDead = row.querySelector('.citizen-dead') !== null;
            if (!isDead) {
                let starsCell = row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                starCounts.add(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);
            }

            let itemImgs = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])'));
            if (itemImgs.length === 0) {
                hasEmptyChest = true;
            } else {
                itemImgs.forEach((img) => {
                    let alt = img.getAttribute('alt');
                    if (!chestItems.has(alt)) chestItems.set(alt, img.src);
                });
            }
        });

        filter_container = document.createElement('div');
        filter_container.id = mho_filter_omniscience_id;
        filter_container.classList.add('mho-filter-bar');

        let dropdownDestroyers = [];
        let applyFilters = () => {
        };
        let triggerFilters = () => applyFilters();

        // Recherche par nom
        let nameWrapper = document.createElement('div');
        nameWrapper.classList.add('mho-search-wrapper');

        let nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = getI18N(texts.filter_search_name);
        nameInput.classList.add('mho-input', 'inline', 'mho-search-input');
        nameWrapper.appendChild(nameInput);

        let iconImg = document.createElement('img');
        iconImg.src = mh_optimizer_icon;
        iconImg.classList.add('mho-search-icon');
        nameWrapper.appendChild(iconImg);

        filter_container.appendChild(nameWrapper);
        nameInput.addEventListener('keyup', triggerFilters);

        // Select : statut de connexion
        let {container: onlineCtnr, select: onlineSelect} = createSingleFilterSelect(
            getI18N(texts.filter_online_label),
            `${mho_filter_omniscience_id}-online`,
            [
                {value: 'all', text: getI18N(texts.filter_all)},
                {value: 'online', text: getI18N(texts.filter_online_online)},
                {value: 'offline', text: getI18N(texts.filter_online_offline)}
            ]
        );
        filter_container.appendChild(onlineCtnr);
        onlineSelect.addEventListener('change', triggerFilters);

        // Volet : niveau de maison
        let {
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
        let {
            container: profCtnr,
            getSelectedValues: getSelectedProfessions,
            destroy: destroyProfDropdown
        } = createCheckboxDropdown(
            getI18N(texts.job),
            `${mho_filter_omniscience_id}-profession`,
            Array.from(professions.entries()).map(([alt, src]) => ({value: alt, text: alt, icon: src})),
            triggerFilters
        );
        filter_container.appendChild(profCtnr);
        dropdownDestroyers.push(destroyProfDropdown);

        // Volet : objets en coffre
        let itemOptions = [];
        if (hasEmptyChest) itemOptions.push({value: '__empty__', text: '—'});
        chestItems.forEach((src, alt) => itemOptions.push({value: alt, text: alt, icon: src}));

        let {
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
        let {
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
            let nameVal = normalizeString(nameInput.value);
            let onlineVal = onlineSelect.value;
            let selectedProfs = getSelectedProfessions();
            let selectedLvls = getSelectedHouseLevels();
            let selectedStars = getSelectedStars();
            let selectedItems = getSelectedItems();
            let filterEmpty = selectedItems.includes('__empty__');
            let itemFilter = selectedItems.filter((value) => value !== '__empty__');

            rows.forEach((row) => {
                let nameEl = row.querySelector('.citizen-box-name a.username, .citizen-box-name-me a.username');
                let rowName = normalizeString(nameEl?.innerText.trim() ?? '');

                let statusEl = row.querySelector('.citizen-online, .citizen-offline, .citizen-dead');
                let isDead = statusEl?.classList.contains('citizen-dead') ?? false;
                let connectionStatus = statusEl?.classList.contains('citizen-online') ? 'online'
                    : statusEl?.classList.contains('citizen-offline') ? 'offline'
                        : null;

                let profImg = row.querySelector('.citizen-box-name img[alt]:not([alt=""]), .citizen-box-name-me img[alt]:not([alt=""])');
                let prof = profImg?.getAttribute('alt') ?? '';

                let houseImg = row.querySelector('.cell.factor-0.content-center-vertical img[alt]');
                let houseLevel = houseImg?.getAttribute('alt') ?? '';

                let starsCell = isDead ? null : row.querySelector('.cell.rw-3:not(.rw-md-2).citizen-box');
                let starValue = isDead ? '__dead__' : String(starsCell ? starsCell.querySelectorAll('img[alt="*"]').length : 0);

                let rowItems = Array.from(row.querySelectorAll('.inventory .item-icon img[alt]:not([alt=""])')).map((img) => img.getAttribute('alt'));
                let chestEmpty = rowItems.length === 0;

                let passItems = selectedItems.length === 0
                    || (filterEmpty && chestEmpty)
                    || itemFilter.some((item) => rowItems.includes(item));

                let pass = (nameVal === '' || rowName.includes(nameVal))
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
