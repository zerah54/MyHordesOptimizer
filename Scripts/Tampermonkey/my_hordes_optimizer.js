// ==UserScript==
// @name         MyHordes Optimizer
// @description  Optimizer for MyHordes
// @author       Zerah
// @version      0
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
const gm_mho_external_app_id = 'mho_external_app_id';
const gm_parameters_key = 'mh_optimizer_parameters';

let mho_parameters = GM_getValue(gm_parameters_key);
let external_app_id = GM_getValue(gm_mho_external_app_id);


////////////////////
// L'URL de L'API //
////////////////////

const api_url = 'https://myhordesoptimizerapi.azurewebsites.net/';

///////////////////////////////////////////
// Listes de constantes / Constants list //
///////////////////////////////////////////

const img_url = '/build/images/';

const mh_optimizer_icon = img_url + 'icons/small_archive.dabc70be.gif';
const close_icon = img_url + 'icons/b_close.17c6704e.png';

const mh_optimizer_title = "MH Optimizer";
const mh_optimizer_window_id = 'optimizer-window';
const btn_id = 'optimizer-btn';
const mh_header_id = 'header-reload-area';
const mho_update_external_tools_id = 'mho-update-external-tools';

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
    }
};

const categories_mapping = {
    armor : {
        img : "",
        label : {
            de : "Verteidigung",
            en : "Defences",
            es : "Defensas",
            fr : "Défenses"
        },
        ordering : 4
    },
    box : {
        img : "",
        label : {
            de : "Taschen und Behälter",
            en : "Containers and boxes",
            es : "Contenedores y cajas",
            fr : "Conteneurs et boîtes"
        },
        ordering : 3
    },
    drug : {
        img : "",
        label : {
            de : "Apotheke und Labor",
            en : "Pharmacy",
            es : "Farmacia",
            fr : "Pharmacie"
        },
        ordering : 5
    },
    food : {
        img : "",
        label : {
            de : "Grundnahrungsmittel",
            en : "Food",
            es : "Provisiones",
            fr : "Provisions"
        },
        ordering : 6
    },
    furniture : {
        img : "",
        label : {
            de : "Einrichtungen",
            en : "Facilities",
            es : "Objetos caseros",
            fr : "Aménagements"
        },
        ordering : 1
    },
    misc : {
        img : "",
        label : {
            de : "Sonstiges",
            en : "Miscellaneous",
            es : "Otros",
            fr : "Divers"
        },
        ordering : 7
    },
    rsc : {
        img : "",
        label : {
            de : "Baustoffe",
            en : "Resources",
            es : "Recursos",
            fr : "Ressources"
        },
        ordering : 0
    },
    weapon : {
        img : "",
        label : {
            de : "Waffenarsenal",
            en : "Armoury",
            es : "Armería",
            fr : "Armurerie"
        },
        ordering : 2
    }
}

//////////////////////////////////
// La liste des onglets du wiki //
//////////////////////////////////

let tabs_list = {
    wiki: [
        {
            ordering: 0,
            id: 'items',
            label: {en: 'Items', fr: 'Objets', de: 'TODO', es: 'TODO'},
            icon: img_url + 'emotes/bag.2b707aec.gif'
        },
        {
            ordering: 1,
            id: 'recipes',
            label: {en: 'Recipes', fr: 'Recettes', de: 'TODO', es: 'TODO'},
            icon: img_url + 'icons/home.a9951a08.gif'
        }
    ],
    tools: [
        {
            ordering: 0,
            id: 'citizens',
            label: {en: 'Citizens', fr: 'Citoyens', de: 'TODO', es: 'TODO'},
            icon: img_url + 'icons/small_human.46a3e93f.gif'
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
];

//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

let items;
let recipes;
let citizens;

/////////////////////////////////////////
// Fonctions utiles / Useful functions //
/////////////////////////////////////////

/** @return {string}     website language */
function getWebsiteLanguage() {
    return document.getElementsByTagName("html")[0].attributes.lang.value;
}

/** @return {boolean}     true if button exists */
function buttonOptimizerExists() {
    return document.getElementById(btn_id);
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
        title_hidden.innerHTML = mh_optimizer_title;

        let title = document.createElement('h1');
        title.appendChild(img);
        title.appendChild(title_hidden);

        let optimizer_btn = document.createElement('div');
        optimizer_btn.appendChild(title);
        optimizer_btn.id = btn_id;
        optimizer_btn.setAttribute('style', 'left: ' + left_position + 'px');
        optimizer_btn.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        header_zone.appendChild(optimizer_btn);

        createOptimizerButtonContent()
    }, 1000);

}

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */
function createOptimizerButtonContent() {
    let optimizer_btn = document.getElementById(btn_id);
    let content = document.createElement('div');
    content.innerHTML = '';

    if (external_app_id && external_app_id !== '') {
        let wiki_btn = document.createElement('a');
        wiki_btn.classList.add('button');
        wiki_btn.innerHTML = 'Wiki';
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

        let params_title = document.createElement('h1');
        params_title.innerText = 'Paramètres';

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
    } else {
        let help_button = createHelpButton();
        content.appendChild(help_button);

        let keytext = document.createElement('input');
        keytext.setAttribute('type', 'text');

        let keysend = document.createElement('a');
        keysend.classList.add('button');
        keysend.innerHTML = texts.save_external_app_id[lang];
        keysend.addEventListener('click', () => {
            GM_setValue(gm_mho_external_app_id, keytext.value);
            external_app_id = GM_getValue(gm_mho_external_app_id)
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
    window_overlay_img.src = close_icon;
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
    createTabs(window_type);
}

/**
  * Crée le bloc de contenu de la page
  * @param {string} window_tyme     Le type de fenêtre à afficher, correspondant au nom utilisé dans la liste des onglets
  */
function createTabContent(window_type) {
    let window_content = document.getElementById(mh_optimizer_window_id + '-content');

    let tab_content = document.createElement('div');
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
            if (!items) {
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
                            displayItems(items);
                        } else {
                            console.error(`Une erreur s'est produite (Erreur ` + response.status + `). Vérifiez que votre identifiant d'app externe est bien renseigné dans les paramètres de MH Optimizer`);
                        }
                    }
                });
            } else {
                displayItems(items);
            }
            break;
        case 'recipes':
            break;
        case 'citizens':
            displayCitizens();
            break;
        default:
            break;
    }
}

/** Filtre la liste des objets */
function filterItems() {
    return items;
}

/**
  * Affiche la liste des objets
  * @param filtered_items
  */
function displayItems(filtered_items) {
    console.log('items', items);
    let tab_content = document.getElementById('tab-content');
    tab_content.innerHTML = '';

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
            category_container.classList.add('item-category');
            category_container.appendChild(category_img);
            category_container.appendChild(category_text);

            item_list.appendChild(category_container);
        }
        let item_icon = document.createElement('img');
        item_icon.src = img_url + item.img;

        let item_title = document.createElement('span');
        item_title.innerText = item.labels[lang];

        let item_title_container = document.createElement('div');
        item_title_container.appendChild(item_icon);
        item_title_container.appendChild(item_title);

        let item_properties_container = document.createElement('div');

        let item_container = document.createElement('li');
        item_container.appendChild(item_title_container);
        item_container.appendChild(item_properties_container);

        item_list.appendChild(item_container);
    });
}

function displayCitizens() {
    citizens = undefined;
    getTown();
    let tab_content = document.getElementById('tab-content');

    let header_cells = [
        {id: 'name', label: {en: '', fr: 'Nom', de: '', es: ''}, type: 'th'},
        {id: 'nombreJourHero', label: {en: '', fr: 'Nombre de jours héros', de: '', es: ''}, type: 'td'}
    ];
    let interval = setInterval(() => {
        if (citizens) {
            let header_row = document.createElement('tr');

            header_cells.forEach((header_cell) => {
                let cell = document.createElement('th');
                cell.innerText = header_cell.label[lang];
                header_row.appendChild(cell);
            })

            let table = document.createElement('table');
            table.appendChild(header_row);

            tab_content.appendChild(table);
            for (let citizen_key in citizens) {
                let citizen = citizens[citizen_key];
                let citizen_row = document.createElement('tr');
                table.appendChild(citizen_row);

                header_cells.forEach((header_cell) => {
                    let cell = document.createElement(header_cell.type);
                    cell.innerText = citizen[header_cell.id];
                    citizen_row.appendChild(cell);
                })
                console.log('citizen', citizen);
            }

            clearInterval(interval);
        }
    }, 500)
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
    help_tooltip.setAttribute('style', 'display: none');
    help_tooltip.classList.add('tooltip');
    help_tooltip.classList.add('help');
    help_tooltip.innerHTML = texts.external_app_id_help[lang];
    help_button.appendChild(help_tooltip);

    help_button.addEventListener('mouseenter', function() {
        help_tooltip.setAttribute('style', 'display: block; text-transform: initial');
    })
    help_button.addEventListener('mouseleave', function() {
        help_tooltip.setAttribute('style', 'display: none');
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

    let update_external_tools_btn = document.getElementById(mho_update_external_tools_id);
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

        btn.innerHTML = '<img src ="' + img_url + 'emotes/arrowright.7870eca6.gif">' + texts.update_external_tools_needed_btn_label[lang];
        btn.id = mho_update_external_tools_id;

        btn.addEventListener('click', () => {
            /** Au clic sur le bouton, on appelle la fonction de mise à jour */
            btn.innerHTML = '<img src ="' + img_url + 'emotes/middot.d673b4c1.gif">' + texts.update_external_tools_pending_btn_label[lang];
            updateExternalTools();
        })

        updater_bloc.appendChild(btn);
    } else if (update_external_tools_btn) {
        update_external_tools_btn.parentElement.remove();
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
    + 'width: 300px;'
    + '}';

    const mh_optimizer_window_style = '#' + mh_optimizer_window_id + '{'
    + 'background: url(' + img_url + 'assets/img/background/mask.cc224a56..png);'
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
    + 'background: url(' + img_url + 'assets/img/background/bg_content2.a1aebb41..jpg) repeat-y 0 0/900px 263px,url(' + img_url + 'assets/img/background/bg_content2.a1aebb41..jpg) repeat-y 100% 0/900px 263px;'
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
    + 'list-style: none;'
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
    + 'background: url(' + img_url + 'assets/img/background/box/panel_00.3c3a07be..gif) 0 0 no-repeat,url(' + img_url + 'assets/img/background/box/panel_02.985cb8e3..gif) 100% 0 no-repeat,url(' + img_url + 'assets/img/background/box/panel_20.b16ec47b..gif) 0 100% no-repeat,url(' + img_url + 'assets/img/background/box/panel_22.7f7fb6bf..gif) 100% 100% no-repeat,url(' + img_url + 'assets/img/background/box/panel_01.a438e03f..gif) 0 0 repeat-x,url(' + img_url + 'assets/img/background/box/panel_10.20fda3cc..gif) 0 0 repeat-y,url(' + img_url + 'assets/img/background/box/panel_12.1babce5e..gif) 100% 0 repeat-y,url(' + img_url + 'assets/img/background/box/panel_21.347bf032..gif) 0 100% repeat-x,#7e4d2a;'
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
    + 'background: url(' + img_url + 'assets/img/background/tabs-header-plain.5535ca39..gif) 0 100% round;'
    + 'background-size: cover;'
    + 'height: 24px;'
    + 'margin-top: 2px;'
    + 'margin-right: 20px;'
    + 'padding-left: 0.5em;'
    + '}'

    const tabs_ul_li_style = '#tabs ul li {'
    + 'cursor: pointer;'
    + 'display: inline-block;'
    + 'list-style: none;'
    + 'margin-top: auto;'
    + 'margin-bottom: auto;'
    + '}'

    const tabs_ul_li_spacing_style = '#tabs ul li div img {'
    + 'margin-right: 0.5em;'
    + '}'

    const tabs_ul_li_div_style = '#tabs ul li div {'
    + 'background-image: url(' + img_url + 'assets/img/background/tab.1d5bcab7..gif);'
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

    const tabs_ul_li_div_hover_style = '#tabs ul li div:hover {'
    + 'outline: 1px solid #f0d79e;'
    + 'text-decoration: underline;'
    + '}';

    const tabs_ul_li_selected_style = '#tabs ul li.selected {'
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

    const tab_content_item_list_style = '#tab-content ul {'
    + 'display: flex;'
    + 'flex-wrap: wrap;'
    + 'padding: 0;'
    + 'margin: 0 0.5em;'
    + '}';

    const tab_content_item_list_item_style = '#tab-content ul li {'
    + 'min-width: 300px;'
    + 'list-style: none;'
    + 'flex-basis: min-content;'
    + '}';

    const tab_content_item_list_img_style = '#tab-content ul li div img {'
    + 'margin-right: 0.5em;'
    + '}';

    const item_category = '#tab-content ul div.item-category {'
    + 'width: 100%;'
    + 'border-bottom: 1px solid;'
    + 'margin: 0.5em 0;'
    + '}';

    const parameters_ul_style = '#parameters ul {'
    + 'padding: 0;'
    + 'margin: 0;'
    + 'color: #f0d79e;'
    + '}';

    const parameters_ul_li_style = '#parameters ul li {'
    + 'list-style: none;'
    + '}';

    let css = btn_style + btn_hover_h1_span_style + btn_h1_style + btn_h1_img_style + btn_h1_hover_style + btn_h1_span_style + btn_div_style + btn_hover_div_style
    + mh_optimizer_window_style + mh_optimizer_window_hidden + mh_optimizer_window_box_style_hidden + mh_optimizer_window_box_style
    + mh_optimizer_window_overlay_style + mh_optimizer_window_overlay_ul_li_style + mh_optimizer_window_content
    + tabs_style + tabs_ul_style + tabs_ul_li_style + tabs_ul_li_spacing_style + tabs_ul_li_div_style + tabs_ul_li_div_hover_style + tabs_ul_li_selected_style
    + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_img_style + item_category
    + parameters_ul_style + parameters_ul_li_style;

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
}

/** Récupère les informations de la ville */
function getTown() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/town?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                citizens = response.response.citizens;
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
            }
        }
    });
}

function updateExternalTools() {
    let tools_to_update = {
        isBigBrothHordes: mho_parameters ? mho_parameters.update_bbh : false,
        isFataMorgana: mho_parameters ? mho_parameters.update_fata : false,
        isGestHordes: mho_parameters ? mho_parameters.update_gh : false
    };
    let btn = document.getElementById(mho_update_external_tools_id);
    GM_xmlhttpRequest({
        method: 'POST',
        url: api_url + 'externaltools/update?userKey=' + external_app_id,
        data: JSON.stringify (tools_to_update),
        headers: {
            "Content-Type": "application/json"
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
                    ? '<img src ="' + img_url + 'professions/hero.0cdc29a3.gif">' + texts.update_external_tools_success_btn_label[lang]
                : '<img src ="' + img_url + 'emotes/warning.8e2e7b6f.gif">' + texts.update_external_tools_errors_btn_label[lang];
            } else {
                console.error(`Une erreur s'est produite (Erreur ` + response.status + `)`);
                btn.innerHTML = '<img src ="' + img_url + 'professions/death.34e3288c.gif">' + texts.update_external_tools_fail_btn_label[lang];
            }
        }
    });
}

///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////

(function() {
    "use strict";

     if(document.URL.startsWith("https://bbh.fred26.fr/") || document.URL.startsWith("https://gest-hordes2.eragaming.fr/") || document.URL.startsWith("https://fatamorgana.md26.eu/")) {
        let current_key = '';
        if (document.URL.startsWith("https://bbh.fred26.fr/")) {
            current_key = gm_bbh_updated_key
        } else if (document.URL.startsWith("https://gest-hordes2.eragaming.fr/")) {
            current_key = gm_gh_updated_key;
        } else {
            current_key = gm_fata_updated_key;
        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener("visibilitychange", function() {
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
        setInterval(() => {
            createUpdateExternalToolsButton();
        }, 500);
    }

})();