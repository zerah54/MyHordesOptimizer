import {getApiKey} from './api/api-key';
import {getParameters} from './api/parameters';
import {getToken} from './api/token';
import {bootstrap} from './config/bootstrap';
import {
    big_broth_hordes_url,
    fata_morgana_url,
    gest_hordes_old_url,
    gest_hordes_url,
    gm_bbh_updated_key,
    gm_fata_updated_key,
    gm_gh_updated_key,
    gm_mho_updated_key,
    mho_copy_map_id,
    mho_version_key
} from './config/constants';
import {createCopyButton} from './external/copy-button';
import {state} from './state';
import {createOptimizerBtn} from './ui/btn';
import {createMhoHeaderSpace} from './ui/header-space';
import {createStyles} from './ui/styles';
import {notifyOnSearchEnd} from './ui/zombie-counter';
import {initOptionsWithLoginNeeded, initOptionsWithoutLoginNeeded} from './utils/fetch';
import {shouldRefreshMe} from './utils/page';
import {getStorageItem, setStorageItem} from './utils/storage';
import {isNewVersion, toggleNewChangelog} from './utils/version';

bootstrap();

///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////
(function () {
    if (document.URL.startsWith(big_broth_hordes_url) || document.URL.startsWith(gest_hordes_url) || document.URL.startsWith(gest_hordes_old_url) || document.URL.startsWith(fata_morgana_url) || document.URL.startsWith(state.website)) {
        let current_key;
        let map_block_id;
        let ruin_block_id;
        let block_copy_map_button;
        let block_copy_ruin_button;
        let source;

        if (document.URL.startsWith(big_broth_hordes_url)) {
            current_key = gm_bbh_updated_key;
            map_block_id = 'carte';
            ruin_block_id = 'plan';
            block_copy_map_button = 'ul_infos_1';
            block_copy_ruin_button = 'cl1';
            source = 'bbh';
        } else if (document.URL.startsWith(gest_hordes_url) || document.URL.startsWith(gest_hordes_old_url)) {
            current_key = gm_gh_updated_key;
            map_block_id = 'zoneCarte';
            ruin_block_id = 'carteRuine';
            block_copy_map_button = 'zoneInfoVilleAutre';
            block_copy_ruin_button = 'menuRuine';
            source = 'gh';
        } else if (document.URL.startsWith(fata_morgana_url)) {
            current_key = gm_fata_updated_key;
            map_block_id = 'map';
            ruin_block_id = 'ruinmap';
            block_copy_map_button = 'modeBar';
            block_copy_ruin_button = 'modeBar';
            source = 'fm';
        } else if (document.URL.startsWith(state.website)) {
            current_key = gm_mho_updated_key;
            source = 'mho';
        }

        // Si on est sur le site de BBH ou GH ou Fata et que BBH ou GH ou Fata a été mis à jour depuis MyHordes, alors on recharge BBH ou GH ou Fata au moment de revenir sur l'onglet
        document.addEventListener('visibilitychange', function () {
            getStorageItem(current_key).then((current) => {
                if (current && !document.hidden) {
                    setStorageItem(current_key, false);
                    if (current_key === gm_bbh_updated_key && state.mho_parameters.refresh_bbh_after_update) {
                        location.reload();
                    } else if (current_key === gm_gh_updated_key && state.mho_parameters.refresh_gh_after_update) {
                        const refresh_btn = document.querySelector('#zoneRefresh');
                        if (refresh_btn) {
                            refresh_btn.click();
                        } else {
                            location.reload();
                        }
                    } else if (current_key === gm_fata_updated_key && state.mho_parameters.refresh_fm_after_update) {
                        location.reload();
                    } else if (current_key === gm_mho_updated_key && state.mho_parameters.refresh_mho_after_update) {
                        location.reload();
                    }
                }
            });
        });

        let interval = setInterval(() => {
            let copy_button = document.getElementById(mho_copy_map_id);
            if (state.mho_parameters.display_map && !copy_button) {
                let map_block = document.getElementById(map_block_id);
                let ruin_block = document.getElementById(ruin_block_id);
                if (map_block || ruin_block) {
                    if (ruin_block) {
                        createCopyButton(source, 'ruin', ruin_block_id, block_copy_ruin_button);
                    } else if (map_block) {
                        createCopyButton(source, 'map', map_block_id, block_copy_map_button);
                    }
                }
            } else if (!state.mho_parameters.display_map && copy_button) {
                copy_button.remove();
                clearInterval(interval);
            } else {
                clearInterval(interval);
            }
        }, 1000);
    } else {
        /** Vérifie si la version est nouvelle ou non */
        getStorageItem(mho_version_key).then((version) => {
            toggleNewChangelog(isNewVersion(version))

            createStyles();
            createOptimizerBtn();
            createMhoHeaderSpace();
            notifyOnSearchEnd();

            initOptionsWithoutLoginNeeded();

            getParameters().then(() => {
                getApiKey().then(() => {
                    getToken().then(() => {
                        setTimeout(() => {
                            initOptionsWithLoginNeeded();
                            initOptionsWithoutLoginNeeded();
                        });

                        const handleEvent = (event_name) => (event) => {
                            console.log('MHO - handled event', event_name);
                            if (shouldRefreshMe()) {
                                getToken(true).then(() => {
                                    initOptionsWithLoginNeeded();
                                    initOptionsWithoutLoginNeeded();
                                });
                            } else {
                                initOptionsWithLoginNeeded();
                                initOptionsWithoutLoginNeeded();
                            }
                        };

                        [
                            {
                                target: document,
                                events: [/*'mh-navigation-begin', */ 'mh-navigation-complete', 'mh-current-log-update', 'mh-current-log-refresh'/*, 'tokenExchangeCompleted', 'load', 'tooltipAppear', 'tooltipDisappear', 'pop', 'load', 'popstate', 'error', 'push', 'tab-switch', '_react', 'x-react-degenerate', 'DOMContentLoaded', 'movement-reset', 'readystatechange'*/]
                            },
                            {
                                target: document.documentElement,
                                events: [/*'sig-inventory-bag-loaded', 'sig-inventory-changed', 'sig-inventory-changed-b', 'sig-inventory-changed-headless', 'sig-log-changed', 'sig-map-changed', 'sig-web-navigation'*/]
                            },
                        ].forEach(({target, events}) => {
                            events.forEach((event_name) => {
                                target.addEventListener(event_name, handleEvent(event_name));
                            });
                        });
                    })
                        .catch(() => {
                            initOptionsWithoutLoginNeeded();
                        });
                });
            })
                .catch(() => {
                    initOptionsWithoutLoginNeeded();
                });
        });
    }
})();
