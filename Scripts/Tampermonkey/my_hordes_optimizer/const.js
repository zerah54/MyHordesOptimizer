const lang = (document.documentElement.lang || navigator.language || navigator.userLanguage).substring(0, 2);
const temp_lang = lang === 'es' ? 'en' : lang;

const gm_bbh_updated_key = 'bbh_updated';
const gm_gh_updated_key = 'gh_updated';
const gm_fata_updated_key = 'fata_updated';
const gm_mh_external_app_id_key = 'mh_external_app_id';
const gm_parameters_key = 'mh_optimizer_parameters';
const mh_user_key = 'mh_user';
const mho_map_key = 'mho_map';

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
