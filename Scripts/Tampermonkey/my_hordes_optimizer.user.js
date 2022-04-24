// ==UserScript==
// @name         MyHordes Optimizer
// @version      1.0.0-alpha.38
// @description  Optimizer for MyHordes - Documentation & fonctionnalités : https://myhordes-optimizer.web.app/script
// @author       Zerah
//
// @icon         https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_16x16.png
// @icon64       https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64.png
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js
// @homepageURL  https://myhordes-optimizer.web.app/script
// @supportURL   lenoune38@gmail.com
//
// @connect      https://myhordesoptimizerapi.azurewebsites.net/
// @connect      *
//
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
// @grant        GM_notification
//
// ==/UserScript==

const changelog = `${GM_info.script.name} : Changelog pour la version ${GM_info.script.version}\n\n`
+ `[Correctif] L'ajout d'une élément de liste de courses à cette liste depuis la page de liste de courses devrait désormais fonctionner correctement`

const lang = (document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2);

const gm_bbh_updated_key = 'bbh_updated';
const gm_gh_updated_key = 'gh_updated';
const gm_fata_updated_key = 'fata_updated';
const gm_mh_external_app_id_key = 'mh_external_app_id';
const gm_parameters_key = 'mh_optimizer_parameters';
const mh_user_key = 'mh_user';
const mho_map_key = 'mho_map';

let mho_parameters = GM_getValue(gm_parameters_key) || {};
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

const mh_optimizer_icon = 'https://github.com/zerah54/MyHordesOptimizer/raw/main/assets/img/logo/logo_mho_64x64_outlined.png';

const mho_title = 'MH Optimizer';
const mh_optimizer_window_id = 'optimizer-window';
const mh_optimizer_map_window_id = 'optimizer-map-window';
const btn_id = 'optimizer-btn';
const mh_header_id = 'header-reload-area';
const mh_update_external_tools_id = 'mh-update-external-tools';
const wiki_btn_id = 'wiki-btn-id';
const zone_dead_zombies_id = 'zone-dead-zombies';
const nb_dead_zombies_id = 'nb-dead-zombies';
const mho_copy_map_id = 'mho-copy-map';
const mho_opti_map_id = 'mho-opti-map';
const mho_display_map_id = 'mho-display-map';
const mho_search_building_field_id = 'mho-search-building-field';
const mho_display_translate_input_id = 'mho-display-translate-input';

const texts = {
    save_external_app_id: {
        en: `Save your external ID for apps`,
        fr: `Enregistrez votre ID d'app externe`,
        de: `Speichern Sie Ihre externe ID für Apps`,
        es: `TODO`
    },
    external_app_id_help: {
        en: `You have to fill your external ID for apps. <br />You can find it by following “My soul” > “Settings” > “Advanced” > “External Applications” `,
        fr: `Vous devez renseigner votre ID externe pour les apps.<br />Celle-ci se trouve dans "Votre âme" > "Réglages" > "Avancés" > "Applications externes"`,
        de: `Sie müssen Ihre externe ID für Apps eingeben. <br /> Sie können es finden indem Sie folgen “Deine Seele” > “Einstellungen” > “Erweitert” > “Externe Anwendungen” `,
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
        de: `Einstellungen`,
        es: `TODO`
    },
    informations_section_label: {
        en: `Informations`,
        fr: `Informations`,
        de: `Informationen`,
        es: `TODO`
    },
    update_external_tools_needed_btn_label: {
        en: `Update external tools`,
        fr: `Mettre à jour les outils externes`,
        de: `Externe Tools Aktualisieren`,
        es: `TODO`
    },
    update_external_tools_pending_btn_label: {
        en: `Updating...`,
        fr: `Mise à jour en cours...`,
        de: `Aktualisierung…`,
        es: `TODO`
    },
    update_external_tools_success_btn_label: {
        en: `Update completed!`,
        fr: `Mise à jour terminée !`,
        de: `Aktualisierung abgeschlossen!`,
        es: `TODO`
    },
    update_external_tools_errors_btn_label: {
        en: `Update completed with errors.`,
        fr: `Mise à jour terminée avec des erreurs.`,
        de: `Aktualisierung mit Fehlern abgeschlossen.`,
        es: `TODO`
    },
    update_external_tools_fail_btn_label: {
        en: `Can not update.`,
        fr: `Impossible de mettre à jour.`,
        de: `Aktualisierung unmöglich`,
        es: `TODO`
    },
    prevent_from_leaving_information: {
        en: `You asked to be notified before leaving if your escort options were not good: `,
        fr: `Vous avez demandé à être prévenu avant de quitter la page si vos options d'escorte ne sont pas les bonnes : `,
        de: `Sie haben dafür gewählt vor der Abreise benachrichtigt zu werden wenn Ihre Eskorte-Optionen nicht gut waren:`,
        es: `TODO`
    },
    prevent_not_in_ae: {
        en: `you are not waiting for an escort.`,
        fr: `vous n'êtes pas en attente d'escorte.`,
        de: `Sie warten nicht auf eine Eskorte.`,
        es: `TODO`
    },
    escort_not_released: {
        en: `you did not let go of your escort`,
        fr: `vous n'avez pas relâché votre escorte.`,
        de: `Sie haben Ihre Eskorte nicht losgelassen`,
        es: `TODO`
    },
    save: {
        en: `Save`,
        fr: `Enregistrer`,
        de: `Speichern`,
        es: `TODO`
    },
    update: {
        en: `Update`,
        fr: `Mettre à jour`,
        de: `Aktualisieren`,
        es: `TODO`
    },
    search_ended: {
        en: `Search completed`,
        fr: `La fouille est terminée`,
        de: `Grabungsaktion fertig`,
        es: `TODO`
    },
    nb_dead_zombies: {
        en: `Number of zombies that died here today`,
        fr: `Nombre de zombies morts sur cette case aujourd'hui`,
        de: `Anzahl der Zombies die heute hier gestorben sind`,
        es: `TODO`
    },
    copy_map: {
        en: `Copy map`,
        fr: `Copier la carte`,
        de: `Karte kopieren`,
        es: `TODO`
    },
    search_building: {
        en: `Search for a construction site`,
        fr: `Rechercher un chantier`,
        de: `Baustelle suchen`,
        es: `TODO`
    },
    translation_file_context: {
        en: `Context (translation file)`,
        fr: `Contexte (fichier de traduction)`,
        de: `Kontext (Übersetzungsdatei)`,
        es: `TODO`,
    },
    display_all_search_result: {
        en: `Display all results`,
        fr: `Afficher tous les résultats`,
        de: `Alle Ergebnisse anzeigen`,
        es: `TODO`
    },
    display_exact_search_result: {
        en: `Only display exact results`,
        fr: `Afficher uniquement les résultats exacts`,
        de: `Nur exakte Ergebnisse anzeigen`,
        es: `TODO`
    }
};

const categories_mapping = {
    armor : {
        id: 'armor',
        img : '',
        label : {
            de : `Verteidigung`,
            en : `Defences`,
            es : `Defensas`,
            fr : `Défenses`
        },
        ordering : 4
    },
    box : {
        id: 'box',
        img : '',
        label : {
            de : `Taschen und Behälter`,
            en : `Containers and boxes`,
            es : `Contenedores y cajas`,
            fr : `Conteneurs et boîtes`
        },
        ordering : 3
    },
    drug : {
        id: 'drug',
        img : '',
        label : {
            de : `Apotheke und Labor`,
            en : `Pharmacy`,
            es : `Farmacia`,
            fr : `Pharmacie`
        },
        ordering : 5
    },
    food : {
        id: 'food',
        img : '',
        label : {
            de : `Grundnahrungsmittel`,
            en : `Food`,
            es : `Provisiones`,
            fr : `Provisions`
        },
        ordering : 6
    },
    furniture : {
        id: 'furniture',
        img : '',
        label : {
            de : `Einrichtungen`,
            en : `Facilities`,
            es : `Objetos caseros`,
            fr : `Aménagements`
        },
        ordering : 1
    },
    misc : {
        id: 'misc',
        img : '',
        label : {
            de : `Sonstiges`,
            en : `Miscellaneous`,
            es : `Otros`,
            fr : `Divers`
        },
        ordering : 7
    },
    rsc : {
        id: 'rsc',
        img : '',
        label : {
            de : `Baustoffe`,
            en : `Resources`,
            es : `Recursos`,
            fr : `Ressources`
        },
        ordering : 0
    },
    weapon : {
        id: 'weapon',
        img : '',
        label : {
            de : `Waffenarsenal`,
            en : `Armoury`,
            es : `Armería`,
            fr : `Armurerie`
        },
        ordering : 2
    }
}

const api_texts = {
    error: {
        en: `An error occured. (Error : $error$)`,
        fr: `Une erreur s'est produite. (Erreur : $error$)`,
        de: `Fehler aufgetreten. (Fehler : $error$)`,
        es: `TODO`
    },
    update_wishlist_success: {
        en: `Shopping list updated.`,
        fr: `La liste de courses a bien été mise à jour.`,
        de: `Einkaufsliste aktualisiert.`,
        es: `TODO`
    },
    add_to_wishlist_success: {
        en: `Item has been added to the shopping list.`,
        fr: `L'objet a bien été ajouté à la liste de courses.`,
        de: `Gegenstand wurde der Einkaufsliste hinzugefügt.`,
        es: `TODO`
    },
};

const action_types = [
    {id: `Manual`, label: {en: `Citizen actions`, fr: `Actions du citoyen`, de: `Bürgeraktionen`, es: `TODO`}, ordering: 1},
    {id: `Workshop`, label: {en: `Workshop`, fr: `Atelier`, de: `Werkstatt`, es: `TODO`}, ordering: 0},
];

const wishlist_priorities = [
    {value: -1000, label: {
        en: `Do not bring to town`,
        fr: `Ne pas ramener`,
        de: `Nicht mitbringen`,
        es: `TODO`
    }},
    {value: 0, label: {
        en: `Not defined`,
        fr: `Non définie`,
        de: `Nicht definiert`,
        es: `TODO`
    }},
    {value: 1000, label: {
        en: `Low`,
        fr: `Basse`,
        de: `Niedrig`,
        es: `TODO`
    }},
    {value: 2000, label: {
        en: `Medium`,
        fr: `Moyenne`,
        de: `Mittel`,
        es: `TODO`
    }},
    {value: 3000, label: {
        en: `High`,
        fr: `Haute`,
        de: `Hoch`,
        es: `TODO`
    }},
];

const wishlist_headers = [
    {label: {
        en: `Item`,
        fr: `Objet`,
        de: `Gegenstand`,
        es: `TODO`
    }, id: `label`},
    {label: {
        en: `Priority`,
        fr: `Priorité`,
        de: `Priorität`,
        es: `TODO`
    }, id: `priority`},
    {label: {
        en: `Stock in bank`,
        fr: `Stock en banque`,
        de: `Bestand in der Bank`,
        es: `TODO`
    }, id: `bank_count`},
    {label: {
        en: `Desired stock`,
        fr: `Stock souhaité`,
        de: `Gewünschter Bestand`,
        es: `TODO`
    }, id: `bank_needed`},
    {label: {
        en: `Missing quantity`,
        fr: `Quantité manquante`,
        de: `Fehlende Menge`,
        es: `TODO`
    }, id: `diff`},
    {label: {en: ``, fr: ``, es: ``, de: ``}, id: 'delete'},
];

//////////////////////////////////
// La liste des onglets du wiki //
//////////////////////////////////

let tabs_list = {
    wiki: [
        {
            ordering: 0,
            id: `items`,
            label: {
                en: `Items`,
                fr: `Objets`,
                de: `Gegenstände`,
                es: `TODO`
            },
            icon: repo_img_url + `emotes/bag.gif`
        },
        {
            ordering: 1,
            id: `recipes`,
            label: {
                en: `Recipes`,
                fr: `Recettes`,
                de: `Rezepte`,
                es: `TODO`
            },
            icon: repo_img_url + `building/small_refine.gif`
        },
        {
            ordering: 2,
            id: `skills`,
            label: {
                en: `Hero Skills`,
                fr: `Pouvoirs`,
                de: `Heldentaten`,
                es: `TODO`
            },
            icon: repo_img_url + `/professions/hero.gif`
        }
    ],
    tools: [
        {
            ordering: 0,
            id: `bank`,
            label: {
                en: `Bank`,
                fr: `Banque`,
                de: `Bank`,
                es: `TODO`
            },
            icon: repo_img_url + `icons/home.gif`
        },
        {
            ordering: 1,
            id: `wishlist`,
            label: {
                en: `Wishlist`,
                fr: `Liste de courses`,
                de: `Wunschzettel`,
                es: `TODO`
            },
            icon: repo_img_url + `item/item_cart.gif`
        },
        {
            ordering: 2,
            id: `citizens`,
            label: {
                en: `Citizens`,
                fr: `Citoyens`,
                de: `Bürger`,
                es: `TODO`
            },
            icon: repo_img_url + `icons/small_human.gif`
        }
    ]
};


//////////////////////////////////////////////
// La liste des paramètres de l'application //
//////////////////////////////////////////////

let params_categories = [
    {id: `external_tools`, label: {
        en: `External tools`,
        fr: `Outils externes`,
        de: `Externen Tool`,
        es: `TODO`
    }, params: [
        {id: `update_bbh`, label: {
            en: `Update BigBroth’Hordes`,
            fr: `Mettre à jour BigBroth'Hordes`,
            de: `BigBroth’Hordes Aktualisieren`,
            es: `TODO`
        }, parent_id: null},
        {id: `update_gh`, label: {
            en: `Update Gest’Hordes`,
            fr: `Mettre à jour Gest'Hordes`,
            de: `Gest’Hordes aktualisieren`,
            es: `TODO`
        }, parent_id: null},
        {id: `update_fata`, label: {
            en: `Update Fata Morgana`,
            fr: `Mettre à jour Fata Morgana`,
            de: `Fata Morgana aktualisieren`,
            es: `TODO`
        }, parent_id: null},
        // {
        //     id: `display_map`,
        //     label: {
        //         en: `Allow to show a map from external tools`,
        //         fr: `Permettre d'afficher une carte issue des outils externes`,
        //         de: `Anzeigen einer Karte von externen Tools ermöglichen`,
        //         es: `TODO`
        //     },
        //     help: {
        //         en: `In any external tool, it will be possible to copy the town or ruin map and to paste it into MyHordes`,
        //         fr: `Dans les outils externes, il sera possible de copier la carte de la ville ou de la ruine, et une fois copiée de l'afficher dans MyHordes`,
        //         de: `In jedem externen Tool wird es möglich sein, die Stadt- oder Ruinenkarte zu kopieren und in MyHordes einzufügen`,
        //         es: `TODO`
        //     },
        //     parent_id: null
        // }
    ]},
    {id: `display`, label: {
        en: `Interface improvements`,
        fr: `Améliorations de l'interface`,
        de: `Benutzeroberfläche Verbesserungen`,
        es: `TODO`
    }, params: [
        {id: `enhanced_tooltips`, label: {
            en: `Show detailed tooltips`,
            fr: `Afficher des tooltips détaillés`,
            de: `Detaillierte Tooltips anzeigen`,
            es: `TODO`
        }, parent_id: null},
        {id: `click_on_voted`, label: {
            en: `Quick navigation to recommended construction site`,
            fr: `Navigation rapide vers le chantier recommandé`,
            de: `Schnelle Navigation zur empfohlenen Baustelle`,
            es: `TODO`
        }, parent_id: null},
        {id: `display_search_field_on_buildings`, label: {
            en: `Show a search field for construction sites`,
            fr: `Afficher un champ de recherche pour les chantiers`,
            de: `Ein Suchfeld für Baustellen anzeigen`,
            es: `TODO`
        }, parent_id: null},
        {id: `display_wishlist`, label: {
            en: `Display wishlist in interface`,
            fr: `Afficher la liste de courses dans l'interface`,
            de: `Wunschzettel in der Benutzeroberfläche anzeigen`,
            es: `TODO`
        }, parent_id: null},
        {id: `display_wishlist_closed`, label: {
            en: `Wishlish folded by default`,
            fr: `Liste de courses repliée par défaut`,
            de: `Wunschzettel standardmäßig gefaltet`,
            es: `TODO`
        }, parent_id: `display_wishlist`},
        {
            id: `display_nb_dead_zombies`,
            label: {
                en: `Show the number of zombie that died today`,
                fr: `Afficher le nombre de zombies morts aujourd'hui`,
                de: `Anzahl der Zombies die heute hier gestorben sind anzeigen`,
                es: `TODO`
            },
            help: {
                en: `Allows to display the number of blood splatters on the map`,
                fr: `Permet d'afficher le nombre de tâches de sang sur la carte`,
                de: `Ermöglicht die Anzeige der Anzahl der Blutfleck auf der Karte`,
                es: `TODO`
            },
            parent_id: null
        },
        {
            id: `display_translate_tool`,
            label: {
                en: `Show MyHordes' item translation bar`,
                fr: `Afficher la barre de traduction des éléments de MyHordes`,
                de: `Übersetzungsleiste für MyHordes Elemente anzeigen`,
                es: `TODO`
            },
            help: {
                en: `Shows a translation bar. You must choose the initial language, then type the searched element to get the other translations.`,
                fr: `Affiche une barre de traduction. Vous devez choisir la langue initiale, puis saisir l'élément recherché pour en récupérer les différentes traductions.`,
                de: `Zeigt eine Übersetzungsleiste an. Sie müssen die Ausgangssprache auswählen, und dann die Zielelemente eingeben um die Übersetzungen zu generieren.`,
                es: `TODO`
            },
            parent_id: null
        },
    ]},
    {id: `notifications`, label: {
        en: `Notices and warnings`,
        fr: `Notifications et avertissements`,
        de: `Hinweise und Warnungen`,
        es: `TODO`
    }, params: [
        {id: `prevent_from_leaving`, label: {
            en: `Request confirmation before leaving without automatic escort`,
            fr: `Demander confirmation avant de quitter en l'absence d'escorte automatique`,
            de: `Bestätigung anfordern bevor Abreise ohne automatische Eskorte`,
            es: `TODO`
        }, parent_id: null},
        {id: `prevent_dangerous_actions`, label: {
            en: `[Experimental] Request confirmation before performing hazardous actions`,
            fr: `[Expérimental] Demander confirmation avant d'effectuer des actions dangereuses`,
            de: `[Experimentell] Bestätigung anfordern, bevor Ausführung gefährliche Aktionen`,
            es: `TODO`
        }, parent_id: null},
        {
            id: `notify_on_search_end`,
            label: {
                en: `Notify me at the end of a search `,
                fr: `Me notifier à la fin de la fouille`,
                de: `Mich Benachrichtigen am Ende einer Grabungsaktion`,
                es: `TODO`
            },
            help: {
                en: `Allows to receive a notification when a search ends if the page was not closed in the meantime`,
                fr: `Permet de recevoir une notification lorsque la fouille est terminée si la page n'a pas été quittée entre temps`,
                de: `Ermöglicht den Erhalt einer Benachrichtigung wann eine Grabungsaktion endet wenn die Seite in der Zwischenzeit nicht geschlossen wurde`,
                es: `TODO`
            },
            parent_id: null
        }
    ]}
];

let informations = [
    {id: `website`, label: {
        en: `Website`,
        fr: `Site web`,
        de: `Webseite`,
        es: `TODO`
    }, src: `https://myhordes-optimizer.web.app/`, action: () => {}, img: `emotes/explo.gif`},
    {id: `version`, label: {
        en: `Changelog ${GM_info.script.version}`,
        fr: `Notes de version ${GM_info.script.version}`,
        de: `Changelog ${GM_info.script.version}`,
        es: `TODO`
    }, src: undefined, action: () => {alert(changelog)}, img: `emotes/rptext.gif`},
    {id: `contact`, label: {
        en: `Bugs? Ideas?`,
        fr: `Des bugs ? Des idées ?`,
        de: `Fehler ? Ideen ?`,
        es: `TODO`
    }, src: `mailto:lenoune38@gmail.com?Subject=[${GM_info.script.name}]`, action: () => {}, img: `icons/small_mail.gif`},
];


//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

let loading_count = 0;

let items;
let recipes;
let citizens;
let hero_skills;
let bank;
let wishlist;

let is_refresh_wishlist;
let dragged = {item: undefined, element: undefined};

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

/** Affiche ou masque la page de chargement de MyHordes en fonction du nombre d'appels en cours */
function displayLoading() {
    let loadzone = document.getElementById('loadzone');
    if (loading_count > 0) {
        loadzone.setAttribute('x-stack', 1);
    } else {
        loadzone.setAttribute('x-stack', 0);
    }
}

/** Affiche la page de chargement de MyHordes */
function startLoading() {
    loading_count += 1;
    displayLoading();
}

/** Masque la page de chargement de MyHordes */
function endLoading() {
    loading_count -= 1;
    displayLoading();
}

/** Affiche une notification de réussite */
function addSuccess(message) {
    let notifications = document.getElementById('notifications');
    let notification = document.createElement('div');
    notification.classList.add('notice', 'show');
    notification.innerText = `${GM_info.script.name} : ${message}`;
    notifications.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
}


/** Affiche une notification de warning */
function addWarning(message) {
    let notifications = document.getElementById('notifications');
    let notification = document.createElement('div');
    notification.classList.add('warning', 'show');
    notification.innerText = `${GM_info.script.name} : ${message}`;
    notifications.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/** Affiche une notification d'erreur */
function addError(error) {
    let notifications = document.getElementById('notifications');
    let notification = document.createElement('div');
    notification.classList.add('error', 'show');
    notification.innerText = `${GM_info.script.name} : ${api_texts.error[lang].replace('$error$', error.status)}`;
    if (error.status === 0) {
        notification.innerText += '\n' + error.error;
    }
    notifications.appendChild(notification);
    notification.addEventListener('click', () => {
        notification.remove();
    });
    setTimeout(() => {
        notification.remove();
    }, 5000);
    console.error(`${GM_info.script.name} : Une erreur s'est produite : \n`, error);
}


function initOptions() {
    preventDangerousActions();
    preventFromLeaving();
    // createDisplayMapButton();
}

/**
 * Copie un texte
 * @param {string} le texte à copier
 */
function copyToClipboard(text) {
    let input = document.createElement('input');
    input.value = text;

    document.body.appendChild(input);
    input.select();

    document.execCommand('copy');
    input.remove();
}

function createSelectWithSearch() {

    let select_complete = document.createElement('div');

    let select = document.createElement('label');

    let input = document.createElement('input');
    input.type = 'text';

    let close = document.createElement('div');
    close.innerHTML = '&#128473';
    close.setAttribute('style', 'position: relative; float: right; top: -25px; color: #5c2b20;');

    select.appendChild(input);
    select.appendChild(close);

    select_complete.appendChild(select);

    let options = document.createElement('div');
    options.classList.add('hidden');
    options.setAttribute('style', 'position: absolute; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');

    input.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            options.classList.remove('hidden');
        }
    });
    close.addEventListener('click', () => {
        options.classList.add('hidden');
        input.value = '';
    });
    select_complete.appendChild(options);
    return select_complete;
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
        img.setAttribute('height', '16px');
        img.setAttribute('width', '16px');

        let title_hidden = document.createElement('span');
        title_hidden.classList.add('label_text');
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

        createOptimizerButtonContent();
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

        content.appendChild(createParams());

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
            information_link.innerHTML = (information.img ? `<img src="${repo_img_url + information.img}" style="margin: 0 4px 0 3px">` : ``)+ `<span class=small>${information.label[lang]}</span>`;
            information_link.href = information.src;
            information_link.target = '_blank';

            if (!information.src) {
                information_link.addEventListener('click', (event) => {
                    event.preventDefault();
                    information.action();
                });
            }

            let information_container = document.createElement('li');
            information_container.appendChild(information_link);

            informations_list.appendChild(information_container);
        });

        content.appendChild(infomations_container);

    } else {
        let help_button = createHelpButton(texts.external_app_id_help[lang]);
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

function createParams() {
    let params_title = document.createElement('h1');
    params_title.innerText = texts.parameters_section_label[lang];

    let categories_list = document.createElement('ul');

    let categories_container = document.createElement('div');
    categories_container.id = 'categories';

    categories_container.appendChild(params_title);
    categories_container.appendChild(categories_list);

    params_categories.forEach((category) => {
        let category_container = document.createElement('li');
        let category_title = document.createElement('h5');
        category_title.innerText = category.label[lang];
        categories_list.appendChild(category_container);
        let category_content = document.createElement('ul');
        category_content.classList.add('parameters');
        category_container.appendChild(category_title);
        category_container.appendChild(category_content);
        category.params.forEach((param) => {
            let param_children = category.params.filter((param_child) => param_child.parent_id === param.id);
            let param_input = document.createElement('input');
            param_input.type = 'checkbox';
            param_input.id = param.id + '-intput';
            param_input.checked = mho_parameters && mho_parameters[param.id] ? mho_parameters[param.id] : false;

            let param_label = document.createElement('label');
            param_label.classList.add('small');
            param_label.htmlFor = param.id + '-input';
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

                /** Si l'option a des "enfants" alors on les affiche uniquement si elle est cochée */
                if (param_children.length > 0) {
                    param_children.forEach((param_child) => {
                        let child = document.getElementById(param_child.id);
                        if (event.target.checked) {
                            child.classList.remove('hidden');
                        } else {
                            child.classList.add('hidden');
                        }
                    });
                }

                // Quand on change une option, trigger à nouveau certaines vérifications pour ne pas avoir à les vérifier tout le temps (=> perf !)
                initOptions();
            });

            let param_container = document.createElement('li');
            param_container.id = param.id;
            param_container.appendChild(param_input);
            param_container.appendChild(param_label);

            if (param.help) {
                let param_help = createHelpButton(param.help[lang]);
                param_help.setAttribute('style', 'float: right; margin-top: 4px');
                param_container.appendChild(param_help);
            }

            /** Si l'option a un parent, alors on ajoute une marge et on l'affiche uniquement si elle est cochée */
            if (param.parent_id) {
                param_container.setAttribute('style', 'margin-left: 1em;');
                if (!mho_parameters || !mho_parameters[param.parent_id]) {
                    param_container.classList.add('hidden');
                }
            }
            category_content.appendChild(param_container);
        });

    });
    return categories_container;
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

    let window = document.createElement('div');
    window.id = mh_optimizer_window_id;
    window.appendChild(window_box);

    let post_office = document.getElementById('post-office');
    if (post_office) {
        post_office.parentNode.insertBefore(window, post_office.nextSibling);
    }
    window_overlay_img.addEventListener('click', () => {
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

    let current_tabs_list = tabs_list[window_type].sort((a, b) => {
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

/** Crée la fenêtre de wiki */
function createMapWindow() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    let window_content = document.createElement('div');
    window_content.id = mh_optimizer_map_window_id + '-content';
    window_content.setAttribute('style', 'height: 100%; position: initial;');
    let window_overlay_img = document.createElement('img');
    window_overlay_img.alt = '(X)';
    window_overlay_img.src = repo_img_url + 'icons/b_close.png';
    let window_overlay_li = document.createElement('li');
    window_overlay_li.appendChild(window_overlay_img);
    let window_overlay_ul = document.createElement('ul');
    window_overlay_ul.appendChild(window_overlay_li);

    let window_overlay = document.createElement('div');
    window_overlay.id = mh_optimizer_map_window_id + '-overlay';
    window_overlay.setAttribute('style', 'cursor: move; width: 100%;');

    let window_box = document.createElement('div');
    window_box.id = mh_optimizer_map_window_id + '-box';
    window_box.draggable = true;

    let window = document.createElement('div');
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
            tab_content_header.setAttribute('style', 'margin: 0 0.5em; display: flex; justify-content: space-between; height: 25px;');
            tab_content.appendChild(tab_content_header);

            let save_button = document.createElement('button');
            save_button.setAttribute('style', 'width: 250px;');
            save_button.classList.add('inline');
            save_button.innerText = texts.save[lang];
            save_button.addEventListener('click', () => {
                updateWishlist();
            });

            let add_item_with_search = createSelectWithSearch();
            add_item_with_search.setAttribute('style', 'width: 350px; text-align: center;');
            let label = add_item_with_search.firstElementChild;
            let input = label.firstElementChild;
            let close = label.lastElementChild;
            input.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    let wishlist_items = Array.from(wishlist_list.getElementsByTagName('li')).map((wishlist_item) => wishlist_item.getElementsByClassName('label')[0].textContent);
                    options.childNodes.forEach((option) => {
                        let already_in_wishlist = wishlist_items.some((wishlist_item) => option.firstElementChild.textContent === wishlist_item);

                        if (!already_in_wishlist && option.firstElementChild.textContent.toLowerCase().indexOf(input.value.toLowerCase()) > -1) {
                            option.classList.remove('hidden');
                        } else {
                            option.classList.add('hidden');
                        }
                    })
                }
            });
            let options = add_item_with_search.lastElementChild;
            options.style.width = '350px';
            items.forEach((item) => {
                let content_div = document.createElement('div');
                let img = document.createElement('img');
                img.src = hordes_img_url + item.img;
                img.setAttribute('style', 'margin-right: 8px');

                let button_div = document.createElement('div');
                let button = document.createElement('button');
                button_div.appendChild(button);
                button.innerHTML = '&#43;';
                button.setAttribute('style', 'font-size: 16px');
                button.addEventListener('click', () => {
                    let wishlist_item = {
                        item: item,
                        priority: 0,
                        count: 1,
                        bankCount: item.bankCount,
                    }
                    wishlist.wishList.push(wishlist_item);
                    wishlist_list.insertBefore(createWishlistItemElement(wishlist_item), wishlist_list.firstElementChild.nextSibling);
                    close.click();
                });
                content_div.setAttribute('style', 'text-align: left; display: flex; justify-content: space-between; padding: 6px;');

                content_div.innerHTML = `<div>${img.outerHTML}${item.label[lang]}</div>`;
                content_div.appendChild(button_div);
                options.appendChild(content_div);

            });
            tab_content_header.appendChild(add_item_with_search);
            tab_content_header.appendChild(save_button);

            let wishlist_list = document.createElement('ul');
            wishlist_list.id = 'wishlist';
            tab_content.appendChild(wishlist_list);

            let list_header = document.createElement('div');
            list_header.classList.add('mho-header');
            wishlist_list.appendChild(list_header);

            wishlist_headers.forEach((header) => {
                let header_cell = document.createElement('div');
                header_cell.innerText = header.label[lang];
                header_cell.classList.add(header.id);
                list_header.appendChild(header_cell);
            });

            wishlist.wishList
                .filter((item) => item.count > 0)
                .forEach((item) => {
                wishlist_list.appendChild(createWishlistItemElement(item));
            });
        }
    }, 500);
}

function createWishlistItemElement(item) {
    let getLi = (target) => {
        while (target.nodeName.toLowerCase() !== 'li' && target.nodeName.toLowerCase() !== 'body') {
            target = target.parentNode;
        }
        if (target.nodeName.toLowerCase() == 'body') {
            return false;
        } else {
            return target;
        }
    };

    let item_element = document.createElement('li');
    item_element.draggable = true;
    item_element.setAttribute('itemId', item.item.xmlId);
    item_element.addEventListener('dragstart', (event) => {
        let target = getLi(event.target);
        dragged.element = target;
        dragged.item = item;
    });
    item_element.addEventListener('dragover', function(event) {
        event.preventDefault();
    });
    item_element.addEventListener('dragenter', (event) => {
        let target = getLi(event.target);
        if (target !== dragged.element) {
            target.style['border-bottom'] = '12px solid rgba(0, 0, 0, 0.25)';
        }
    });
    item_element.addEventListener('dragleave', (event) => {
        let target = getLi(event.target);
        target.style['border-bottom'] = '';
    }, false);
    item_element.addEventListener('drop', (event) => {
        event.preventDefault();
        let target = getLi(event.target);
        if (target !== dragged.element) {
            target.style['border-bottom'] = '';
            dragged.element.remove();
            target.parentNode.insertBefore(dragged.element, target.nextSibling);
            dragged.element = undefined;
            dragged.item = undefined;
        }
    });

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
        if (item.priority.toString().slice(0, 1) === priority.value.toString().slice(0,1)) {
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

    return item_element;
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
            category_container.classList.add('mho-category', 'mho-header');
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
            add_to_wishlist_button.addEventListener('click', () => {
                addItemToWishlist(item, item_add_to_wishlist);
            })

            let img = document.createElement('img');
            img.src = `${repo_img_url}item/item_cart.gif`;
            img.alt = '&#x1F6D2;';
            add_to_wishlist_button.appendChild(img);
            item_add_to_wishlist.appendChild(add_to_wishlist_button);
        }

        let icon_container = document.createElement('span');
        icon_container.setAttribute('style', 'margin-right: 0.5em');
        item_title_container.appendChild(icon_container);

        let item_icon = document.createElement('img');
        item_icon.src = hordes_img_url + item.img;
        icon_container.appendChild(item_icon);

        if (tab_id === 'bank' && item.count > 1) {
            let item_count = document.createElement('span');
            item_count.setAttribute('style', 'vertical-align: sub; font-size: 10px;')
            item_count.innerText = item.count;
            icon_container.appendChild(item_count);
        }

        let item_title = document.createElement('span');
        item_title.classList.add('label_text');
        item_title.innerText = item.label[lang];
        item_title_container.appendChild(item_title);

        let item_properties_container = document.createElement('div');
        item_properties_container.classList.add('properties');

        item_properties_container.innerHTML = `<span class="small">${item.description[lang]}</span>`;

        if (item.properties) {
            let item_properties = document.createElement('div');
            item_properties_container.appendChild(item_properties);
            item.properties.forEach((property) => {
                let item_action = displayPropertiesOrActions(property, item);
                item_properties.appendChild(item_action);
            });
        }
        if (item.actions) {
            let item_actions = document.createElement('div');
            item_properties_container.appendChild(item_actions);
            item.actions.forEach((action) => {
                let item_action = displayPropertiesOrActions(action, item);
                item_actions.appendChild(item_action);
            });
        }

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
                {id: 'nombreJourHero', label: {en: '', fr: 'Jours héros', de: '', es: ''}, type: 'td'},
                {id: 'lastSkill', label: {en: '', fr: 'Dernier pouvoir gagné', de: '', es: ''}, type: 'td'},
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
            header_row.classList.add('mho-header');

            header_cells.forEach((header_cell) => {
                let cell = document.createElement('th');
                if (cell.img) {
                    cell.innerHTML = '<img src="' + repo_img_url + header_cell.img + '.gif"></img>'
                } else {
                    cell.innerText = header_cell.label[lang];
                }
                header_row.appendChild(cell);
            });

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
                            case 'lastSkill':
                                cell.innerText = hero_skills.find((skill) => skill.daysNeeded >= citizen.nombreJourHero).label[lang];
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
                            case 'lastSkill':
                                cell.innerText = hero_skills.find((skill) => skill.daysNeeded >= citizen.nombreJourHero).label[lang];
                                break;
                            default:
                                cell.innerText = '';
                                break;
                        }
                    }
                    citizen_row.appendChild(cell);
                });
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
        header_row.classList.add('mho-header');
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
        getHeroSkills();
        let interval = setInterval(() => {
            if (hero_skills) {
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
                category_container.classList.add('mho-category');
                category_container.classList.add('mho-header');
                category_container.appendChild(category_text);

                recipes_list.appendChild(category_container);
            }

            recipes_list.appendChild(getRecipeElement(recipe));
        });

    } else {
        getRecipes();
        let interval = setInterval(() => {
            if (recipes) {
                displayRecipes()
                clearInterval(interval);
            }
        }, 500);
    }
}

/** Affiche une recette */
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
        component_label.classList.add('label_text');
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
        result_label.classList.add('label_text');
        result_label.innerText = result.item.label[lang];
        result_container.appendChild(result_label);

        if (result.probability !== 1) {
            let result_proba = document.createElement('span');
            result_proba.setAttribute('style', 'font-style: italic; color: #ddab76;');
            result_proba.classList.add('label_text');
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
    help_tooltip.setAttribute('style', 'text-transform: initial;');
    help_tooltip.innerHTML = text_to_display;
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

/** Affiche le bouton de mise à jour des outils externes */
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
        if (update_external_tools_btn) return;

        let el = zone_marker.parentElement;

        let updater_bloc = document.createElement('div');
        el.appendChild(updater_bloc);
        let updater_title = document.createElement('h5');
        updater_title.innerHTML = GM_info.script.name;
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

/** Si l'option associée est activée, affiche un champ de recherche sur la page de chantiers */
function displaySearchFieldOnBuildings() {
    let search_field = document.getElementById(mho_search_building_field_id);
    if (mho_parameters.display_search_field_on_buildings && pageIsConstructions()) {
        if (search_field) return;

        let tabs = document.querySelector('ul.buildings-tabs');
        if (tabs) {
            let tabs_block = tabs.parentElement;

            let search_field_container = document.createElement('div');

            search_field = document.createElement('input');
            search_field.type = 'text';
            search_field.id = mho_search_building_field_id;
            search_field.placeholder = texts.search_building[lang];
            search_field.classList.add('inline');
            search_field.setAttribute('style', 'min-width: 250px; margin-top: 1em;');

            let buidings_block = document.getElementsByClassName('clear')[0];
            let buildings = Array.from(buidings_block.getElementsByClassName('buildings'));
            let building_rows = Array.from(buidings_block.getElementsByClassName('row'));
            search_field.addEventListener('keyup', (event) => {
                building_rows.forEach((building_row) => {
                    if (building_row.getElementsByTagName('span')[0].innerText.toLowerCase().indexOf(search_field.value.toLowerCase()) > -1) {
                        building_row.classList.remove('hidden');
                    } else {
                        building_row.classList.add('hidden');
                    }
                });

                buildings.forEach((building) => {
                    if(Array.from(building.children).every((child) => child.classList.contains('hidden'))) {
                       building.classList.add('hidden');
                       } else {
                           building.classList.remove('hidden');
                       }
                });
            });

            search_field_container.appendChild(search_field);
            tabs_block.insertBefore(search_field_container, tabs);
        }
    } else if (search_field) {
        search_field.parentElement.remove();
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
                is_refresh_wishlist = true;
                wishlist = undefined;
                getWishlist();
            });
            update_section.appendChild(update_btn);

            let list = document.createElement('div');
            list.classList.add('row-table');
            content.appendChild(list);

            let list_header = document.createElement('div');
            list_header.classList.add('row-flex', 'mho-header', 'bottom');
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
                title.innerHTML = `<img src="${hordes_img_url + item.item.img}" class="priority_${item.priority}"  style="margin-right: 5px" /><span class="small">${item.item.label[lang]}</span>`;
                list_item.appendChild(title);

                let item_priority = document.createElement('span');
                item_priority.classList.add('padded', 'cell', 'rw-3');
                item_priority.innerHTML = `<span class="small">${wishlist_priorities.find((priority) => item.priority.toString().slice(0, 1) === priority.value.toString().slice(0, 1)).label[lang]}</span>`;
                list_item.appendChild(item_priority);

                let bank_count = document.createElement('span');
                bank_count.classList.add('padded', 'cell', 'rw-2');
                bank_count.innerHTML = `<span class="small">${item.bankCount}</span>`;
                list_item.appendChild(bank_count);

                let bank_need = document.createElement('span');
                bank_need.classList.add('padded', 'cell', 'rw-2');
                bank_need.innerHTML = `<span class="small">${item.count}</span>`;
                list_item.appendChild(bank_need);

                let needed = document.createElement('span');
                needed.classList.add('padded', 'cell', 'rw-2');
                needed.innerHTML = `<span class="small">${item.count - item.bankCount}</span>`;
                list_item.appendChild(needed);
            });


            if (mho_parameters.display_wishlist_closed && !is_refresh_wishlist) {
                hide_state.innerText = '>';
                header_title.show = false;

                list.classList.add('hidden');
                update_section.classList.add('hidden');
            } else {
                hide_state.innerText = '˅';
                header_title.show = true;
            }
            header_title.addEventListener('click', () => {
                if (header_title.show) {
                    hide_state.innerText = '>';
                } else {
                    hide_state.innerText = '˅';
                }
                list.classList.toggle('hidden');
                update_section.classList.toggle('hidden');
                header_title.show = !header_title.show;
            });
            is_refresh_wishlist = false
        };

        wishlist_section = document.createElement('div');
        wishlist_section.id = 'wishlist-section';
        wishlist_section.classList.add('row');

        if (pageIsWorkshop()) {
            let workshop_table = document.getElementsByClassName('row-table')[0];
            if (workshop_table) {
                workshop_table.parentNode.insertBefore(wishlist_section, workshop_table.nextSibling);
            }
        } else {
            let actions_box = document.getElementsByClassName('actions-box')[0];
            if (actions_box) {
                let main_actions = actions_box.parentNode;
                main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
            }
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
            .filter((wishlist_item) => wishlist_item.priority !== 0)
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
    if (mho_parameters.enhanced_tooltips && items) {
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

            if (hovered_item) {
                let tooltip_content = tooltip_container.firstElementChild;

                let item_deco = tooltip_content.getElementsByClassName('item-tag-deco')[0];
                let should_display_advanced_tooltip = hovered_item.recipes.length > 0 || hovered_item.actions || hovered_item.properties || (item_deco && hovered_item.deco > 0);
                if (should_display_advanced_tooltip) {
                    if (!advanced_tooltip_container) {
                        advanced_tooltip_container = document.createElement('div');
                        advanced_tooltip_container.id = 'mho-advanced-tooltip';
                        advanced_tooltip_container.setAttribute('style', 'margin-top: 0.5em; border-top: 1px solid;');

                        tooltip_content.appendChild(advanced_tooltip_container);
                    } else if (!advanced_tooltip_container.innerHTML) {
                        advanced_tooltip_container.innerHtml = '';

                        console.log('hovered_item', hovered_item);
                        if (item_deco && hovered_item.deco > 0) {
                            let text = item_deco.innerText.replace(/ \(.*\)*/, '');
                            item_deco.innerHTML = `<span>${text} <em>( +${hovered_item.deco} )</em></span>`;
                        }

                        if (hovered_item.properties) {
                            let item_properties = document.createElement('div');
                            advanced_tooltip_container.appendChild(item_properties);
                            hovered_item.properties.forEach((property) => {
                                let item_action = displayPropertiesOrActions(property, hovered_item);
                                item_properties.appendChild(item_action);
                            });
                        }
                        if (hovered_item.actions) {
                            let item_actions = document.createElement('div');
                            advanced_tooltip_container.appendChild(item_actions);
                            hovered_item.actions.forEach((action) => {
                                let item_action = displayPropertiesOrActions(action, hovered_item);
                                item_actions.appendChild(item_action);
                            });
                        }

                        if (hovered_item.recipes.length > 0) {
                            tooltip_container.firstElementChild.classList.add('large-tooltip');
                            let item_recipes = document.createElement('div');
                            item_recipes.classList.add('recipe');
                            advanced_tooltip_container.appendChild(item_recipes);

                            hovered_item.recipes.forEach((recipe) => {
                                item_recipes.appendChild(getRecipeElement(recipe));
                            });
                        }
                    }
                } else if (advanced_tooltip_container) {
                    advanced_tooltip_container.remove();
                }
            }
        } else if (advanced_tooltip_container) {
            advanced_tooltip_container.remove();
        }
    }
}

/** Affiche les propriétés ou les actions associées à l'objet survolé */
function displayPropertiesOrActions(property_or_action, hovered_item) {
    let item_action = document.createElement('div');
    // TODO MAPPING BACK
    item_action.classList.add('item-tag');
    switch (property_or_action) {
        case 'eat_6ap':
        case 'eat_7ap':
            item_action.classList.add(`item-tag-food`);
            item_action.innerHTML = `+${property_or_action.slice(4,5)}<img src="${repo_img_url}emotes/ap.${lang}.gif">`;
            break;
        case 'drug_6ap_1':
        case 'drug_8ap_1':
            item_action.classList.add(`item-tag-drug`);
            item_action.innerHTML = `+${property_or_action.slice(5,6)}<img src="${repo_img_url}emotes/ap.${lang}.gif">`;
            break;
        case 'alcohol':
            item_action.classList.add(`item-tag-alcohol`);
            item_action.innerHTML = `+6<img src="${repo_img_url}emotes/ap.${lang}.gif">`;
            break;
        case 'cyanide':
            item_action.innerHTML = `<img src="${repo_img_url}emotes/death.gif">`;
            break;
        case 'hero_find':
            if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky'))) {
                item_action.classList.add(`item-tag-hero`);
                item_action.innerHTML = `Trouvaille`;
            } else {
                item_action.classList.remove('item-tag');
            }
            break;
        case 'hero_find_lucky':
            item_action.classList.add(`item-tag-hero`);
            item_action.innerHTML = `Trouvaille améliorée`;
            break;
        case 'ressource':
            item_action.innerHTML = `Ressource`;
            break;
        case 'flash_photo_1':
            var fail_1 = Math.round(60/90*100);
            item_action.innerHTML = `${100-fail_1}% de chances de pouvoir fuir pendant 30 secondes`;
            break;
        case 'flash_photo_2':
            var fail_2 = Math.round(30/90*100);
            item_action.innerHTML = `${100-fail_2}% de chances de pouvoir fuir pendant 60 secondes`;
            break;
        case 'flash_photo_3':
            var fail_3 = 1;
            item_action.innerHTML = `Succès : ${100-fail_3}% de chances de pouvoir fuir pendant 120 secondes`;
            break;
        case 'can_cook':
            item_action.innerHTML = `Peut être cuisiné`;
            break;
        case 'pet':
            item_action.innerHTML = `Animal`;
            break;
        case 'can_poison':
            item_action.innerHTML = `Peut être empoisonné`;
            break;
        case 'load_maglite':
        case 'load_lamp':
        case 'load_pilegun':
        case 'load_radio':
        case 'load_dildo':
        case 'load_lpointer':
        case 'load_mixergun':
        case 'load_taser':
        case 'load_chainsaw':
        case 'load_pilegun3':
        case 'load_pilegun2':
        case 'load_emt':
        case 'load_rmk2':
            item_action.classList.add(`item-tag-load`);
            item_action.innerHTML = `Peut être rechargé`;
            break;
        case 'smokebomb':
            item_action.classList.add(`item-tag-smokebomb`);
            item_action.innerHTML = `Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)`
            break;
        case 'improve':
            item_action.innerHTML = `Objet de camping`
            break;
        case 'defence':
            // déjà affichés par le jeu
            item_action.classList.remove('item-tag');
            break;
        case 'drug_6ap_2':
        case 'drug_8ap_2':
            // ne pas afficher
            item_action.classList.remove('item-tag');
            break;
        case 'box_opener':
        case 'can_opener':
        case 'parcel_opener':
        case 'impoundable':
        case 'nw_ikea':
        case 'nw_armory':
        case 'hero_surv_1':
        case 'food':
        case 'weapon':
        case 'drug':
        case 'nw_trebuchet':
        case 'esc_fixed':
        case 'slaughter_2xs':
        case 'throw_animal_cat':
        case 'prevent_night':
        case 'parcel_opener_h':
        case 'hero_tamer_3':
        case 'throw_b_chair_basic':
        case 'throw_b_machine_1':
        case 'throw_b_machine_2':
        case 'throw_b_machine_3':
        case 'cuddle_teddy_2':
        case 'lock':
        case 'home_store_plus2':
        case 'home_store_plus':
        case 'home_def_plus':
        case 'throw_b_pc':
        case 'slaughter_bmb':
        case 'throw_animal_angryc':
        case 'special_guitar':
        case 'fire_pilegun':
        case 'fire_taser':
        case 'fill_asplash1':
        case 'fill_asplash2':
        case 'throw_b_screw':
        case 'throw_b_wrench':
        case 'throw_b_staff':
        case 'throw_b_knife':
        case 'throw_b_small_knife':
        case 'throw_b_cutter':
        case 'throw_b_can_opener':
        case 'fill_grenade1':
        case 'fill_grenade2':
        case 'fill_splash1':
        case 'fill_splash2':
        case 'fire_pilegun3':
        case 'throw_b_chain':
        case 'nw_shooting':
        case 'fire_splash3':
        case 'throw_b_torch_off':
        case 'throw_boomfruit':
        case 'throw_animal_dog':
        case 'throw_b_concrete_wall':
        case 'drug_xana1':
        case 'drug_xana2':
        case 'drug_xana3':
        case 'drug_xana4':
        case 'bandage':
        case 'drug_hyd_1':
        case 'drug_hyd_2':
        case 'drug_hyd_3':
        case 'drug_hyd_4':
        case 'drug_hyd_5':
        case 'drug_hyd_6':
        case 'drug_rand_1':
        case 'drug_rand_2':
        case 'drug_par_1':
        case 'drug_par_2':
        case 'drug_par_3':
        case 'drug_par_4':
        case 'prevent_terror':
        case 'read_rp_cover':
        case 'found_poisoned':
        case 'is_water':
        case 'water_tl0':
        case 'water_tl1a':
        case 'water_tl1b':
        case 'water_tl2':
        case 'water_g':
        case 'can':
        case 'can_t1':
        case 'can_t2':
        case 'open_doggybag':
        case 'special_dice':
        case 'slaughter_2x':
        case 'throw_animal':
        case 'slaughter_4xs':
        case 'repair_2':
        case 'zonemarker_1':
        case 'nessquick':
        case 'bomb_2':
        case 'repair_1':
        case 'light_cig':
        case 'poison_1':
        case 'bp_bunker_2':
        case 'fire_mixergun':
        case 'fire_chainsaw':
        case 'throw_b_lawn':
        case 'throw_b_cutcut':
        case 'throw_b_swiss_knife':
        case 'fill_jsplash':
        case 'throw_grenade':
        case 'throw_projector':
        case 'throw_exgrenade':
        case 'fill_exgrenade1':
        case 'fill_exgrenade2':
        case 'fire_asplash3':
        case 'fire_asplash2':
        case 'fire_asplash1':
        case 'throw_jerrygun':
        case 'throw_b_bone':
        case 'fire_splash2':
        case 'fire_splash1':
        case 'fire_asplash5':
        case 'fire_asplash4':
        case 'fire_pilegun2':
        case 'throw_phone':
        case 'fire_ksplash':
        case 'fire_lpointer4':
        case 'fire_lpointer3':
        case 'fire_lpointer2':
        case 'fire_lpointer1':
        case 'throw_hurling_stick':
        case 'open_metalbox':
        case 'open_metalbox_t1':
        case 'open_metalbox_t2':
        case 'open_metalbox2':
        case 'open_metalbox2_t1':
        case 'open_metalbox2_t2':
        case 'open_toolbox':
        case 'open_toolbox_t1':
        case 'open_toolbox_t2':
        case 'open_c_chest':
        case 'open_gamebox':
        case 'open_letterbox':
        case 'open_justbox':
        case 'open_matbox3':
        case 'open_matbox2':
        case 'open_matbox1':
        case 'open_h_chest':
        case 'open_postbox':
        case 'open_lunchbag':
        case 'open_safe':
        case 'open_abox':
        case 'open_asafe':
        case 'open_catbox':
        case 'open_catbox_t1':
        case 'open_catbox_t2':
        case 'open_xmasbox3':
        case 'open_xmasbox2':
        case 'open_xmasbox1':
        case 'open_postbox_xl':
        case 'throw_b_torch':
        case 'pumpkin':
        case 'drug_beta_bad_1':
        case 'drug_beta_bad_2':
        case 'drug_beta':
        case 'ghoul_serum':
        case 'drug_lsd_1':
        case 'drug_lsd_2':
        case 'drug_april_1':
        case 'drug_april_2':
        case 'eat_meat_1':
        case 'eat_meat_2':
        case 'coffee':
        case 'open_foodbox_in':
        case 'open_foodbox_out':
        case 'open_foodbox_in_t1':
        case 'open_foodbox_out_t1':
        case 'open_foodbox_in_t2':
        case 'open_foodbox_out_t2':
        case 'eat_bone_1':
        case 'eat_bone_2':
        case 'fill_watercan1':
        case 'watercan1_tl0':
        case 'watercan1_tl1a':
        case 'watercan1_tl1b':
        case 'watercan1_tl2':
        case 'watercan1_g':
        case 'fill_watercan2':
        case 'watercan2_tl0':
        case 'watercan2_tl1a':
        case 'watercan2_tl1b':
        case 'watercan2_tl2':
        case 'watercan2_g':
        case 'watercan3_tl0':
        case 'watercan3_tl1a':
        case 'watercan3_tl1b':
        case 'watercan3_tl2':
        case 'watercan3_g':
        case 'eat_fleshroom_1':
        case 'eat_fleshroom_2':
        case 'eat_cadaver_1':
        case 'eat_cadaver_2':
        case 'alcohol_dx':
        case 'water_no_effect':
        case 'potion_tl0a':
        case 'potion_tl0b':
        case 'potion_tl1a':
        case 'potion_tl1b':
        case 'potion_tl2':
        case 'potion_g':
        case 'potion_tl0a_immune':
        case 'potion_tl0b_immune':
        case 'potion_tl1a_immune':
        case 'potion_tl1b_immune':
        case 'potion_tl2_immune':
        case 'potion_g_immune':
        case 'drug_rand_xmas':
        case 'read_rp':
        case 'slaughter_4x':
        case 'vibrator':
        case 'jerrycan_1':
        case 'jerrycan_1b':
        case 'jerrycan_2':
        case 'jerrycan_3':
        case 'emt':
        case 'special_card':
        case 'flare':
        case 'zonemarker_2':
        case 'fill_watercan0':
        case 'bomb_1':
        case 'watercup_1':
        case 'watercup_1b':
        case 'watercup_2':
        case 'watercup_3':
        case 'read_banned_note':
        case 'throw_sandball':
        case 'bp_generic_1':
        case 'bp_generic_2':
        case 'bp_generic_3':
        case 'bp_generic_4':
        case 'open_cbox':
        case 'bp_hotel_2':
        case 'bp_hotel_3':
        case 'bp_hotel_4':
        case 'bp_bunker_3':
        case 'bp_bunker_4':
        case 'bp_hospital_2':
        case 'bp_hospital_3':
        case 'bp_hospital_4':
        case 'purify_soul':
        case 'clean_clothes':
        case 'hero_hunter_1':
        case 'hero_hunter_2':
        case 'hero_tamer_1':
        case 'hero_tamer_1b':
        case 'hero_tamer_2':
        case 'hero_tamer_2b':
        case 'hero_surv_2':
        case 'alarm_clock':
            item_action.classList.remove('item-tag');
            break;
        default:
            console.log(property_or_action);
            break;
    }
    return item_action;
}

function createDisplayMapButton() {
    let interval = setInterval(() => {
        let display_map_btn = document.getElementById(mho_display_map_id);

        if (mho_parameters.display_map) {
            if (display_map_btn) return;

            let btn_container = document.createElement('div');
            btn_container.id = mho_display_map_id;
            let postbox = document.getElementById('postbox');
            let position = postbox.getBoundingClientRect().width + 15;
            btn_container.setAttribute('style', `right: ${position}px`);

            let btn = document.createElement('div');
            btn.innerHTML = '<img src ="' + repo_img_url + 'emotes/explo.gif">';
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                displayMap();
            })

            btn_container.appendChild(btn);

            const header = document.getElementById('header');
            header.appendChild(btn_container);

            createMapWindow();
            clearInterval();
        } else if (display_map_btn) {
            display_map_btn.remove();
            clearInterval(interval);
        }
    }, 3000);
}

function displayMap() {
    let map_window = document.getElementById(mh_optimizer_map_window_id);
    map_window.classList.add('visible');

    let content = document.getElementById(mh_optimizer_map_window_id + '-content');
    content.innerHTML = '';

    let map_to_display = GM_getValue(mho_map_key);
    let style = document.getElementById(map_to_display.source + '-map');
    if (!style) {
        document.head.innerHTML += map_to_display.style;
    }
    let img = document.createElement('img');
    img.setAttribute('style', 'width: auto; height: 100%');
    img.src = map_to_display.block;
    content.appendChild(img);
}

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
function preventFromLeaving() {
    if (mho_parameters.prevent_from_leaving && pageIsDesert()) {
        let prevent_function = (event) => {
            let e = event || window.event;

            let buttons = document.getElementsByTagName('button');
            let ae_button;
            for (let button of buttons) {
                if (button.getAttribute('x-toggle-escort') && !button.classList.contains('inline') && button.getAttribute('x-toggle-escort') === '1') {
                   ae_button = button;

                    let mho_leaving_info = document.getElementById('mho-leaving-info');
                    if (!mho_leaving_info) {
                        mho_leaving_info = document.createElement('div');
                        mho_leaving_info.id = 'mho-leaving-info';
                        mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                        mho_leaving_info.innerHTML = texts.prevent_from_leaving_information[lang] + texts.prevent_not_in_ae[lang];
                        button.parentNode.insertBefore(mho_leaving_info, button.nextSibling);
                    }

                }
            }

            let is_escorting = document.getElementsByClassName('beyond-escort-on')[0];

            if (is_escorting) {
                let mho_leaving_info = document.getElementById('mho-leaving-info');
                if (!mho_leaving_info) {
                    mho_leaving_info = document.createElement('div');
                    mho_leaving_info.id = 'mho-leaving-info';
                    mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                    mho_leaving_info.innerHTML = texts.prevent_from_leaving_information[lang] + texts.escort_not_released[lang];
                    is_escorting.parentNode.insertBefore(mho_leaving_info, is_escorting.nextSibling);
                }
            }

            /** Si est en AE ou qu'on n'a pas reposé l'escorte */
            if (ae_button || is_escorting) {
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

/** Affiche une demande de confirmation avant d'effectuer une action dangereuse (drogue si état drogué / cyanure) */
function preventDangerousActions() {
    let interval = setInterval(() => {
        if (mho_parameters.prevent_dangerous_actions && items) {

            let actions = Array.from(document.getElementsByClassName('actions'));

            if (actions && actions.length > 0) {

                let drugs = items.filter((item) => item.properties && item.properties.indexOf('drug') > -1);
                let dead = items.filter((item) => item.actions && item.actions.indexOf('cyanide') > -1);
                let status_drugged = Array.from(document.getElementsByClassName('status link')[0].getElementsByClassName('status')).some((status) => status.firstElementChild.src.indexOf('status_drugged') > -1);
                let filtered_actions = Array.from(actions).filter((action) => {
                    let action_img = action.firstElementChild ? action.firstElementChild.src : undefined;
                    return (action_img === drugs.some((item) => item.icon === action_img) && status_drugged) || action_img === dead.some((item) => item.icon === action_img);
                });
                filtered_actions.forEach((action) => {
                    action.addEventListener('click', (event) => {
                        if (!confirm(`${GM_info.script.name}\n\nÊtes-vous sûr de vouloir effectuer cette action ?`)) {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                        } else {
                            preventDangerousActions();
                        }
                    }, true);
                });

                clearInterval(interval);
            }
        }
    }, 500);
}

/** Affiche une notification 5 secondes avant la fin de la fouille en cours */
function notifyOnSearchEnd() {
    let interval = setInterval(() => {
        if (mho_parameters.notify_on_search_end && pageIsDesert()) {
            let count = document.querySelectorAll('span[x-countdown]')[0];
            if (count) {
                clearInterval(interval);
                let countdown = count.getAttribute('x-countdown');
                let timeout_counter = (count.getAttribute('x-countdown') - 5) * 1000;
                setTimeout(() => {
                    if (!pageIsTown()) {
                        GM_notification({
                            text: texts.search_ended[lang],
                            title: GM_info.script.name,
                            highlight: true,
                            timeout: 0
                        });
                    }
                    clearInterval(interval);
                    notifyOnSearchEnd();
                }, timeout_counter);
            }
        } else if (pageIsTown()) {
            clearInterval(interval);
            notifyOnSearchEnd();
        }
    }, 250);
}

/** Affiche le nombre de zombies morts aujourd'hui */
function displayNbDeadZombies() {
    if (mho_parameters.display_nb_dead_zombies && pageIsDesert()) {
        let zone_dist = document.getElementsByClassName('zone-dist')[0];
        if (zone_dist) {
            let zone_dead_zombies = document.getElementById(zone_dead_zombies_id);
            let nb_dead_zombies = document.getElementsByClassName('splatter').length;

            if (!zone_dead_zombies) {
                zone_dead_zombies = document.createElement('div');
                zone_dead_zombies.id = zone_dead_zombies_id;
                zone_dead_zombies.classList.add('cell', 'rw-12', 'center');
                zone_dead_zombies.innerHTML = `${texts.nb_dead_zombies[lang]} : <b id="${nb_dead_zombies_id}">${nb_dead_zombies}</span>`

                let dist = zone_dist.firstElementChild;
                dist.parentNode.insertBefore(zone_dead_zombies, dist);
            } else {
                let nb_dead_zombies_element = document.getElementById(nb_dead_zombies_id);
                nb_dead_zombies.innerText = nb_dead_zombies;
            }
        }
    } else {
        let zone_dead_zombies = document.getElementById(zone_dead_zombies_id);
        if (zone_dead_zombies) {
            zone_dead_zombies.remove();
        }
    }
}

function displayTranslateTool() {
    /** On doit laisser l'interval tourner quand l'option est activée, sinon l'input est supprimé lors de changements de page dans l'application */
    let display_translate_input = document.getElementById(mho_display_translate_input_id);
    if (mho_parameters.display_translate_tool) {
        if (display_translate_input) return;

        let gma = document.getElementById('gma');
        if (!gma) return;

        let langs = [
            {value: 'de', img: '🇩🇪'},
            {value: 'en', img: '🇬🇧'},
            {value: 'es', img: '🇪🇸'},
            {value: 'fr', img: '🇫🇷'},
        ]
        let mho_display_translate_input_div = createSelectWithSearch();
        mho_display_translate_input_div.id = mho_display_translate_input_id;
        mho_display_translate_input_div.setAttribute('style', 'position: absolute; top: 45px; right: 8px; margin: 0; width: 250px;');
        let label = mho_display_translate_input_div.firstElementChild;
        let input = label.firstElementChild;
        input.setAttribute('style', 'width: calc(100% - 35px); display: inline-block;');

        let select = document.createElement('select');
        select.classList.add('small');
        select.setAttribute('style', 'height: 25px; width: 35px; font-size: 12px');
        select.value = lang;

        langs.forEach((lang_option) => {
            let option = document.createElement('option');
            option.value = lang_option.value;
            option.setAttribute('style', 'font-size: 16px');
            option.innerHTML = lang_option.img;
            option.selected = lang_option.value === lang;
            select.appendChild(option);
        })

        label.insertBefore(select, input);

        let options = mho_display_translate_input_div.lastElementChild;
        options.setAttribute('style', 'float: right; z-index: 10; position: absolute; right: 0; min-width: 350px; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                getTranslation(input.value, select.value, options);
            }
        });
        gma.appendChild(mho_display_translate_input_div);
    } else if (display_translate_input) {
        display_translate_input.remove();
    }
}
/////////////////////////////////////
// BOUTONS SUR LES OUTILS EXTERNES //
/////////////////////////////////////
function createCopyButton(source, map_id, button_block_id) {
    let copy_button_parent = document.getElementById(button_block_id);
    let copy_button = document.createElement('button');
    copy_button.setAttribute('style', 'max-width: initial');
    copy_button.innerHTML = `<img src="${mh_optimizer_icon}" style="margin: auto; vertical-align: middle;" width="30" height="30"><span style="margin: auto; vertical-align: middle;">${texts.copy_map[lang]}</span>`;
    copy_button.id = mho_copy_map_id;
    copy_button.addEventListener('click', () => {
        copy_button.disabled = true;
        html2canvas(document.getElementById(map_id)).then((canvas) => {
            GM_setValue(mho_map_key, {
                source: source,
                block: canvas.toDataURL()
            })
            copy_button.disabled = false;
        });
    });
    copy_button_parent.appendChild(copy_button);
}

function createOptimizePathButton(source, map_id, button_block_id) {
    console.log('source', source);
    let opti_button_parent = document.getElementById(button_block_id);
    let opti_button = document.createElement('button');
    opti_button.setAttribute('style', 'max-width: initial');
    opti_button.innerHTML = `<img src="${mh_optimizer_icon}" style="margin: auto; vertical-align: middle;" width="30" height="30"><span style="margin: auto; vertical-align: middle;">[i18n] Chemin optimisé</span>`;
    opti_button.id = mho_opti_map_id;
    opti_button.addEventListener('click', () => {
        opti_button.disabled = true;
        let map;
        if (source === 'gh') {
            map = optimizeGh(document.getElementById(map_id));
        } else if (source === 'bbh') {
            map = optimizeBbh(document.getElementById(map_id));
        }
        getOptimalPath(map, document.getElementById(map_id), opti_button, source);
      });
      opti_button_parent.appendChild(opti_button);
}

function optimizeBbh(html) {
    let map = html;
    let rows = Array.from(map.querySelectorAll('tr')).filter((row) => Array.from(row.querySelectorAll('td')).some((col) => {
        return col.children.length > 0; // Ligne d'index
    }));
    let final_rows = [];
    let doors_positions = [];
    let entrance = {};

    rows.forEach((row, row_index) => {
        let cols = Array.from(row.querySelectorAll('td'));
        let final_cols = cols
            .filter((col) => col.children.length > 0) // Colonne d'index
            .map((col, col_index) => {
                let cm = col.querySelector('div[id^="cm"]');
                console.log('cm', cm);
                if (cm && cm.classList.length === 0) {
                    return 0;
                } else {
                    // Porte
                    let cp = col.querySelector('div[id^="cp"][class^="p"]');
                    if (cp) {
                      doors_positions.push({colIndex: col_index, rowIndex: row_index});
                    }
                    // Entrée
                    if (!cm) {
                        entrance = {colIndex: col_index, rowIndex: row_index};
                    }
                    return col;
                }
            });
        final_rows.push(final_cols);
    });
    return {
        map: final_rows,
        doors: doors_positions,
        entrance: entrance
    }
}

function optimizeGh(html) {
    let map = html;
    let rows = Array.from(map.querySelectorAll('tr')).filter((row) => Array.from(row.querySelectorAll('td')).some((col) => {
        return !col.classList.contains('bordCarteRuine') // Ligne d'index
    }));
    let final_rows = [];
    let doors_positions = [];
    let entrance = {};

    rows.forEach((row, row_index) => {
        let cols = Array.from(row.querySelectorAll('td'));
        let final_cols = cols
            .filter((col) => !col.classList.contains('bordCarteRuine')) // Colonne d'index
            .map((col, col_index) => {
                let use = col.querySelector('use');
                let img = use.getAttribute('xlink:href');
                if (img.endsWith('ruineCarte_19')) {
                    // Pas de passage
                    return 0;
                } else {
                    // Porte
                    let door = col.querySelector('.ruineCarte_porte');
                    if (door) {
                        doors_positions.push({colIndex: col_index, rowIndex: row_index});
                    }
                    // Entrée
                    let entrance_found = img.endsWith('ruineCarte_15');
                    if (entrance_found) {
                        entrance = {colIndex: col_index, rowIndex: row_index};
                    }
                    return 1;
                }
            });
          final_rows.push(final_cols);
    });
  return {
      map: final_rows,
      doors: doors_positions,
      entrance: entrance
  }
}

function displayOptimalPathOnBbh(html, response) {
    console.log('display opti bbh');
    console.log('html', html);
    console.log('response', response);
}

function displayOptimalPathOnGh(html, response) {
    console.log('display opti gh');
    let rows = Array.from(html.querySelectorAll('tr'))
        .filter((row) => Array.from(row.querySelectorAll('td')).some((col) => {
            return !col.classList.contains('bordCarteRuine') // Ligne d'index
        }))
        .map((row) => {
            return Array.from(row.querySelectorAll('td')).filter((col) => !col.classList.contains('bordCarteRuine')) // Colonne d'index
        });

    rows.forEach((row, row_index) => {
        let response_pos_in_row = response.filter((response_pos) => response_pos.row === row_index);
        if (response_pos_in_row && response_pos_in_row.length > 0) {
            console.log('response_pos_in_row', response_pos_in_row);
            row.forEach((col, col_index) => {
                let response_at_pos = response_pos_in_row.filter((response_pos) => response_pos.column === col_index);
                if (response_at_pos && response_at_pos.length > 0) {
                    let mho_path_div = document.createElement('div');
                    mho_path_div.classList.add('mho_opti_path');
                    mho_path_div.setAttribute('style', 'position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-around;');
                    col.appendChild(mho_path_div);
                }
            });
        }
    });

    response.forEach((path, index) => {
        let path_cell = rows[path.row][path.column];

        let path_div = document.createElement('span');
        path_div.setAttribute('posPath', index);

        let next_path = response[index + 1];
        if (next_path) {

            let next_path_cell = rows[next_path.row][next_path.column];

            let next_path_div = document.createElement('span');
            next_path_div.setAttribute('posPath', index);

            path_div.setAttribute('position', 'start');
            next_path_div.setAttribute('position', 'end');

            if (next_path.column === path.column) { // Déplacement vertical
                path_div.setAttribute('orientation', 'vertical');
                next_path_div.setAttribute('orientation', 'vertical');
                if (next_path.row > path.row) { // on se déplace vers le bas
                    path_div.setAttribute('alignment', 'bottom');
                    next_path_div.setAttribute('alignment', 'top');
                } else { // on se déplace vers le haut
                    path_div.setAttribute('alignment', 'top');
                    next_path_div.setAttribute('alignment', 'bottom');
                }

                path_div.style.height = 'calc(50% - 4px)';
                path_div.style.width = '4px';
                path_div.style.display = 'inline-block';
                path_div.style.backgroundColor = 'red';
                next_path_div.style.height = 'calc(50% - 4px)';
                next_path_div.style.width = '4px';
                next_path_div.style.display = 'inline-block';
                next_path_div.style.backgroundColor = 'red';
            } else { // Déplacement horizontal
                path_div.setAttribute('orientation', 'horizontal');
                next_path_div.setAttribute('orientation', 'horizontal');

                if (next_path.column > path.column) { // on se déplace vers la gauche
                    path_div.setAttribute('alignment', 'right');
                    next_path_div.setAttribute('alignment', 'left');
                } else { // on se déplace vers la droite
                    path_div.setAttribute('alignment', 'left');
                    next_path_div.setAttribute('alignment', 'right');
                }

                path_div.style.width = 'calc(50% - 4px)';
                path_div.style.height = '4px';
                path_div.style.display = 'inline-block';
                path_div.style.backgroundColor = 'red';
                next_path_div.style.width = 'calc(50% - 4px)';
                next_path_div.style.height = '4px';
                next_path_div.style.display = 'inline-block';
                next_path_div.style.backgroundColor = 'red';
            }

            path_div.style.marginLeft = path_div.getAttribute('alignment') === 'right' ? '50%' : 'initial';
            path_div.style.marginRight = path_div.getAttribute('alignment') === 'left' ? '50%' : 'initial';
            path_div.style.marginTop = path_div.getAttribute('alignment') === 'bottom' ? '50%' : 'initial';
            path_div.style.marginBottom = path_div.getAttribute('alignment') === 'top' ? '50%' : 'initial';

            next_path_div.style.marginLeft = next_path_div.getAttribute('alignment') === 'right' ? '50%' : 'initial';
            next_path_div.style.marginRight = next_path_div.getAttribute('alignment') === 'left' ? '50%' : 'initial';
            next_path_div.style.marginTop = next_path_div.getAttribute('alignment') === 'bottom' ? '50%' : 'initial';
            next_path_div.style.marginBottom = next_path_div.getAttribute('alignment') === 'top' ? '50%' : 'initial';

            path_cell.querySelector('.mho_opti_path').appendChild(path_div);
            next_path_cell.querySelector('.mho_opti_path').appendChild(next_path_div);
        }
        console.log('cell', path_cell);
    });

    console.log('rows', rows);
    console.log('response', response);
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

    const mh_optimizer_window_hidden = `#${mh_optimizer_window_id}:not(.visible), #${mh_optimizer_map_window_id}:not(.visible) {`
    + 'opacity: 0;'
    + 'pointer-events: none;'
    + '}';

    const mh_optimizer_window_box_style_hidden = `#${mh_optimizer_window_id}:not(.visible) #${mh_optimizer_window_id}-box, #${mh_optimizer_map_window_id}:not(.visible) #${mh_optimizer_map_window_id}-box {`
    + 'transform: scale(0) translateY(1000px);'
    + '}';

    const mh_optimizer_window_box_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box {`
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

    const mh_optimizer_map_window_box_style = `#${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box {`
    + 'background: url(' + repo_img_url + 'background/bg_content2.jpg) repeat-y 0 0/900px 263px,url(' + repo_img_url + 'background/bg_content2.jpg) repeat-y 100% 0/900px 263px;'
    + 'border-radius: 8px;'
    + 'box-shadow: 0 0 10px #000;'
    + 'position: absolute;'
    + 'transform: scale(1) translateY(0);'
    + 'transition: transform .5s ease;'
    + 'resize: both;'
    + 'overflow: auto;'
    + 'z-index: 9999;'
    + '}';

    const mh_optimizer_window_overlay_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay {`
    + 'position: absolute;'
    + 'right: 12px;'
    + 'top: -6px;'
    + 'text-align: right;'
    + '}'

    const wiki_window_overlay_ul_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay ul, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul {`
    + 'margin: 2px;'
    + 'padding: 0;'
    + '}'

    const mh_optimizer_window_overlay_ul_li_style = `#${mh_optimizer_window_id} #${mh_optimizer_window_id}-box #${mh_optimizer_window_id}-overlay ul li, #${mh_optimizer_map_window_id} #${mh_optimizer_map_window_id}-box #${mh_optimizer_map_window_id}-overlay ul li {`
    + 'cursor: pointer;'
    + 'display: inline-block;'
    + '}'

    const mh_optimizer_window_content = `#${mh_optimizer_window_id}-content, #${mh_optimizer_map_window_id}-content {`
    + 'background: #7e4d2a;'
    + 'bottom: 0;'
    + 'color: #fff;'
    + 'left: 0;'
    + 'overflow: auto;'
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
    + `background: url(${repo_img_url}background/tabs-header-plain.gif) 0 100% round;`
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
    + 'padding: 0.25em;'
    + 'margin: 0.25em 1px;'
    + '}';

    const tab_content_item_list_item_not_selected_properties_style = '#tab-content > ul > li:not(.selected) .properties {'
    + 'display: none;'
    + '}';

    const item_category = '#tab-content > ul div.mho-category {'
    + 'width: 100%;'
    + 'border-bottom: 1px solid;'
    + 'margin: 1em 0 0.5em;'
    + '}';

    const parameters_informations_style = '#categories, .parameters, #informations {'
    + 'margin-top: 0.5em;'
    + '}';

    const parameters_informations_ul_style = '#categories > ul, ul.parameters, #informations > ul {'
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

    const mho_table_header_style = '.mho-header {'
    + 'font-size: 10pt;'
    + 'background: linear-gradient(0deg,#643b25 0,rgba(100,59,37,0) 50%,rgba(100,59,37,0)) !important;'
    + 'border-bottom: 2px solid #f0d79e;'
    + 'color: #fff;'
    + 'font-family: Trebuchet MS,Arial,Verdana,sans-serif;'
    + 'font-weight: 700;'
    + '}';

    const mho_table_row_style = '.mho-table tr:not(.mho-header) {'
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
    + '}';

    const item_title_style = '.item-title {'
    + 'display: flex;'
    + 'justify-content: space-between;'
    + '}';

    const item_list_element_style = 'ul#item-list > li {'
    + 'background-color: #5c2b20;'
    + 'margin: 1px 1px;'
    + 'padding: 0.25em 0.5em;'
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

    const wishlist_header = '#wishlist .mho-header, #wishlist > li {'
    + 'padding: 0 8px;'
    + 'margin: 0.125em 0;'
    + 'width: 100%;'
    + '}';

    const wishlist_even = '#tab-content #recipes-list > li:nth-child(even), #wishlist > li:nth-child(even) {'
    + 'background-color: #5c2b20;'
    + '}';

    const wishlist_header_cell = '#wishlist .mho-header > div {'
    + 'display: inline-block;'
    + 'vertical-align: middle;'
    + '}'

    const wishlist_label = '#wishlist .label {'
    + 'width: calc(100% - 525px);'
    + 'min-width: 200px;'
    + 'padding: 0 4px;'
    + '}';

    const label_text = '.label_text {'
    + 'font-size: 1.2rem;'
    + 'font-variant: small-caps;'
    + '}';

    const wishlist_cols = '#wishlist .priority, #wishlist .bank_count, #wishlist .bank_needed, #wishlist .diff {'
    + 'width: 125px;'
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

    const item_priority_30 = `li.item[class^='priority_3'], li.item[class*=' priority_3'], img[class^='priority_3'], img[class*=' priority_3'] {`
    + 'box-shadow: inset 0 0 0.30em springgreen, 0 0 0.5em springgreen;'
    + '}';
    const item_priority_20 = `li.item[class^='priority_2'], li.item[class*=' priority_2'], img[class^='priority_2'], img[class*=' priority_2'] {`
    + 'box-shadow: inset 0 0 0.30em yellowgreen, 0 0 0.5em yellowgreen;'
    + '}';
    const item_priority_10 = `li.item[class^='priority_1'], li.item[class*=' priority_1'], img[class^='priority_1'], img[class*=' priority_1'] {`
    + 'box-shadow: inset 0 0 0.30em darkgoldenrod, 0 0 0.5em darkgoldenrod;'
    + '}';
    const item_priority_trash = 'li.item.priority_-1000, img.priority_-1000 {'
    + 'box-shadow: inset 0 0 0.30em darkslategrey, 0 0 0.5em darkslategrey;'
    + '}';

    const item_tag_food = 'div.item-tag-food::after {'
    + `background: url(${repo_img_url}status/status_haseaten.gif) 50%/contain no-repeat;`
    + '}';

    const item_tag_load = 'div.item-tag-load::after {'
    + `background: url(${repo_img_url}item/item_pile.gif) 50%/contain no-repeat;`
    + '}';

    const item_tag_hero = 'div.item-tag-hero::after {'
    + `background: url(${repo_img_url}icons/star.gif) 50%/contain no-repeat;`
    + '}';

    const item_tag_alcohol = 'div.item-tag-alcohol::after {'
    + `background: url(${repo_img_url}status/status_drunk.gif) 50%/contain no-repeat;`
    + '}';

    const item_tag_drug = 'div.item-tag-drug::after {'
    + `background: url(${repo_img_url}status/status_drugged.gif) 50%/contain no-repeat;`
    + '}';

    const item_tag_smokebomb = 'div.item-tag-smokebomb {'
    + `height: 36px;`
    + '}';

    const display_map_btn = `#${mho_display_map_id} {`
    + 'background-color: rgba(62,36,23,.75);'
    + 'border-radius: 6px;'
    + 'color: #ddab76;'
    + 'cursor: pointer;'
    + 'font-size: 10px;'
    + 'padding: 3px 5px;'
    + 'position: absolute;'
    + 'right: 10px;'
    + 'top: 100px;'
    + 'transition: background-color .5s ease-in-out;'
    + '}'

    let css = btn_style + btn_hover_h1_span_style + btn_h1_style + btn_h1_img_style + btn_h1_hover_style + btn_h1_span_style + btn_div_style + btn_hover_div_style
    + mh_optimizer_window_style + mh_optimizer_window_hidden + mh_optimizer_window_box_style_hidden + mh_optimizer_window_box_style
    + mh_optimizer_window_overlay_style + mh_optimizer_window_overlay_ul_li_style + mh_optimizer_window_content
    + tabs_style + tabs_ul_style + tabs_ul_li_style + tabs_ul_li_spacing_style + tabs_ul_li_div_style + tabs_ul_li_div_hover_style + tabs_ul_li_selected_style
    + tab_content_style + tab_content_item_list_style + tab_content_item_list_item_style + tab_content_item_list_item_selected_style + tab_content_item_list_item_not_selected_properties_style + item_category
    + parameters_informations_style + parameters_informations_ul_style + li_style + recipe_style + input_number_webkit_style + input_number_firefox_style
    + mho_table_style + mho_table_header_style + mho_table_row_style + mho_table_cells_style + mho_table_cells_td_style + label_text
    + item_title_style + add_to_wishlist_button_img_style + advanced_tooltip_recipe_li + advanced_tooltip_recipe_li_ul + large_tooltip + item_list_element_style
    + wishlist_label + wishlist_header + wishlist_header_cell + wishlist_cols + wishlist_delete + wishlist_in_app + wishlist_in_app_item + wishlist_even
    + item_priority_10 + item_priority_20 + item_priority_30 + item_priority_trash + item_tag_food + item_tag_load + item_tag_hero + item_tag_smokebomb + item_tag_alcohol + item_tag_drug
    + display_map_btn + mh_optimizer_map_window_box_style;

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
    startLoading();
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
                    .sort((item_a, item_b) => {
                    if (item_a.category.ordering > item_b.category.ordering) {
                      return 1;
                    } else if (item_a.category.ordering === item_b.category.ordering) {
                      return 0;
                    } else {
                      return -1;
                    }
                });
                console.log('items', items);
                let wiki_btn = document.getElementById(wiki_btn_id);
                if (wiki_btn) {
                    wiki_btn.setAttribute('style', 'display: inherit');
                }
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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

                getItems();

                if (mh_user.townId) {
                    getWishlist();
                }
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Récupère les informations de la ville */
function getTown() {
    startLoading();
    if (!hero_skills) {
        getHeroSkills();
    }
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/town?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                console.log('town', response.response);
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}


/** Récupère les informations de la ville */
function getCitizens() {
    startLoading();
    if (!hero_skills) {
        getHeroSkills();
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
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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
                    .sort((item_a, item_b) => {
                    if (item_a.category.ordering > item_b.category.ordering) {
                      return 1;
                    } else if (item_a.category.ordering === item_b.category.ordering) {
                      return 0;
                    } else {
                      return -1;
                    }
                });
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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
                wishlist;
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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
                addSuccess(api_texts.add_to_wishlist_success[lang]);
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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

                addSuccess(api_texts.update_wishlist_success[lang]);
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
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
                let response_items = Object.keys(response.response).map((key) => {return {key: key, value: response.response[key]}});
                let tools_success = response_items.filter((tool_response) => tool_response.value.toLowerCase() === 'ok');
                let tools_fail = response_items.filter((tool_response) => tool_response.value.toLowerCase() !== 'ok' && tool_response.value.toLowerCase() !== 'not activated');
                btn.innerHTML = nb_tools_to_update === tools_success.length ? '<img src ="' + repo_img_url + 'icons/done.png">' + texts.update_external_tools_success_btn_label[lang]
                : `<img src ="${repo_img_url}emotes/warning.gif">${texts.update_external_tools_errors_btn_label[lang]}<br>${tools_success.map((item) => item.key.replace('Status', ' : OK')).join('<br>')}<br>${tools_fail.map((item) => item.key.replace('Status', ' : KO')).join('<br>')}`;
            } else {
                addError(response);
                btn.innerHTML = '<img src ="' + repo_img_url + 'professions/death.gif">' + texts.update_external_tools_fail_btn_label[lang];
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Récupère la liste complète des pouvoirs héros */
function getHeroSkills() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api_url + 'myhordesfetcher/heroSkills',
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                hero_skills = response.response.sort((a, b) => {
                if (a.daysNeeded > b.daysNeeded) {
                      return 1;
                    } else if (a.daysNeeded === b.daysNeeded) {
                      return 0;
                    } else {
                      return -1;
                    }
                });
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}


/** Récupère les traductions de la chaine de caractères */
function getTranslation(string_to_translate, source_language, block_to_display) {
    block_to_display.innerHTML = '';
    if (string_to_translate && string_to_translate !== '') {
        let locale = 'locale=' + source_language;
        let sourceString = 'sourceString=' + string_to_translate;
        startLoading();
        GM_xmlhttpRequest({
            method: 'GET',
            url: api_url + 'myhordestranslation?' + locale + '&' + sourceString,
            responseType: 'json',
            onload: function(response){
                if (response.status === 200) {
                    let show_exact_match = response.response.translations.some((translation) => translation.key.isExactMatch);

                    if (show_exact_match) {
                        let display_all = document.createElement('div');
                        display_all.setAttribute('style', 'padding: 4px; border-bottom: 1px solid; cursor: pointer');
                        let display_all_img = document.createElement('img');
                        display_all_img.src = `${repo_img_url}/icons/small_more.gif`;
                        display_all_img.setAttribute('style', 'margin-right: 8px');

                        let display_all_text = document.createElement('text');
                        display_all_text.innerText = texts.display_all_search_result[lang];

                        display_all.appendChild(display_all_img);
                        display_all.appendChild(display_all_text);
                        block_to_display.appendChild(display_all);

                        display_all.addEventListener('click', () => {
                            show_exact_match = !show_exact_match;
                            if (show_exact_match) {
                                display_all_img.src = `${repo_img_url}/icons/small_more.gif`;
                                display_all_text.innerHTML = texts.display_all_search_result[lang];
                            } else {
                                display_all_img.src = `${repo_img_url}/icons/small_less.gif`;
                                display_all_text.innerHTML = texts.display_exact_search_result[lang];
                            }
                            let not_exact = Array.from(block_to_display.getElementsByClassName('not-exact'));
                            not_exact.forEach((not_exact_item) => {
                                not_exact_item.classList.toggle('hidden');
                            })
                        });
                    }
                    response.response.translations
                        .forEach((translation) => {
                        if (response.response.translations.length > 1) {
                            let context_div = document.createElement('div');
                            context_div.setAttribute('style', 'text-align: center; padding: 4px; font-variant: small-caps; font-size: 14px;');
                            context_div.innerHTML = texts.translation_file_context[lang] + ` <img src="${repo_img_url}/emotes/arrowright.gif"> ` + translation.key.context;
                            if (!translation.key.isExactMatch && show_exact_match) {
                                context_div.classList.add('not-exact','hidden');
                            }
                            block_to_display.appendChild(context_div);
                        }
                        let key_index = 0;
                        for (let lang_key in translation.value) {
                            let lang = translation.value[lang_key];
                            lang.forEach((result) => {
                                let content_div = document.createElement('div');
                                let img = document.createElement('img');
                                img.src = `${repo_img_url}/lang/${lang_key}.png`
                                img.setAttribute('style', 'margin-right: 8px');

                                let button_div = document.createElement('div');
                                let button = document.createElement('button');
                                button_div.appendChild(button);
                                button.innerHTML = '&#10697';
                                button.setAttribute('style', 'font-size: 16px');
                                button.addEventListener('click', () => {
                                    copyToClipboard(result);
                                });
                                content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px;');

                                if (key_index === Object.keys(translation.value).length - 1) {
                                    content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px; border-bottom: 1px solid;');
                                }
                                content_div.innerHTML = `<div>${img.outerHTML}${result}</div>`;
                                content_div.appendChild(button_div);

                                if (!translation.key.isExactMatch && show_exact_match) {
                                    content_div.classList.add('not-exact','hidden');
                                }
                                block_to_display.appendChild(content_div);
                            });
                            key_index ++;
                        };
                    });
                } else {
                    addError(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
            }
        });
    }
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
                    .sort((a, b) => {
                    if (a.type.ordering > b.type.ordering) {
                      return 1;
                    } else if (a.type.ordering === b.type.ordering) {
                      return 0;
                    } else {
                      return -1;
                    }
                });
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Récupère le chemin optimal à partir d'une carte */
function getOptimalPath(map, html, button, source) {
    map.doors = map.doors.slice(2);
    console.log('map before send', map);
    GM_xmlhttpRequest({
        method: 'POST',
        data: JSON.stringify(map),
        url: api_url + 'ruine/pathopti',
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json'
        },
        onload: function(response){
            if (response.status === 200) {
              if (source === 'gh') {
                  displayOptimalPathOnGh(html, response.response)
              } else if (source === 'bbh') {
                  displayOptimalPathOnBbh(html, response.response)
              }
            } else {
                console.error('error', response.reponse)
            }

            button.disabled = false;
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}


///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////
(function() {

    if (document.URL.startsWith('https://bbh.fred26.fr/') || document.URL.startsWith('https://gest-hordes2.eragaming.fr/') || document.URL.startsWith('https://fatamorgana.md26.eu/')) {
        let current_key = '';
        let map_block_id = '';
        let ruin_block_id = '';
        let block_copy_map_button = '';
        let block_copy_ruin_button = '';
        let source = '';

        if (document.URL.startsWith('https://bbh.fred26.fr/')) {
            current_key = gm_bbh_updated_key;
            map_block_id = 'carte';
            ruin_block_id = 'plan';
            block_copy_map_button = 'ul_infos_1';
            block_copy_ruin_button = 'cl1';
            source = 'bbh';
        } else if (document.URL.startsWith('https://gest-hordes2.eragaming.fr/')) {
            current_key = gm_gh_updated_key;
            map_block_id = 'zoneCarte';
            ruin_block_id = 'carteRuine';
            block_copy_map_button = 'zoneInfoVilleAutre';
            block_copy_ruin_button = 'menuRuine';
            source = 'gh';
        } else {
            current_key = gm_fata_updated_key;
            map_block_id = 'map';
            block_copy_map_button = 'update-myzone';
            source = 'fata'

        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener('visibilitychange', function() {
            if (GM_getValue(current_key) && !document.hidden) {
                GM_setValue(current_key, false);
                location.reload();
            }
        });

        let interval = setInterval(() => {
            let copy_button = document.getElementById(mho_copy_map_id);
            // console.log(copy_button);
            if (mho_parameters.display_map && !copy_button) {
                let map_block = document.getElementById(map_block_id);
                let ruin_block = document.getElementById(ruin_block_id);
                if (map_block || ruin_block) {
                    if (map_block) {
                        // createCopyButton(source, map_block_id, block_copy_map_button);
                    } else if (ruin_block) {
                        if (source !== 'fata') {
                            // createOptimizePathButton(source, ruin_block_id, block_copy_ruin_button);
                        }
                        // createCopyButton(source, ruin_block_id, block_copy_ruin_button);
                    }
                }
            } else if (!mho_parameters.display_map && copy_button) {
                copy_button.remove();
                clearInterval(interval);
            } else {
                clearInterval(interval);
            }
        }, 1000);
    } else {

        /** Affiche le changelog de la version au premier chargement après la mise à jour */
        let version = GM_getValue('version');
        if (!version || !version[GM_info.script.version]) {
            if (!version) {
                version = {};
            }

            version[GM_info.script.version] = confirm(changelog);
            GM_setValue('version', version);
        }

        getMe();
        initOptions();
        /** Gère le bouton de mise à jour des outils externes) */
        if (!buttonOptimizerExists()) {
            createStyles();
            createOptimizerBtn();
            createWindow();
        }

        notifyOnSearchEnd();

        setInterval(() => {
            createUpdateExternalToolsButton();
            clickOnVotedToRedirect();
            displaySearchFieldOnBuildings();
            displayWishlistInApp();
            displayPriorityOnItems();
            displayNbDeadZombies();
            displayTranslateTool();
        }, 500);

        setInterval(() => {
            displayAdvancedTooltips();
        }, 100);
    }

})();
