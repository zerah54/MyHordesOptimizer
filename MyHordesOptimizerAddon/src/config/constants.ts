import type { Lang } from '../types';

export const lang: Lang = ((document.querySelector('html[lang]')?.getAttribute('lang') || document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2) || 'fr') as Lang;

/////////////////
// Les URL MHO //
/////////////////
export const is_mh_beta = document.URL.indexOf('staging') >= 0;
export const is_mh_local = document.URL.indexOf('localhost') >= 0;

////////////////////
// Les constantes //
////////////////////

export const gest_hordes_old_url = 'https://gest-hordes2.eragaming.fr';
export const gest_hordes_url = 'https://gesthordes.fr';
export const big_broth_hordes_url = 'https://bbh.fred26.fr';
export const fata_morgana_url = 'https://fatamorgana.md26.eu';

export const supported_languages = [
    { value: 'de', img: '🇩🇪' },
    { value: 'en', img: '🇬🇧' },
    { value: 'es', img: '🇪🇸' },
    { value: 'fr', img: '🇫🇷' },
];

export const gm_bbh_updated_key = 'MHO_bbh_updated';
export const gm_gh_updated_key = 'MHO_gh_updated';
export const gm_fata_updated_key = 'MHO_fata_updated';
export const gm_mho_updated_key = 'MHO_mho_updated';
/**
 * En local, les clés qui portent une SESSION sont isolées : sans cela, jouer sur
 * `myhordes.localhost` écraserait le jeton, l'utilisateur et la clé d'application de
 * la production, et inversement — le stockage du script est commun à tous les sites.
 * Les préfixes de production et de bêta restent strictement inchangés.
 */
const local_storage_prefix: string = is_mh_local ? 'local_' : '';

/** Les paramètres d'affichage restent communs : les retrouver identiques en local est un confort, pas un risque */
export const mho_parameters_key = 'MHO_parameters';
export const mh_user_key = `MHO_${local_storage_prefix}mh_user`;
export const mho_map_key = `MHO_${local_storage_prefix}map`;
export const mho_token_key = `MHO_${local_storage_prefix}token`;
export const mho_blacklist_key = 'MHO_blacklist';
export const mho_forum_thread_styles_key = 'MHO_forum_thread_styles';
export const mho_anti_abuse_key = 'MHO_anti_abuse';
export const mho_version_key = 'MHO_version';
export const gm_mh_external_app_id_key = is_mh_beta ? 'MHO_mh_beta_external_app_id' : `MHO_${local_storage_prefix}mh_external_app_id`;

///////////////////////////////////////////
// Listes de constantes / Constants list //
///////////////////////////////////////////

/**
 * Classe de masquage de l'addon (`display: none !important`).
 * À préférer systématiquement à un `style.display` en ligne : celui-ci écrase la mise en
 * page définie par la feuille de style, et un champ masqué puis réaffiché réapparaît alors
 * dans le mauvais mode d'affichage.
 */
export const mho_hidden_class = 'mho-hidden';

export const hordes_img_url = '/build/images/';
export const repo_img_url = 'https://myhordes-optimizer.web.app/img/';
export const repo_img_hordes_url = repo_img_url + 'hordes_img/';

export const mh_optimizer_icon = 'https://myhordes-optimizer.web.app/img/logo/logo_mho_64x64_outlined.png';

export const mh_optimizer_window_id = 'optimizer-window';
export const mh_optimizer_map_window_id = 'optimizer-map-window';
export const mho_expeditions_window_id = 'mho-expeditions-window';
export const mho_store_notifications_window_id = 'mho-store-notifications-window';
export const btn_id = 'optimizer-btn';
export const content_btn_id = 'optimizer-content-btn';
export const mh_content_id = 'content';
export const mh_update_external_tools_id = 'mh-update-external-tools';
export const mho_warn_missing_logs_id = 'mho-warn-missing-logs';
export const mho_camping_predict_id = 'mho-camping-predict';
export const zone_info_zombies_id = 'zone-info-zombies';
export const nb_dead_zombies_id = 'nb-dead-zombies';
export const despair_deaths_id = 'despair-deaths';
export const mho_copy_map_id = 'mho-copy-map';
export const mho_header_space_id = 'mho-header-space';
export const mho_display_map_id = 'mho-display-map';
export const mho_display_expeditions_id = 'mho-display-expeditions';
export const mho_store_notifications_id = 'mho-store-notifications';
export const mho_search_building_field_id = 'mho-search-building-field';
export const mho_search_recipient_field_id = 'mho-search-recipient-field';
export const mho_search_dump_field_id = 'mho-search-dump-field';
export const mho_search_registry_field_id = 'mho-search-registry-field';
export const mho_search_trap_field_id = 'mho-search-trap-field';
export const mho_filter_citizen_list_id = 'mho-filter-citizen-list';
export const mho_filter_omniscience_id = 'mho-filter-omniscience';
export const mho_display_translate_input_id = 'mho-display-translate-input';
export const mho_watchtower_estim_id = 'mho-watchtower-estim';
export const mho_anti_abuse_counter_id = 'mho-anti-abuse-counter';
export const mho_town_external_links_id = 'mho-town-external-links';
export const mho_copy_logs_id = 'mho-copy-logs';
export const mho_forum_styles_modal_id = 'mho-forum-styles-modal';
