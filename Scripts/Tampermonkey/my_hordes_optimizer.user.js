// ==UserScript==
// @name         MyHordes Optimizer
// @version      1.0.0-alpha.8
// @description  Optimizer for MyHordes
// @author       Zerah
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @homepageURL  https://myhordes-optimizer.web.app/script
// @supportURL   lenoune38@gmail.com
//
// @connect      https://myhordesoptimizerapi.azurewebsites.net/
// @connect      *
//
// @match        https://zombvival.de/myhordes/*
// @match        https://myhordes.de/*
// @match        https://myhordes.eu/*
// @match        https://myhord.es/*
//
// @match        https://bbh.fred26.fr/*
// @match        https://gest-hordes2.eragaming.fr/*
// @match        https://fatamorgana.md26.eu/*
//
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const lang = document.documentElement.lang;

const gm_bbh_updated_key = 'bbh_updated';
const gm_gh_updated_key = 'gh_updated';
const gm_fata_updated_key = 'fata_updated';
const gm_mh_external_app_id_key = 'mh_external_app_id';
const gm_parameters_key = 'mh_optimizer_parameters';
const mh_user_key = 'mh_user';

let mho_parameters = GM_getValue(gm_parameters_key);
let external_app_id = GM_getValue(gm_mh_external_app_id_key);
let mh_user = GM_getValue(mh_user_key);


////////////////////
// L'URL de L'API //
////////////////////

const api_url = 'https://myhordesoptimizerapi.azurewebsites.net/';

///////////////////////////////////////////
// Listes de constantes / Constants list //
///////////////////////////////////////////

const hordes_img_url = '/build/images/';
const repo_img_url = 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/hordes_img/';

const mh_optimizer_icon = repo_img_url + 'icons/small_archive.gif';

const mho_title = 'MH Optimizer';
const mh_optimizer_window_id = 'optimizer-window';
const btn_id = 'optimizer-btn';
const mh_header_id = 'header-reload-area';
const mh_update_external_tools_id = 'mh-update-external-tools';
const wiki_btn_id = 'wiki-btn-id';

const texts = {
    save_external_app_id: {
        en: `TODO`,
        fr: `Enregistrez votre ID d'app externe`,
        de: `TODO`,
        es: `TODO`
    },
    external_app_id_help: {
        en: `TODO`,
        fr: `Vous devez renseigner votre ID externe pour les apps.<br />Celle-ci se trouve dans "Votre âme" > "Réglages" > "Avancés" > "Applications externes"`,
        de: `TODO`,
        es: `TODO`
    },
    external_app_id_help_label: {
        en: `Help`,
        fr: `Aide`,
        de: `Hilfe`,
        es: `Guía`
    },
    tools_btn_label: {
        en: `Tools`,
        fr: `Outils`,
        de: `Werkzeugen`,
        es: `Herramientas`
    },
    parameters_section_label: {
        en: `Parameters`,
        fr: `Paramètres`,
        de: `TODO`,
        es: `TODO`
    },
    informations_section_label: {
        en: `Informations`,
        fr: `Informations`,
        de: `TODO`,
        es: `TODO`
    },
    update_external_tools_needed_btn_label: {
        en: `Update external tools`,
        fr: `Mettre à jour les outils externes`,
        de: `TODO`,
        es: `TODO`
    },
    update_external_tools_pending_btn_label: {
        en: `TODO`,
        fr: `Mise à jour en cours...`,
        de: `TODO`,
        es: `TODO`
    },
    update_external_tools_success_btn_label: {
        en: `TODO`,
        fr: `Mise à jour terminée !`,
        de: `TODO`,
        es: `TODO`
    },
    update_external_tools_errors_btn_label: {
        en: `TODO`,
        fr: `Mise à jour terminée avec des erreurs.`,
        de: `TODO`,
        es: `TODO`
    },
    update_external_tools_fail_btn_label: {
        en: `TODO`,
        fr: `Impossible de mettre à jour.`,
        de: `TODO`,
        es: `TODO`
    },
    prevent_from_leaving_information: {
        en: `TODO`,
        fr: `Vous avez demandé à être prévenu avant de quitter la page si vous n'êtes pas en attente d'escorte.`,
        de: `TODO`,
        es: `TODO`
    },
    save: {
        en: `Save`,
        fr: `Enregistrer`,
        de: `TODO`,
        es: `TODO`
    },
    update: {
        en: `Update`,
        fr: `Mettre à jour`,
        de: `TODO`,
        es: `TODO`
    }
};

const categories_mapping = {
    armor : {
        img : '',
        label : {
            de : 'Verteidigung',
            en : 'Defences',
            es : 'Defensas',
            fr : 'Défenses'
        },
        ordering : 4
    },
    box : {
        img : '',
        label : {
            de : 'Taschen und Behälter',
            en : 'Containers and boxes',
            es : 'Contenedores y cajas',
            fr : 'Conteneurs et boîtes'
        },
        ordering : 3
    },
    drug : {
        img : '',
        label : {
            de : 'Apotheke und Labor',
            en : 'Pharmacy',
            es : 'Farmacia',
            fr : 'Pharmacie'
        },
        ordering : 5
    },
    food : {
        img : '',
        label : {
            de : 'Grundnahrungsmittel',
            en : 'Food',
            es : 'Provisiones',
            fr : 'Provisions'
        },
        ordering : 6
    },
    furniture : {
        img : '',
        label : {
            de : 'Einrichtungen',
            en : 'Facilities',
            es : 'Objetos caseros',
            fr : 'Aménagements'
        },
        ordering : 1
    },
    misc : {
        img : '',
        label : {
            de : 'Sonstiges',
            en : 'Miscellaneous',
            es : 'Otros',
            fr : 'Divers'
        },
        ordering : 7
    },
    rsc : {
        img : '',
        label : {
            de : 'Baustoffe',
            en : 'Resources',
            es : 'Recursos',
            fr : 'Ressources'
        },
        ordering : 0
    },
    weapon : {
        img : '',
        label : {
            de : 'Waffenarsenal',
            en : 'Armoury',
            es : 'Armería',
            fr : 'Armurerie'
        },
        ordering : 2
    }
}

const action_types = [
    {id: 'Manual', label: {en: 'Citizen actions', fr: 'Actions du citoyen', de: '', es: ''}, ordering: 1},
    {id: 'Workshop', label: {en: 'Workshop', fr: 'Atelier', de: '', es: ''}, ordering: 0},
];

const wishlist_priorities = [
    {value: 0, label: {en: 'Not defined', fr: 'Non définie', es: '', de: ''}},
    {value: 10, label: {en: 'Low', fr: 'Basse', es: '', de: ''}},
    {value: 20, label: {en: 'Medium', fr: 'Moyenne', es: '', de: ''}},
    {value: 30, label: {en: 'High', fr: 'Haute', es: '', de: ''}},
];

const wishlist_headers = [
    {label: {en: 'Item', fr: 'Objet', es: '', de: ''}, id: 'label'},
    {label: {en: 'Prioriry', fr: 'Priorité', es: '', de: ''}, id: 'priority'},
    {label: {en: '', fr: 'Stock en banque', es: '', de: ''}, id: 'bank_count'},
    {label: {en: '', fr: 'Stock souhaité', es: '', de: ''}, id: 'bank_needed'},
    {label: {en: '', fr: 'Quantité manquante', es: '', de: ''}, id: 'diff'},
    {label: {en: '', fr: '', es: '', de: ''}, id: 'delete'},
];


//////////////////////////////////
// La liste des onglets du wiki //
//////////////////////////////////

let tabs_list = {
    wiki: [
        {
            ordering: 0,
            id: 'items',
            label: {en: 'Items', fr: 'Objets', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + 'emotes/bag.gif'
        },
        {
            ordering: 1,
            id: 'recipes',
            label: {en: 'Recipes', fr: 'Recettes', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + 'building/small_refine.gif'
        },
        {
            ordering: 2,
            id: 'skills',
            label: {en: 'Hero Skills', fr: 'Pouvoirs', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + '/professions/hero.gif'
        }
    ],
    tools: [
        {
            ordering: 0,
            id: 'bank',
            label: {en: 'Bank', fr: 'Banque', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + 'icons/home.gif'
        },
        {
            ordering: 1,
            id: 'wishlist',
            label: {en: 'Wishlist', fr: 'Liste de courses', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + 'item/item_cart.gif'
        },
        {
            ordering: 2,
            id: 'citizens',
            label: {en: 'Citizens', fr: 'Citoyens', de: 'TODO', es: 'TODO'},
            icon: repo_img_url + 'icons/small_human.gif'
        }
    ]
};

//////////////////////////////////////////////
// La liste des paramètres de l'application //
//////////////////////////////////////////////
let params = [
    {id: 'update_bbh', label: {en: 'TODO', fr: `Mettre à jour BigBroth'Hordes`, de: 'TODO', es: 'TODO'}},
    {id: 'update_gh', label: {en: 'TODO', fr: `Mettre à jour Gest'Hordes`, de: 'TODO', es: 'TODO'}},
    {id: 'update_fata', label: {en: 'TODO', fr: `Mettre à jour Fata Morgana`, de: 'TODO', es: 'TODO'}},
    {id: 'enhanced_tooltips', label: {en: 'TODO', fr: `Afficher des tooltips détaillés`, de: 'TODO', es: 'TODO'}},
    {id: 'click_on_voted', label: {en: 'TODO', fr: `Navigation rapide vers le chantier recommandé`, de: 'TODO', es: 'TODO'}},
    {id: 'prevent_from_leaving', label: {en: 'TODO', fr: `Demander confirmation avant de quitter en l'absence d'escorte automatique`, de: 'TODO', es: 'TODO'}},
    {id: 'display_wishlist', label: {en: 'TODO', fr: `Afficher la liste de courses dans l'interface`, de: 'TODO', es: 'TODO'}}
];

let informations = [
    {id: 'website', label: {en: `Website`, fr: `Site web`, de: 'TODO', es: 'TODO'}, src: 'https://myhordes-optimizer.web.app/'},
];

//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

let items;
let recipes;
let citizens;
let hero_skills;
let bank;
let wishlist;

/////////////////////////////////////////
// Fonctions utiles / Useful functions //
/////////////////////////////////////////

/** @return {string}     website language */
function getWebsiteLanguage() {
    return document.getElementsByTagName('html')[0].attributes.lang.value;
}

/** @return {boolean}     true if button exists */
function buttonOptimizerExists() {
    return document.getElementById(btn_id);
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la ville */
function pageIsTown() {
    return document.URL.indexOf('town') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de l'atelier */
function pageIsWorkshop() {
    return document.URL.endsWith('workshop');
}


/** @return {boolean}    true si la page de l'utilisateur est la page des chantiers */
function pageIsConstructions() {
    return document.URL.endsWith('constructions');
}

/** @return {boolean}    true si la page de l'utilisateur est la page du désert */
function pageIsDesert() {
    return document.URL.indexOf('desert') > -1;
}

/** Affiche la page de chargement de MyHordes */
function startLoading() {
    let loadzone = document.getElementById('loadzone');
    loadzone.setAttribute('x-stack', 1);
}

/** Masque la page de chargement de MyHordes */
function endLoading() {
    let loadzone = document.getElementById('loadzone');
    loadzone.setAttribute('x-stack', 0);
}

/**
* TODO Supprimer une fois les données remontées proprement de la base
* @param {string} category
* @return la catégorie complète associé au string passé en paramètre
*/
function getCategory(category) {
    return categories_mapping[category.toLowerCase()];
}

/** Create Optimize button */
function createOptimizerBtn() {
    setTimeout(() => {
        let header_zone = document.getElementById(mh_header_id);
        let last_header_child = header_zone.lastChild;
        let left_position = last_header_child ? last_header_child.offsetLeft + last_header_child.offsetWidth + 5 : 43;

        let img = document.createElement('img');
        img.src = mh_optimizer_icon;

        let title_hidden = document.createElement('span');
        title_hidden.innerHTML = mho_title;

        let title = document.createElement('h1');
        title.appendChild(img);
        title.appendChild(title_hidden);

        let optimizer_btn = document.createElement('div');
        optimizer_btn.appendChild(title);
        optimizer_btn.id = btn_id;
        optimizer_btn.setAttribute('style', 'left: ' + left_position + 'px');
        optimizer_btn.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        header_zone.appendChild(optimizer_btn);

        createOptimizerButtonContent()
    }, 2000);

}

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */
function createOptimizerButtonContent() {
    let optimizer_btn = document.getElementById(btn_id);
    let content = document.createElement('div');
    content.innerHTML = '';

    if (external_app_id && external_app_id !== '') {
        /////////////////////
        // SECTION BOUTONS //
        /////////////////////
        let wiki_btn = document.createElement('a');
        wiki_btn.classList.add('button');
        wiki_btn.innerHTML = 'Wiki';
        wiki_btn.id = wiki_btn_id;
        if (!items) {
            wiki_btn.classList.add('hidden');
        }
        wiki_btn.addEventListener('click', () => {
            displayWindow('wiki');
        });

        content.appendChild(wiki_btn);

        let tools_btn = document.createElement('a');
        tools_btn.classList.add('button');
        tools_btn.innerHTML = texts.tools_btn_label[lang];
        tools_btn.addEventListener('click', () => {
            displayWindow('tools');
        });

        content.appendChild(tools_btn);

        ////////////////////////
        // SECTION PARAMETRES //
        ////////////////////////
        let params_title = document.createElement('h1');
        params_title.innerText = texts.parameters_section_label[lang];

        let params_list = document.createElement('ul');

        let params_container = document.createElement('div');
        params_container.id = 'parameters';

        params_container.appendChild(params_title);
        params_container.appendChild(params_list);


        params.forEach((param) => {
            let param_input = document.createElement('input');
            param_input.setAttribute('type', 'checkbox');
            param_input.id = param.id;
            param_input.checked = mho_parameters && mho_parameters[param.id] ? mho_parameters[param.id] : false;

            let param_label = document.createElement('label');
            param_label.htmlFor = param.id;
            param_label.innerText = param.label[lang];

            param_input.addEventListener('change', (event) => {
                let new_params;
                if (!mho_parameters) {
                    new_params = {};
                } else {
                    new_params = mho_parameters;
                }
                new_params[param.id] = event.target.checked;
                GM_setValue(gm_parameters_key, new_params);
                mho_parameters = GM_getValue(gm_parameters_key);
            });

            let param_container = document.createElement('li');
            param_container.appendChild(param_input);
            param_container.appendChild(param_label);

            params_list.appendChild(param_container);
        });

        content.appendChild(params_container);

        //////////////////////////
        // SECTION INFORMATIONS //
        //////////////////////////

        let informations_title = document.createElement('h1');
        informations_title.innerText = texts.informations_section_label[lang];

        let informations_list = document.createElement('ul');

        let infomations_container = document.createElement('div');
        infomations_container.id = 'informations';

        infomations_container.appendChild(informations_title);
        infomations_container.appendChild(informations_list);

        informations.forEach((information) => {
            let information_link = document.createElement('a');
            information_link.id = information.id;
            information_link.innerText = information.label[lang];
            information_link.href = information.src;

            information_link.addEventListener('click', (event) => {

            });

            let information_container = document.createElement('li');
            information_container.appendChild(information_link);

            informations_list.appendChild(information_container);
        });

        content.appendChild(infomations_container);

    } else {
        let help_button = createHelpButton();
        content.appendChild(help_button);

        let keytext = document.createElement('input');
        keytext.setAttribute('type', 'text');

        let keysend = document.createElement('a');
        keysend.classList.add('button');
        keysend.innerHTML = texts.save_external_app_id[lang];
        keysend.addEventListener('click', () => {
            GM_setValue(gm_mh_external_app_id_key, keytext.value);
            external_app_id = GM_getValue(gm_mh_external_app_id_key);
            if (!items) {
                getItems();
            }
            content.innerHTML = '';
            createOptimizerButtonContent();
        });

        content.appendChild(keytext);
        content.appendChild(keysend);
    }
    optimizer_btn.appendChild(content);
}

/** Crée la fenêtre de wiki */
function createWindow() {
    let window_content = document.createElement('div');
    window_content.id = mh_optimizer_window_id + '-content';

    let window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_url + 'icons/b_close.png';
    let window_overlay_li = document.createElement('li');
    window_overlay_li.appendChild(window_overlay_img);
    let window_overlay_ul = document.createElement('ul');
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_window_id + '-overlay';
    window_overlay.appendChild(window_overlay_ul);

    let window_box = document.createElement('div');
    window_box.id = mh_optimizer_window_id + '-box';
    window_box.appendChild(window_content);
    window_box.appendChild(window_overlay);

    let post_office = document.getElementById('post-office');

    let window = document.createElement('div');
    window.id = mh_optimizer_window_id;
    window.appendChild(window_box);
    post_office.parentNode.insertBefore(window, post_office.nextSibling);

    window_overlay_li.addEventListener('click', () => {
        window.classList.remove('visible');
        let body = document.getElementsByTagName('body')[0];
        body.removeAttribute('style', 'overflow: hidden');
    });
}

/**
* Crée la liste des onglets de la page de wiki
* @param {string} window_type
*/
function createTabs(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');
    window_content.innerHTML = '';

    let tabs_ul = document.createElement('ul')

    let current_tabs_list = tabs_list[window_type].sort((a, b) => a.ordering > b.ordering);
    current_tabs_list.forEach((tab, index) => {
        let tab_link = document.createElement('div');

        if (tab.icon) {
            let tab_icon = document.createElement('img');
            tab_icon.src = tab.icon;
            tab_link.appendChild(tab_icon);
        }

        let tab_text = document.createTextNode(tab.label[lang]);
        tab_link.appendChild(tab_text);

        let tab_li = document.createElement('li');
        tab_li.appendChild(tab_link);

        if (index === 0) {
            tab_li.classList.add('selected');
            dispatchContent(window_type, tab);
        }

        tab_li.addEventListener('click', () => {
            if (!tab_li.classList.contains('selected')) {
                for (let li of tabs_ul.children) {
                    li.classList.remove('selected');
                };
                tab_li.classList.add('selected');
            }
            dispatchContent(window_type, tab);
        })

        tabs_ul.appendChild(tab_li);
    })

    let tabs_div = document.createElement('div');
    tabs_div.id = 'tabs';
    tabs_div.appendChild(tabs_ul)

    window_content.appendChild(tabs_div);

}

/**
* Affiche la fenêtre de wiki et charge la liste d'objets si elle n'a jamais été chargée
* @param {string} window_type
*/
function displayWindow(window_type) {
    document.getElementById(mh_optimizer_window_id).classList.add('visible');
    let body = document.getElementsByTagName('body')[0];
    body.setAttribute('style', 'overflow: hidden');
    createTabs(window_type);
}

/**
* Crée le bloc de contenu de la page
* @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
*/
function createTabContent(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');

    let tab_content = document.getElementById('tab-content');
    if (tab_content) {
        tab_content.remove();
    }
    tab_content = document.createElement('div');
    tab_content.id = 'tab-content';

    window_content.appendChild(tab_content);
}

/**
* Détermine quelle fonction appeler en fonction de l'onglet sélectionné
* @param {string} window_type     Le type de l'onglet
* @param tab                      L'onglet à afficher
*/
function dispatchContent(window_type, tab) {

    createTabContent(window_type);

    let list = document.getElementById('tab-content');
    if (list) {
        list.innerHTML = '';
    }
    switch(tab.id) {
        case 'items':
            displayItems(items, tab.id);
            break;
        case 'recipes':
            displayRecipes();
            break;
        case 'skills':
            displaySkills();
            break;
        case 'citizens':
            displayCitizens();
            break;
        case 'bank':
            displayBank(tab.id);
            break;
        case 'wishlist':
            displayWishlist();
            break;
        default:
            break;
    }
}

/** Filtre la liste des objets */
function filterItems(source_items) {
    return source_items;
}

/**
 * Affiche les éléments présents dans la banque
 * @param {string} tab_id
 */
function displayBank(tab_id) {
    bank = undefined;
    getBank();
    let interval = setInterval(() => {
        if (bank) {
            displayItems(bank.bank, tab_id);
            clearInterval(interval);
        }
    }, 500);
}

/** Affiche les éléments présents dans la liste de courses */
function displayWishlist() {
    wishlist = undefined;
    getWishlist();
    let interval = setInterval(() => {
        if (wishlist) {
            clearInterval(interval);
            let tab_content = document.getElementById('tab-content');

            let tab_content_header = document.createElement('div');
            tab_content.appendChild(tab_content_header);

            let save_button = document.createElement('button');
            save_button.innerText = texts.save[lang];
            save_button.addEventListener('click', () => {
                updateWishlist();
            });
            tab_content_header.appendChild(save_button);

            let wishlist_list = document.createElement('ul');
            wishlist_list.id = 'wishlist';
            tab_content.appendChild(wishlist_list);

            let list_header = document.createElement('div');
            list_header.classList.add('header');
            wishlist_list.appendChild(list_header);

            wishlist_headers.forEach((header) => {
                let header_cell = document.createElement('div');
                header_cell.innerText = header.label[lang];
                header_cell.classList.add(header.id);
                list_header.appendChild(header_cell);
            });


            wishlist.wishList
                .filter((item) => item.count > 0)
                .forEach((item, index) => {

                let item_element = document.createElement('li');
                wishlist_list.appendChild(item_element);

                let item_title_container = document.createElement('div');
                item_title_container.classList.add('label');
                item_element.appendChild(item_title_container);

                let item_icon = document.createElement('img');
                item_icon.setAttribute('style', 'margin-right: 0.5em');
                item_icon.src = hordes_img_url + item.item.img;
                item_title_container.appendChild(item_icon);

                let item_title = document.createElement('span');
                item_title.innerText = item.item.label[lang];
                item_title_container.appendChild(item_title);

                let item_priority_container = document.createElement('div');
                item_priority_container.classList.add('priority');
                item_element.appendChild(item_priority_container);

                let item_priority_select = document.createElement('select');
                item_priority_select.addEventListener('change', () => {
                    item.priority = +item_priority_select.value;
                });
                item_priority_container.appendChild(item_priority_select);

                wishlist_priorities.forEach((priority) => {
                    let item_priority_option = document.createElement('option');
                    item_priority_option.value = priority.value;
                    item_priority_option.innerText = priority.label[lang];
                    item_priority_select.appendChild(item_priority_option);
                    if (item.priority === priority.value) {
                        item_priority_option.selected = true;
                    }
                });

                let item_bank_count = document.createElement('div');
                item_bank_count.innerText = item.bankCount;
                item_bank_count.classList.add('bank_count');
                item_element.appendChild(item_bank_count);

                let item_bank_needed = document.createElement('div');
                item_bank_needed.classList.add('bank_needed');
                item_element.appendChild(item_bank_needed);

                let item_bank_needed_input = document.createElement('input');
                item_bank_needed_input.type = 'number';
                item_bank_needed_input.value = item.count;
                item_bank_needed_input.addEventListener('change', (event) => {
                    item_bank_needed_input.value = +event.target.value;
                    item.count = +event.target.value;
                    item_diff_input.value = item.count - item.bankCount;
                });
                item_bank_needed.appendChild(item_bank_needed_input);

                let item_diff = document.createElement('div');
                item_diff.classList.add('diff');
                item_element.appendChild(item_diff);

                let item_diff_input = document.createElement('input');
                item_diff_input.type = 'number';
                item_diff_input.value = item.count - item.bankCount;
                item_diff_input.addEventListener('change', (event) => {
                    item_diff_input.value = +event.target.value;
                    item.count = +item.bankCount + +item_diff_input.value;
                    item_bank_needed_input.value = item.count;
                });
                item_diff.appendChild(item_diff_input);

                let item_remove = document.createElement('div');
                item_remove.classList.add('delete');
                item_element.appendChild(item_remove);

                let item_remove_img = document.createElement('img');
                item_remove_img.alt = '(X)';
                item_remove_img.src = repo_img_url + 'icons/b_close.png';
                item_remove_img.addEventListener('click', () => {
                    item.count = undefined;
                    item_bank_needed_input.value = item.bankCount;
                    item_diff_input.value = 0;
                    item_element.remove();
                })
                item_remove.appendChild(item_remove_img);

            });
        }
    }, 500);
}

/**
* Affiche la liste des objets
* @param filtered_items
* @param {string} tab_id l'onglet dans lequel on se trouve
*/
function displayItems(filtered_items, tab_id) {
    let tab_content = document.getElementById('tab-content');

    let item_list = document.createElement('ul');
    item_list.id = 'item-list';

    tab_content.appendChild(item_list);

    filtered_items.forEach((item, index) => {
        if (index === 0 || filtered_items[index - 1].category !== item.category) {
            let category_img = document.createElement('img');
            category_img.src = item.category.img;

            let category_text = document.createElement('span');
            category_text.innerText = item.category.label[lang];

            let category_container = document.createElement('div');
            category_container.classList.add('category', 'header');
            category_container.appendChild(category_img);
            category_container.appendChild(category_text);

            item_list.appendChild(category_container);
        }

        let item_title_and_add_container = document.createElement('div');
        item_title_and_add_container.classList.add('item-title');

        let item_title_container = document.createElement('div');
        item_title_container.setAttribute('style', 'flex: 1; cursor: pointer;');
        item_title_and_add_container.appendChild(item_title_container)

        if ((tab_id === 'bank' || tab_id === 'items') && item.wishListCount === 0 && mh_user.townId) {
            let item_add_to_wishlist = document.createElement('div');
            item_add_to_wishlist.classList.add('add-to-wishlist');
            item_title_and_add_container.appendChild(item_add_to_wishlist);

            let add_to_wishlist_button = document.createElement('button');
            add_to_wishlist_button.classList.add('inline');
            add_to_wishlist_button.innerHTML = '<img src="' + repo_img_url + 'item/item_cart.gif""></img>';
            add_to_wishlist_button.addEventListener('click', () => {
                addItemToWishlist(item, item_add_to_wishlist);
            })
            item_add_to_wishlist.appendChild(add_to_wishlist_button);
        }

        if (tab_id === 'bank' && item.count) {
            let item_count = document.createElement('span');
            item_count.innerText = '(x' + item.count + ')';
            item_count.setAttribute('style', 'margin-right: 0.5em');
            item_title_container.appendChild(item_count);
        }

        let item_icon = document.createElement('img');
        item_icon.setAttribute('style', 'margin-right: 0.5em');
        item_icon.src = hordes_img_url + item.img;
        item_title_container.appendChild(item_icon);

        let item_title = document.createElement('span');
        item_title.innerText = item.label[lang];
        item_title_container.appendChild(item_title);

        let item_properties_container = document.createElement('div');
        item_properties_container.classList.add('properties');

        item_properties_container.innerHTML = '<p>' + item.description[lang] + '</p>';
        // if (item.properties) {
        //     let item_properties = item.properties.map((property) => '<span style="padding: 0 8px">' + property + '</span>').reduce((a, b) => a + b);
        //     item_properties_container.innerHTML += '<p>' + item_properties + '</p>';
        // }
        // if (item.actions) {
        //     let item_actions = item.actions.map((action) => '<span style="padding: 0 8px">' + action + '</span>').reduce((a, b) => a + b);
        //     item_properties_container.innerHTML += '<p>' + item_actions + '</p>';
        // }

        let item_container = document.createElement('li');
        item_container.appendChild(item_title_and_add_container);
        item_container.appendChild(item_properties_container);

        item_title_container.addEventListener('click', () => {
            let selected_items = document.getElementsByClassName('selected');
            item_container.classList.toggle('selected');
        });

        item_list.appendChild(item_container);
    });
}

/** Affiche la liste des citoyens */
function displayCitizens() {
    citizens = undefined;
    getCitizens();
    let tab_content = document.getElementById('tab-content');
    let interval = setInterval(() => {
        if (citizens && hero_skills) {
            console.log('heroskills', hero_skills);

            let header_cells = [
                {id: 'name', label: {en: 'Name', fr: 'Nom', de: '', es: ''}, type: 'th'},
                {id: 'nombreJourHero', label: {en: '', fr: 'Nombre de jours héros', de: '', es: ''}, type: 'td'},
                {id: 'uppercut', label: {en: '', fr: 'Uppercut Sauvage', de: '', es: ''}, type: 'td', img: ''},
                {id: 'rescue', label: {en: 'Rescue', fr: 'Sauvetage', de: '', es: ''}, type: 'td', img: ''}
            ];

            let skills_with_uses = hero_skills
            .filter((skill) => skill.nbUses > 0)
            .map((skill) => {
                return {id: skill.name, label: skill.label, type: 'td', img: skill.icon}
            });
            console.log('skills_with_uses', skills_with_uses);
            header_cells.push(...skills_with_uses);

            let header_row = document.createElement('tr');
            header_row.classList.add('header');

            header_cells.forEach((header_cell) => {
                let cell = document.createElement('th');
                if (cell.img) {
                    cell.innerHTML = '<img src="' + repo_img_url + header_cell.img + '.gif"></img>'
                } else {
                    cell.innerText = header_cell.label[lang];
                }
                header_row.appendChild(cell);
            })

            let table = document.createElement('table');
            table.classList.add('mho-table');
            table.appendChild(header_row);

            tab_content.appendChild(table);
            for (let citizen_key in citizens.citizens) {
                let citizen = citizens.citizens[citizen_key];
                let citizen_row = document.createElement('tr');
                let is_me = citizen.id === mh_user.id;
                if (is_me) {
                    citizen_row.setAttribute('style', 'background-color: rgba(255, 255, 255, 0.1)');
                }
                table.appendChild(citizen_row);

                header_cells.forEach((header_cell) => {
                    let cell = document.createElement(header_cell.type);
                    if (is_me) {
                        switch(header_cell.id) {
                            case 'name':
                                cell.innerText = citizen[header_cell.id];
                                break;
                            case 'nombreJourHero':
                                var input = document.createElement('input');
                                input.type = 'number';
                                input.value = citizen[header_cell.id]
                                cell.appendChild(input);
                                break;
                            default:
                                console.log(header_cell);
                                break;
                        }
                    } else {
                        switch(header_cell.id) {
                            case 'name':
                            case 'nombreJourHero':
                                cell.innerText = citizen[header_cell.id];
                                break;
                            default:
                                cell.innerText = '';
                                break;
                        }
                    }
                    citizen_row.appendChild(cell);
                })
                // console.log('citizen', citizen);
            }

            clearInterval(interval);
        }
    }, 500);
}

/** Affiche la liste des pouvoirs */
function displaySkills() {
    if (hero_skills) {
        let tab_content = document.getElementById('tab-content');

        let header_cells = [
            {id: 'icon', label: {en: '', fr: '', de: '', es: ''}, type: 'th'},
            {id: 'label', label: {en: '', fr: 'Capacité', de: '', es: ''}, type: 'th'},
            {id: 'daysNeeded', label: {en: '', fr: 'Jours héros nécessaires', de: '', es: ''}, type: 'td'},
            {id: 'description', label: {en: 'Description', fr: 'Description', de: '', es: ''}, type: 'td'}
        ];

        let header_row = document.createElement('tr');
        header_row.classList.add('header');
        header_cells.forEach((header_cell) => {
            let cell = document.createElement('th');
            cell.innerText = header_cell.label[lang];
            header_row.appendChild(cell);
        })

        let table = document.createElement('table');
        table.classList.add('mho-table');
        table.appendChild(header_row);
        tab_content.appendChild(table);
        for (let skill_key in hero_skills) {
            let skill = hero_skills[skill_key];
            let skill_row = document.createElement('tr');
            table.appendChild(skill_row);

            header_cells.forEach((header_cell) => {
                let cell = document.createElement(header_cell.type);
                let img = document.createElement('img');
                switch(header_cell.id) {
                    case 'icon':
                        img.src = repo_img_url + 'heroskill/' + skill[header_cell.id] + '.gif';
                        cell.appendChild(img);
                        break;
                    case 'label':
                    case 'description':
                        cell.setAttribute('style', 'text-align: left');
                        cell.innerText = skill[header_cell.id][lang];
                        break;
                    default:
                        cell.setAttribute('style', 'text-align: center');
                        cell.innerText = skill[header_cell.id];
                        break;
                }
                skill_row.appendChild(cell);
            })
        }
    } else {
        getHeroSkills(true);
        let interval = setInterval(() => {
            if(hero_skills) {
                displaySkills()
                clearInterval(interval);
            }
        }, 500);
    }
}

/** Affiche la liste des recettes */
function displayRecipes() {
    if (recipes) {
        let tab_content = document.getElementById('tab-content');

        let recipes_list = document.createElement('ul');
        recipes_list.id = 'recipes-list';

        tab_content.appendChild(recipes_list);

        recipes.forEach((recipe, index) => {
            if (index === 0 || recipes[index - 1].type.id !== recipe.type.id) {
                let category_text = document.createElement('span');
                category_text.innerText = recipe.type.label[lang];

                let category_container = document.createElement('div');
                category_container.classList.add('category');
                category_container.classList.add('header');
                category_container.appendChild(category_text);

                recipes_list.appendChild(category_container);
            }

            recipes_list.appendChild(getRecipeElement(recipe));
        });

    } else {
        getRecipes();
        let interval = setInterval(() => {
            if(recipes) {
                displayRecipes()
                clearInterval(interval);
            }
        }, 500);
    }
}

function getRecipeElement(recipe) {
    let recipe_container = document.createElement('li');

    let compos_container = document.createElement('ul');
    compos_container.setAttribute('style', 'padding: 0; min-width: 200px; width: 25%;');
    recipe.components.forEach((compo) => {
        let compo_container = document.createElement('li');

        let component_img = document.createElement('img');
        component_img.setAttribute('style', 'margin-right: 0.5em');
        component_img.src = hordes_img_url + compo.img;
        compo_container.appendChild(component_img);

        let component_label = document.createElement('span');
        component_label.innerText = compo.label[lang];
        compo_container.appendChild(component_label);

        compos_container.appendChild(compo_container);
    })
    recipe_container.appendChild(compos_container);

    let transform_img_container = document.createElement('div');
    recipe_container.appendChild(transform_img_container);


    let transform_img = document.createElement('img');
    transform_img.alt = '=>';
    transform_img.src = repo_img_url + 'icons/small_move.gif';
    transform_img.setAttribute('style', 'margin-left: 0.5em; margin-right: 0.5em');
    transform_img_container.appendChild(transform_img);

    let results_container = document.createElement('ul');
    results_container.setAttribute('style', 'padding: 0');
    recipe.result.forEach((result) => {
        let result_container = document.createElement('li');

        let result_img = document.createElement('img');
        result_img.setAttribute('style', 'margin-right: 0.5em');
        result_img.src = hordes_img_url + result.item.img;
        result_container.appendChild(result_img);

        let result_label = document.createElement('span');
        result_label.innerText = result.item.label[lang];
        result_container.appendChild(result_label);

        if (result.probability !== 1) {
            let result_proba = document.createElement('span');
            result_proba.setAttribute('style', 'font-style: italic; color: #ddab76;');
            result_proba.innerText = ' (' + Math.round(result.probability * 100) + '%)';
            result_container.appendChild(result_proba);
        }

        results_container.appendChild(result_container);
    })
    recipe_container.appendChild(results_container);
    return recipe_container;
}

/**
* Crée un bouton d'aide
* @param {string} text_to_display    Le contenu de la popup d'aide
*/
function createHelpButton(text_to_display) {

    let help_button = document.createElement('a');
    help_button.innerHTML = texts.external_app_id_help_label[lang];
    help_button.classList.add('help-button');

    let help_tooltip = document.createElement('div')
    help_tooltip.classList.add('tooltip', 'help', 'hidden');
    help_tooltip.innerHTML = texts.external_app_id_help[lang];
    help_button.appendChild(help_tooltip);

    help_button.addEventListener('mouseenter', function() {
        help_tooltip.classList.remove('hidden');
    })
    help_button.addEventListener('mouseleave', function() {
        help_tooltip.classList.add('hidden');
    })

    return help_button
}

/** Enregistre les paramètres de l'extension */
function saveParameters() {
    let parameters = document.getElementsByClassName('parameter');
}

function createUpdateExternalToolsButton() {

    let tools_to_update = {
        isBigBrothHordes: mho_parameters ? mho_parameters.update_bbh : false,
        isFataMorgana: mho_parameters ? mho_parameters.update_fata : false,
        isGestHordes: mho_parameters ? mho_parameters.update_gh : false
    };

    let nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;

    let update_external_tools_btn = document.getElementById(mh_update_external_tools_id);
    const zone_marker = document.getElementById('zone-marker');

    /** Cette fonction ne doit s'exécuter que si on a un id d'app externe ET au moins l'une des options qui est cochée dans les paramètres ET qu'on est hors de la ville */
    if (nb_tools_to_update > 0 && external_app_id && zone_marker) {
        if(update_external_tools_btn) return;

        let el = zone_marker.parentElement;

        let updater_bloc = document.createElement('div');
        el.appendChild(updater_bloc);
        let updater_title = document.createElement('h5');
        updater_title.innerHTML = 'MyHordes Optimizer';
        updater_bloc.appendChild(updater_title);

        let btn = document.createElement('button');

        btn.innerHTML = '<img src ="' + repo_img_url + 'emotes/arrowright.gif">' + texts.update_external_tools_needed_btn_label[lang];
        btn.id = mh_update_external_tools_id;

        btn.addEventListener('click', () => {
            /** Au clic sur le bouton, on appelle la fonction de mise à jour */
            btn.innerHTML = '<img src ="' + repo_img_url + 'emotes/middot.gif">' + texts.update_external_tools_pending_btn_label[lang];
            updateExternalTools();
        })

        updater_bloc.appendChild(btn);
    } else if (update_external_tools_btn) {
        update_external_tools_btn.parentElement.remove();
    }
}

/** Si l'option associée est activée, un clic sur le chantier recommandé permet de rediriger vers la ligne du chantier en question */
function clickOnVotedToRedirect() {
    if (mho_parameters.click_on_voted && pageIsConstructions()) {
        let voted_building = document.getElementsByClassName('voted-building')[0];
        if (voted_building) {
            voted_building.setAttribute('style', 'cursor: pointer');
            voted_building.addEventListener('click', () => {
                let voted_row = document.getElementsByClassName('voted')[0];
                voted_row.setAttribute('style', 'scroll-margin: 100px');
                voted_row.scrollIntoView();
            });
        }
    }
}

/** Affiche la liste de courses dans le désert et l'atelier */
function displayWishlistInApp() {
    let wishlist_section = document.getElementById('wishlist-section');

    if (wishlist && mho_parameters.display_wishlist && (pageIsWorkshop() || pageIsDesert())) {
        if (wishlist_section) return;

        let list_to_display = wishlist.wishList.filter((item) => {
            if (pageIsWorkshop()) {
                return item.isWorkshop;
            } else {
                return item.count - item.bankCount > 0
            }
        });
        if (pageIsWorkshop() && list_to_display.length === 0) return;

        let refreshWishlist = () => {
            let update_section = document.createElement('div');
            header.appendChild(update_section);

            let last_update = document.createElement('span');
            last_update.classList.add('small');
            last_update.setAttribute('style', 'margin-right: 0.5em;');
            last_update.innerText = new Intl.DateTimeFormat('default', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(wishlist.lastUpdateInfo.updateTime)) + ' - ' + wishlist.lastUpdateInfo.userName;
            update_section.appendChild(last_update);

            let update_btn = document.createElement('button');
            update_btn.classList.add('inline');
            update_btn.innerText = texts.update[lang];
            update_btn.addEventListener('click', () => {
                wishlist = undefined;
                getWishlist();
            });
            update_section.appendChild(update_btn);

            let list = document.createElement('div');
            list.classList.add('row-table');
            content.appendChild(list);

            let list_header = document.createElement('div');
            list_header.classList.add('row-flex', 'header', 'bottom');
            list.appendChild(list_header);

            wishlist_headers
                .filter((header_cell_item) => header_cell_item.id !== 'delete')
                .forEach((header_cell_item) => {
                let header_cell = document.createElement('div');
                header_cell.classList.add('padded', 'cell');
                header_cell.classList.add(header_cell_item.id === 'label' ? 'rw-5' : (header_cell_item.id === 'priority' ? 'rw-3' : 'rw-2'));
                header_cell.innerText = header_cell_item.label[lang];
                list_header.appendChild(header_cell);
            });

            list_to_display
                .forEach((item) => {
                let list_item = document.createElement('div');
                list_item.classList.add('row-flex');
                list.appendChild(list_item);

                let title = document.createElement('div');
                title.classList.add('padded', 'cell', 'rw-5');
                title.innerHTML = `<img src="${hordes_img_url + item.item.img}" style="margin-right: 5px"></img><span class="small">${item.item.label[lang]}</span>`;
                list_item.appendChild(title);

                let item_priority = document.createElement('span');
                item_priority.classList.add('padded', 'cell', 'rw-3');
                item_priority.innerHTML = `<span class="small">${wishlist_priorities.find((priority) => item.priority === priority.value).label[lang]}</span}`;
                list_item.appendChild(item_priority);

                let bank_count = document.createElement('span');
                bank_count.classList.add('padded', 'cell', 'rw-2');
                bank_count.innerHTML = `<span class="small">${item.bankCount}</span}`;
                list_item.appendChild(bank_count);

                let bank_need = document.createElement('span');
                bank_need.classList.add('padded', 'cell', 'rw-2');
                bank_need.innerHTML = `<span class="small">${item.count}</span}`;
                list_item.appendChild(bank_need);

                let needed = document.createElement('span');
                needed.classList.add('padded', 'cell', 'rw-2');
                needed.innerHTML = `<span class="small">${item.count - item.bankCount}</span}`;
                list_item.appendChild(needed);
            });

            header_title.addEventListener('click', () => {
                if (header_title.show) {
                    hide_state.innerText = '˅';
                } else {
                    hide_state.innerText = '˃';

                }
                list.classList.toggle('hidden');
                update_section.classList.toggle('hidden');
                header_title.show = !header_title.show;
            });
        };

        wishlist_section = document.createElement('div');
        wishlist_section.id = 'wishlist-section';
        wishlist_section.classList.add('row');

        if (pageIsWorkshop()) {
            let worshop_table = document.getElementsByClassName('row-table')[0];
            worshop_table.parentNode.insertBefore(wishlist_section, worshop_table.nextSibling);
        } else {
            let actions_box = document.getElementsByClassName('actions-box')[0];
            let main_actions = actions_box.parentNode;
            main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
        }

        let cell = document.createElement('div');
        wishlist_section.appendChild(cell);

        let header = document.createElement('h5');
        header.setAttribute('style', 'display: flex; justify-content: space-between;');
        cell.appendChild(header);

        let header_title = document.createElement('span');
        header_title.setAttribute('style', 'margin-top: 7px; cursor: pointer;')
        header.appendChild(header_title);

        let hide_state = document.createElement('span');
        hide_state.setAttribute('style', 'margin-right: 0.5em');
        hide_state.innerText = '˅';
        hide_state.show = true;
        header_title.appendChild(hide_state);

        let header_label = document.createElement('span');
        header_label.innerText = tabs_list.tools.find((tool) => tool.id === 'wishlist').label[lang];
        header_title.appendChild(header_label);

        let content = document.createElement('div');
        cell.appendChild(content);

        refreshWishlist();
    } else if (wishlist_section) {
        wishlist_section.remove();
    }
}

/** Affiche la priorité directement sur les éléments si l'option associée est cochée */
function displayPriorityOnItems() {
    if (mho_parameters.display_wishlist && pageIsDesert() && wishlist) {
        let present_items = [];
        let inventories = document.getElementsByClassName('inventory');
        if (inventories) {
            for (let inventory of inventories) {
                present_items.push(...inventory.getElementsByTagName('img'));
            };
        }
        wishlist.wishList
            .filter((wishlist_item) => wishlist_item.priority > 0)
            .forEach((wishlist_item) => {
            present_items
                .filter((present_item) => present_item.src.indexOf(wishlist_item.item.img) > 0)
                .forEach((present_item) => {
                present_item.parentElement.parentElement.classList.add('priority_' + wishlist_item.priority);
            });
        });
    }
}

/** Affiche les tooltips avancés */
function displayAdvancedTooltips() {
    if (mho_parameters.enhanced_tooltips) {
        let tooltip_container = document.getElementById('tooltip_container');
        let advanced_tooltip_container = document.getElementById('mho-advanced-tooltip');
        if (tooltip_container.innerHTML) {
            let hovered = document.querySelectorAll(":hover");
            let hovered_item;
            for (let item of hovered) {
                if (item.classList.contains('item-icon')) {
                    let hovered_item_img = item.firstElementChild.src;
                    let index = hovered_item_img.indexOf(hordes_img_url);
                    hovered_item_img = hovered_item_img.slice(index).replace(hordes_img_url, '');
                    hovered_item = items.find((item) => item.img === hovered_item_img);
                }
            }
            if (!advanced_tooltip_container && hovered_item && (hovered_item.recipes.length > 0/* || hovered_item.actions || hovered_item.properties*/)) {
                tooltip_container.firstElementChild.classList.add('large-tooltip');
                advanced_tooltip_container = document.createElement('div');
                advanced_tooltip_container.id = 'mho-advanced-tooltip';
                advanced_tooltip_container.setAttribute('style', 'margin-top: 0.5em; border-top: 1px solid;');
                let tooltip_content = tooltip_container.firstElementChild;
                tooltip_content.appendChild(advanced_tooltip_container);

                advanced_tooltip_container.innerHtml = '';
                if (hovered_item.recipes.length > 0) {
                    let item_recipes = document.createElement('div');
                    item_recipes.classList.add('recipe');
                    advanced_tooltip_container.appendChild(item_recipes);

                    hovered_item.recipes.forEach((recipe) => {
                        item_recipes.appendChild(getRecipeElement(recipe));
                    });
                }
                // if (hovered_item.properties) {
                //     let item_properties = hovered_item.properties.map((property) => '<span style="padding: 0 8px">' + property + '</span>').reduce((a, b) => a + b);
                //     advanced_tooltip_container.innerHTML += '<p>' + item_properties + '</p>';
                // }
                // if (hovered_item.actions) {
                //     let item_actions = hovered_item.actions.map((action) => '<span style="padding: 0 8px">' + action + '</span>').reduce((a, b) => a + b);
                //     advanced_tooltip_container.innerHTML += '<p>' + item_actions + '</p>';
                // }
                // console.log('hovered_item', hovered_item);
            }
        } else if (advanced_tooltip_container) {
            advanced_tooltip_container.remove();
        }
    }
}

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
function preventFromLeaving() {
    if (mho_parameters.prevent_from_leaving && pageIsDesert()) {
        let prevent_function = (event) => {
            let e = event || window.event;

            let buttons = document.getElementsByTagName('button');
            let ae_button;
            for (let button of buttons) {
                if (button.getAttribute('x-toggle-escort') === '1') {
                    console.log('button.getAttribute("x-toggle-escort")', button.getAttribute('x-toggle-escort'));
                    ae_button = button;

                    let mho_leaving_info = document.getElementById('mho-leaving-info');
                    if (!mho_leaving_info) {
                        mho_leaving_info = document.createElement('div');
                        mho_leaving_info.id = 'mho-leaving-info';
                        mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                        mho_leaving_info.innerHTML = texts.prevent_from_leaving_information[lang];
                        button.parentNode.insertBefore(mho_leaving_info, button.nextSibling);
                    }

                }
            }
            console.log('buttons', ae_button);
            if (ae_button) {
                if (e) {
                    e.returnValue = '';
                    e.preventDefault();
                }

                return '';
            }
        }

        window.addEventListener('beforeunload', prevent_function, false);
    }
}

///////////
// STYLE //
///////////

/** Add styles to this page */
function createStyles() {
    const btn_style = '#' + btn_id + ' {'
    + 'background-color: #5c2b20;'
    + 'border: 1px solid #f0d79e;'
    + 'outline: 1px solid #000;'
    + 'position: absolute;'
    + 'top: 10px;'
    + 'z-index: 30;'
    + '}';

    const btn_hover_h1_span_style = '#' + btn_id + ':hover h1 span {'
    + 'display: inline;'
    + '}';

    const btn_hover_div_style = '#' + btn_id + ':hover div {'
    + 'display: block;'
    + '}';

    const btn_h1_style = '#' + btn_id + ' h1 {'
    + 'height: auto;'
    + 'font-size: 8pt;'
    + 'text-transform: none;'
    + 'font-variant: small-caps;'
    + 'background: none;'
    + 'cursor: help;'
    + 'margin: 0 5px;'
    + 'padding: 0;'
    + 'line-height: 17px;'
    + 'color: #f0d79e;'
    + '}';

    const btn_h1_img_style = '#' + btn_id + ' h1 img {'
    + 'vertical-align: -9%;'
    + '}';

    const btn_h1_hover_style = '#' + btn_id + ':hover h1 {'
    + 'border-bottom: 1px solid #b37c4a;'
    + 'margin-bottom: 5px;'
    + '}'

    const btn_h1_span_style = '#' + btn_id + ' h1 span {'
    + 'color: #f0d79e;'
    + 'cursor: help;'
    + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
    + 'font-size: 1.2rem;'
    + 'font-variant: small-caps;'
    + 'letter-spacing: 1px;'
    + 'line-height: 17px;'
    + 'text-align: left;'
    + 'text-transform: none;'
    + 'margin-left: 1em;'
    + 'display: none;'
    + '}';

    const btn_div_style = '#' + btn_id + ' > div {'
    + 'display: none;'
    + 'margin: 0 5px 8px 5px;'
    + 'font-size: 0.9em;'
    + 'width: 350px;'
    + '}';

    const mh_optimizer_window_style = '#' + mh_optimizer_window_id + '{'
    + 'background: url(' + repo_img_url + 'background/mask.png);'
    + 'height: 100%;'
    + 'opacity: 1;'
    + 'position: fixed;'
    + 'transition: opacity 1s ease;'
    + 'width: 100%;'
    + 'z-index: 999;'
    + 'padding: 0;'
    + '}';

    const mh_optimizer_window_hidden = '#' + mh_optimizer_window_id + ':not(.visible) {'
    + 'opacity: 0;'
    + 'pointer-events: none;'
    + '}';

    const mh_optimizer_window_box_style_hidden = '#' + mh_optimizer_window_id + ':not(.visible) #' + mh_optimizer_window_id + '-box {'
    + 'transform: scale(0) translateY(1000px);'
    + '}';

    const mh_optimizer_window_box_style = '#' + mh_optimizer_window_id + ' #' + mh_optimizer_window_id + '-box {'
    + 'background: url(' + repo_img_url + 'background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(' + repo_img_url + 'background/bg_content2.jpg) repeat-y 100% 0/900px 263px;'
    + 'border-radius: 8px;'
    + 'box-shadow: 0 0 10px #000;'
    + 'left: calc(50% - 750px);'
    + 'position: absolute;'
    + 'top: 10px;'
    + 'bottom: 10px;'
    + 'right: 10px;'
    + 'left: 10px;'
    + 'transform: scale(1) translateY(0);'
    + 'transition: transform .5s ease;'
    + '}';

    const mh_optimizer_window_overlay_style = '#' + mh_optimizer_window_id + ' #' + mh_optimizer_window_id + '-box #' + mh_optimizer_window_id + '-overlay {'
    + 'position: absolute;'
    + 'right: 12px;'
    + 'top: -6px;'
    + '}'

    const wiki_window_overlay_ul_style = '#' + mh_optimizer_window_id + ' #' + mh_optimizer_window_id + '-box #' + mh_optimizer_window_id + '-overlay ul {'
    + 'margin: 2px;'
    + 'padding: 0;'
    + '}'

    const mh_optimizer_window_overlay_ul_li_style = '#' + mh_optimizer_window_id + ' #' + mh_optimizer_window_id + '-box #' + mh_optimizer_window_id + '-overlay ul li {'
    + 'cursor: pointer;'
    + 'display: inline-block;'
    + '}'

    const mh_optimizer_window_content = '#' + mh_optimizer_window_id + '-content {'
    + 'background: #7e4d2a;'
    + 'bottom: 0;'
    + 'color: #fff;'
    + 'left: 0;'
    + 'overflow-x: hidden;'
    + 'overflow-y: auto;'
    + 'padding: 2px;'
    + 'position: absolute;'
    + 'right: 0;'
    + 'top: 0;'
    + 'background: url(' + repo_img_url + 'background/box/panel_00.gif) 0 0 no-repeat,url(' + repo_img_url + 'background/box/panel_02.gif) 100% 0 no-repeat,url(' + repo_img_url + 'background/box/panel_20.gif) 0 100% no-repeat,url(' + repo_img_url + 'background/box/panel_22.gif) 100% 100% no-repeat,url(' + repo_img_url + 'background/box/panel_01.gif) 0 0 repeat-x,url(' + repo_img_url + 'background/box/panel_10.gif) 0 0 repeat-y,url(' + repo_img_url + 'background/box/panel_12.gif) 100% 0 repeat-y,url(' + repo_img_url + 'background/box/panel_21.gif) 0 100% repeat-x,#7e4d2a;'
    + 'border-radius: 12px;'
    + 'left: 18px;'
    + 'padding: 8px;'
    + 'right: 5px;'
    + '}';

    const tabs_style = '#tabs {'
    + 'color: #ddab76;'
    + 'font-size: 1.2rem;'
    + 'margin-bottom: 20px;'
    + 'position: relative;'
    + 'height: 25px;'
    + 'border-bottom: 1px solid #ddab76;'
    + '}';

    const tabs_ul_style = '#tabs ul {'
    + 'display: flex;'
    + 'flex-wrap: wrap;'
    + 'padding: 0;'
    + 'background: url(' + repo_img_url + 'background/tabs-header-plain.gif) 0 100% round;'
    + 'background-size: cover;'
    + 'height: 24px;'
    + 'margin-top: 2px;'
    + 'margin-right: 20px;'
    + 'padding-left: 0.5em;'
    + '}';

    const tabs_ul_li_style = '#tabs > ul > li {'
    + 'cursor: pointer;'
    + 'display: inline-block;'
    + 'margin-top: auto;'
    + 'margin-bottom: auto;'
    + '}';

    const tabs_ul_li_spacing_style = '#tabs > ul > li > div > img {'
    + 'margin-right: 0.5em;'
    + '}';

    const tabs_ul_li_div_style = '#tabs > ul > li > div {'
    + 'background-image: url(' + repo_img_url + 'background/tab.gif);'
    + 'background-position: 0 0;'
    + 'background-repeat: no-repeat;'
    + 'border-left: 1px solid #694023;'
    + 'border-right: 1px solid #694023;'
    + 'color: #f0d79e;'
    + 'cursor: pointer;'
    + 'float: right;'
    + 'font-family: Arial,sans-serif;'
    + 'font-size: 1rem;'
    + 'font-variant: small-caps;'
    + 'height: 21px;'
    + 'margin-left: 2px;'
    + 'margin-right: 0;'
    + 'margin-top: 3px;'
    + 'padding: 2px 4px 0;'
    + 'text-decoration: underline;'
    + 'white-space: nowrap;'
    + '}';

    const tabs_ul_li_div_hover_style = '#tabs > ul > li > div:hover {'
    + 'outline: 1px solid #f0d79e;'
    + 'text-decoration: underline;'
    + '}';

    const tabs_ul_li_selected_style = '#tabs > ul > li.selected {'
    + 'position: relative;'
    + 'top: 2px;'
    + '}';

    const tab_content_style = '#tab-content {'
    + 'position: absolute;'
    + 'bottom: 10px;'
    + 'left: 10px;'
    + 'right: 8px;'
    + 'top: 40px;'
    + 'overflow: auto;'
    + '}';

    const tab_content_item_list_style = '#tab-content > ul {'
    + 'display: flex;'
    + 'flex-wrap: wrap;'
    + 'padding: 0;'
    + 'margin: 0 0.5em;'
    + '}';

    const tab_content_item_list_item_style = '#tab-content > ul > li {'
    + 'min-width: 300px;'
    + 'flex-basis: min-content;'
    + 'padding: 0.125em 0.5em;'
    + 'margin: 0;'
    + '}';

    const tab_content_item_list_item_selected_style = '#tab-content > ul > li.selected {'
    + 'flex-basis: 100%;'
    + 'border: 1px solid;'
    + 'padding: 0.25em;'
    + 'background-color: #5c2b20;'
    + '}';

    const tab_content_item_list_item_not_selected_properties_style = '#tab-content > ul > li:not(.selected) .properties {'
    + 'display: none;'
    + '}';

    const item_category = '#tab-content > ul div.category {'
    + 'width: 100%;'
    + 'border-bottom: 1px solid;'
    + 'margin: 0.5em 0;'
    + '}';

    const parameters_informations_style = '#parameters, #informations {'
    + 'margin-top: 0.5em;'
    + '}';

    const parameters_informations_ul_style = '#parameters > ul, #informations > ul {'
    + 'padding: 0;'
    + 'margin: 0;'
    + 'color: #f0d79e;'
    + '}';

    const li_style = 'ul > li {'
    + 'list-style: none;'
    + '}';

    const mho_table_style = '.mho-table {'
    + 'border-collapse: collapse;'
    + 'border-bottom: 1px solid #ddab76;'
    + '}';

    const mho_table_header_style = '.header {'
    + 'font-size: 10pt;'
    + 'background: linear-gradient(0deg,#643b25 0,rgba(100,59,37,0) 50%,rgba(100,59,37,0)) !important;'
    + 'border-bottom: 2px solid #f0d79e;'
    + 'color: #fff;'
    + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
    + 'font-weight: 700;'
    + '}';

    const mho_table_row_style = '.mho-table tr:not(.header) {'
    + 'background-color: #5c2b20;'
    + 'border-bottom: 1px solid #7e4d2a;'
    + '}';

    const mho_table_cells_style = '.mho-table tr th, .mho-table tr td {'
    + 'padding: 0.25em;'
    + '}';

    const mho_table_cells_td_style = '.mho-table tr td {'
    + 'border-left: 1px solid #7e4d2a;'
    + 'color: #f0d79e;'
    + 'font-size: 9pt;'
    + '}';

    const recipe_style = '#tab-content #recipes-list > li, #wishlist > li {'
    + 'min-width: 100% !important;'
    + 'display: flex;'
    + 'border-bottom: 1px dotted;'
    + '}';

    const item_title_style = '.item-title {'
    + 'display: flex;'
    + 'justify-content: space-between;'
    + '}';

    const add_to_wishlist_button_img_style = '.add-to-wishlist > button > img {'
    + 'margin-right: 0;'
    + '}';

    const input_number_webkit_style = 'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {'
    + '-webkit-appearance: none;'
    + 'margin: 0;'
    + '}';

    const input_number_firefox_style = 'input[type=number] {'
    + '-moz-appearance: textfield;'
    + '}';

    const wishlist_header = '#wishlist .header, #wishlist > li {'
    + 'padding: 0 8px;'
    + 'margin: 0.125em 0;'
    + 'width: 100%;'
    + '}';

    const wishlist_odd = '#wishlist > li:nth-child(odd) {'
    + 'background-color: rgba(255, 255, 255, 0.1);'
    + '}';

    const wishlist_header_cell = '#wishlist .header > div {'
    + 'display: inline-block;'
    + 'vertical-align: middle;'
    + '}'

    const wishlist_label = '#wishlist .label {'
    + 'width: calc(100% - 425px);'
    + 'min-width: 200px;'
    + 'padding: 0 4px;'
    + '}';

    const wishlist_cols = '#wishlist .priority, #wishlist .bank_count, #wishlist .bank_needed, #wishlist .diff {'
    + 'width: 100px;'
    + 'padding: 0 4px;'
    + '}';

    const wishlist_delete = '#wishlist .delete {'
    + 'width: 25px;'
    + 'text-align: center;'
    + '}';

    const wishlist_in_app = '#wishlist-section ul {'
    + 'padding-left: 0;'
    + '}';

    const wishlist_in_app_item = '#wishlist-section ul > li {'
    + 'display: flex;'
    + 'justify-content: space-between;'
    + '}';

    const advanced_tooltip_recipe_li = '#mho-advanced-tooltip > div.recipe > li {'
    + 'display: flex;'
    + 'padding: 0.25em 0;'
    + '}';

    const advanced_tooltip_recipe_li_ul = '#mho-advanced-tooltip > div.recipe > li > ul {'
    + 'min-width: 0 !important;'
    + 'width: calc(100% - 15px) !important;'
    + '}';

    const large_tooltip = 'div.large-tooltip {'
    + 'width: 400px !important;'
    + 'max-width: 400px; !important'
    + '}';

    const item_priority_30 = 'li.item.priority_30 {'
    + 'box-shadow: inset 0 0 0.30em red, 0 0 0.5em red;'
    + '}';
    const item_priority_20 = 'li.item.priority_20 {'
    + 'box-shadow: inset 0 0 0.30em orangered, 0 0 0.5em orangered;'
    + '}';
    const item_priority_10 = 'li.item.priority_10 {'
    + 'box-shadow: inset 0 0 0.30em yellow, 0 0 0.5em yellow;'
    + '}';

    let css = btn_style + btn_hover_h1_span_style + btn_h1_style + btn_h1_img_style + btn_h1_hover_style + btn_h1_span_style + btn_div_style + btn_hover_div_style
    + mh_optimizer_window_style + mh_optimizer_window_hidden + mh_optimizer_window_box_style_hidden + mh_optimizer_window_box_style
    + mh_optimizer_window_overlay_style + mh_optimizer_window_overlay_ul_li_style + mh_optimizer_window_content
    + tabs_style + tabs_ul_style + tabs_ul_li_style + tabs_ul_li_spacing_style + tabs_ul_li_div_style + tabs_ul_li_div_hover_style + tabs_ul_li_selected_style
    + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_item_selected_style + tab_content_item_list_item_not_selected_properties_style + item_category
    + parameters_informations_style + parameters_informations_ul_style + li_style + recipe_style + input_number_webkit_style + input_number_firefox_style
    + mho_table_style + mho_table_header_style + mho_table_row_style + mho_table_cells_style + mho_table_cells_td_style
    + item_title_style + add_to_wishlist_button_img_style + advanced_tooltip_recipe_li + advanced_tooltip_recipe_li_ul + large_tooltip
    + wishlist_label + wishlist_header + wishlist_header_cell + wishlist_cols + wishlist_delete + wishlist_in_app + wishlist_in_app_item + wishlist_odd
    + item_priority_10 + item_priority_20 + item_priority_30;

    let style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
}

////////////////
// Appels API //
////////////////

function getItems() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/items?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                items = response.response
                    .map((item) => {
                    item.category = getCategory(item.category)
                    return item;
                })
                    .sort((item_a, item_b) => item_a.category.ordering > item_b.category.ordering);
                console.log('items', items);
                let wiki_btn = document.getElementById(wiki_btn_id);
                if (wiki_btn) {
                    wiki_btn.setAttribute('style', 'display: inherit');
                }
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `). Vérifiez que votre identifiant d'app externe est bien renseigné dans les paramètres de MH Optimizer`);
            }
        }
    });
}

/** Récupère les informations de la ville */
function getMe() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/me?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                mh_user = response.response;
                GM_setValue(mh_user_key, mh_user);
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/** Récupère les informations de la ville */
function getTown() {
    startLoading();
    if(!hero_skills) {
        getHeroSkills(false);
    }
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/town?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                console.log('town', response.response);
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}


/** Récupère les informations de la ville */
function getCitizens() {
    startLoading();
    if(!hero_skills) {
        getHeroSkills(false);
    }
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/citizens?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                citizens = response.response;
                citizens.citizens = Object.keys(citizens.citizens).map((key) => citizens.citizens[key])
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/** Récupère les informations de la banque */
function getBank() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/bank?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                bank = response.response;
                bank.bank = Object.keys(bank.bank).map((key) => bank.bank[key])
                    .map((bank_info) => {
                    bank_info.item.category = getCategory(bank_info.item.category);
                    bank_info.item.count = bank_info.count;
                    bank_info.item.wishListCount = bank_info.wishListCount;
                    bank_info = bank_info.item;
                    return bank_info;
                })
                    .sort((item_a, item_b) => item_a.category.ordering > item_b.category.ordering);
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/** Récupère les informations de liste de course */
function getWishlist() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'wishlist?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                wishlist = response.response;
                wishlist.wishList = Object.keys(wishlist.wishList)
                    .map((key) => wishlist.wishList[key])
                    .sort((item_a, item_b) => item_b.priority > item_a.priority);
            } else {
                wishlist = [];
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/**
  * Ajoute un élément à la wishlist
  * @param item l'élément à ajouter à la wishlist
  */
function addItemToWishlist(item, cart_button) {
    startLoading();
    GM_xmlhttpRequest({
        method: 'POST',
        url: api_url + 'wishlist/add/' + item.xmlId + '?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                item.wishListCount = 1;
                cart_button.remove();
                // TODO SNACKBAR
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/** Met à jour les données de la wishlist */
function updateWishlist() {
    let item_list = wishlist.wishList
    .filter((item) => item.count)
    .map((item) => {
        return {id: item.item.xmlId, priority: item.priority, count: item.count};
    });
    startLoading();
    GM_xmlhttpRequest({
        method: 'PUT',
        url: api_url + 'wishlist?userKey=' + external_app_id,
        data: JSON.stringify(item_list),
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json'
        },
        onload: function(response){
            if (response.status === 200) {
                // TODO SNACKBAR
                wishlist = response.response;
                wishlist.wishList = Object.keys(wishlist.wishList).map((key) => wishlist.wishList[key]);
            } else {
                console.error(`response`, response);
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}

/** Met à jour les outils externes (BBH, GH et Fata) en fonction des paramètres sélectionnés */
function updateExternalTools() {
    startLoading();
    let tools_to_update = {
        isBigBrothHordes: mho_parameters ? mho_parameters.update_bbh : false,
        isFataMorgana: mho_parameters ? mho_parameters.update_fata : false,
        isGestHordes: mho_parameters ? mho_parameters.update_gh : false
    };
    let btn = document.getElementById(mh_update_external_tools_id);
    GM_xmlhttpRequest({
        method: 'POST',
        url: api_url + 'externaltools/update?userKey=' + external_app_id + '&userId=' + mh_user.id,
        data: JSON.stringify(tools_to_update),
        headers: {
            'Content-Type': 'application/json'
        },
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                if (response.response.bigBrothHordesStatus.toLowerCase() === 'ok') GM_setValue(gm_bbh_updated_key, true);
                if (response.response.fataMorganaStatus.toLowerCase() === 'ok') GM_setValue(gm_gh_updated_key, true);
                if (response.response.fataMorganaStatus.toLowerCase() === 'ok') GM_setValue(gm_fata_updated_key, true);

                let nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;
                let nb_tools_success = Object.keys(response.response).map((key) => response.response[key]).filter((tool_response) => tool_response.toLowerCase() === 'ok').length;
                btn.innerHTML = nb_tools_to_update === nb_tools_success
                    ? '<img src ="' + repo_img_url + 'item/done.png">' + texts.update_external_tools_success_btn_label[lang]
                : '<img src ="' + repo_img_url + 'emotes/warning.gif">' + texts.update_external_tools_errors_btn_label[lang];
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
                btn.innerHTML = '<img src ="' + repo_img_url + 'professions/death.gif">' + texts.update_external_tools_fail_btn_label[lang];
            }
            endLoading();
        }
    });
}

/** Récupère la liste complète des pouvoirs héros */
function getHeroSkills(hide_loader_on_finish) {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/heroSkills',
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                hero_skills = response.response.sort((a, b) => a.daysNeeded > b.daysNeeded);
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            if(hide_loader_on_finish) {
                endLoading();
            }
        }
    });
}

/** Récupère la liste complète des recettes */
function getRecipes() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/recipes',
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                recipes = response.response.map((recipe) => {
                    recipe.type = action_types.find((type) => type.id === recipe.type);
                    return recipe;
                })
                    .sort((a, b) => a.type.ordering > b.type.ordering);
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
            endLoading();
        }
    });
}


///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////
(function() {
    'use strict';

    if(document.URL.startsWith('https://bbh.fred26.fr/') || document.URL.startsWith('https://gest-hordes2.eragaming.fr/') || document.URL.startsWith('https://fatamorgana.md26.eu/')) {
        let current_key = '';
        if (document.URL.startsWith('https://bbh.fred26.fr/')) {
            current_key = gm_bbh_updated_key
        } else if (document.URL.startsWith('https://gest-hordes2.eragaming.fr/')) {
            current_key = gm_gh_updated_key;
        } else {
            current_key = gm_fata_updated_key;
        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener('visibilitychange', function() {
            if (GM_getValue(current_key) && !document.hidden) {
                GM_setValue(current_key, false);
                location.reload();
            }
        });
    } else {
        if (!buttonOptimizerExists()) {
            createStyles();
            createOptimizerBtn();
            createWindow();
        }

        getMe();
        getItems();
        getWishlist();

        preventFromLeaving();

        setInterval(() => {
            createUpdateExternalToolsButton();
            clickOnVotedToRedirect();
            displayWishlistInApp();
            displayPriorityOnItems();
        }, 500);

        setInterval(() => {
            displayAdvancedTooltips();
        }, 100);
    }

})();
