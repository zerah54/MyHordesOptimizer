const lang = (document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2);
const temp_lang = lang === 'es' ? 'en' : lang;

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


let loading_count = 0;

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
    notification.innerText = `${GM_info.script.name} : ${api_texts.error[temp_lang].replace('$error$', error.status)}`;
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