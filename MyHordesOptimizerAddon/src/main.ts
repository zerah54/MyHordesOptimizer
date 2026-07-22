import { getApiKey } from './api/api-key';
import { getParameters } from './api/parameters';
import { getToken } from './api/token';
import { bootstrap } from './config/bootstrap';
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
import { createCopyButton } from './external/copy-button';
import { state } from './state';
import { createOptimizerBtn } from './ui/btn';
import { createMhoHeaderSpace } from './ui/header-space';
import { createStyles } from './ui/styles';
import { notifyOnSearchEnd } from './ui/zombie-counter';
import { initOptionsWithLoginNeeded, initOptionsWithoutLoginNeeded } from './utils/fetch';
import { getTownClockSignature, shouldRefreshMe } from './utils/page';
import { getStorageItem, setStorageItem } from './utils/storage';
import { isNewVersion, toggleNewChangelog } from './utils/version';

///////////////////////////
//     MAIN FUNCTION     //
///////////////////////////
(async function () {
    // Les URLs d'environnement et les paramètres persistés doivent être chargés
    // avant toute initialisation : la suite les lit de manière synchrone
    await bootstrap();

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

        const interval = setInterval(() => {
            const copy_button = document.getElementById(mho_copy_map_id);
            if (state.mho_parameters.display_map && !copy_button) {
                const map_block = document.getElementById(map_block_id);
                const ruin_block = document.getElementById(ruin_block_id);
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
        /** True dès qu'un token a pu être récupéré : conditionne les fonctionnalités nécessitant d'être connecté */
        const hasToken = (): boolean => !!state.token?.token?.accessToken;

        /** Horodatage du dernier rejeu complet des initialisations, base de la limitation de fréquence */
        let last_init_at: number = 0;

        /** Rejoue les initialisations disponibles, que le backend ait répondu ou non */
        const initAvailableOptions = (): void => {
            last_init_at = Date.now();
            if (hasToken()) {
                initOptionsWithLoginNeeded();
            }
            initOptionsWithoutLoginNeeded();
        };

        /** Vérifie si la version est nouvelle ou non */
        const version: string | undefined = await getStorageItem(mho_version_key);
        toggleNewChangelog(isNewVersion(version));

        createStyles();
        createOptimizerBtn();
        createMhoHeaderSpace();
        notifyOnSearchEnd();

        initOptionsWithoutLoginNeeded();

        /**
         * Les écouteurs de navigation sont posés immédiatement, avant tout appel réseau :
         * MyHordes étant une SPA, sans eux plus rien n'est réinjecté après une navigation.
         * Ils ne doivent donc dépendre d'aucun appel backend, qui peut échouer ou ne jamais répondre.
         */
        /**
         * MyHordes émet plusieurs de ces évènements à la suite pour une même action
         * (navigation, puis rafraîchissements du journal). Comme un rejeu complet des
         * initialisations parcourt tout le document, on regroupe les évènements reçus
         * dans une même fenêtre pour n'en déclencher qu'un seul.
         */
        const init_throttle_delay: number = 250;
        /** Évènements reçus depuis le dernier rejeu, uniquement pour la trace */
        let pending_event_names: string[] = [];
        /** Rejeu déjà programmé : tout évènement supplémentaire s'y agrège au lieu d'en programmer un autre */
        let pending_init_timeout: ReturnType<typeof setTimeout> | undefined;
        /** Un rafraîchissement de token est en cours : il rejouera lui-même les initialisations à son terme */
        let token_refresh_in_progress: boolean = false;
        /**
         * Ville + jour pour lesquels les données utilisateur ont déjà été chargées.
         * Reste undefined tant qu'aucun état n'a été observé : dans ce cas la chaîne de
         * démarrage a déjà récupéré le token, il n'y a donc rien à rafraîchir.
         */
        let last_refresh_signature: string | undefined;

        /**
         * Un rafraîchissement forcé recharge objets, liste de courses, et sur le désert carte
         * et ruines : il ne doit se déclencher que si la ville ou le jour ont réellement changé.
         * `shouldRefreshMe()` seul ne suffit pas — il renvoie vrai tant que l'horloge du jeu est
         * incomplète, ce qui reboucle à chaque évènement sans qu'un appel réseau n'y remédie.
         */
        const shouldForceRefresh = (): boolean => {
            if (!state.external_app_id || !shouldRefreshMe()) return false;

            const signature: string | undefined = getTownClockSignature();
            if (last_refresh_signature === undefined) {
                /** Premier état observé : on l'enregistre sans rien recharger */
                last_refresh_signature = signature;
                return false;
            }
            if (signature === last_refresh_signature) return false;

            last_refresh_signature = signature;
            return true;
        };

        const runPendingInit = (): void => {
            pending_init_timeout = undefined;

            const event_names: string[] = pending_event_names;
            pending_event_names = [];
            console.log('MHO - handled events', event_names.join(', '));

            /**
             * Le rafraîchissement en cours recharge déjà les données utilisateur et rejouera
             * les initialisations à son terme : en relancer un second dupliquerait ces appels.
             */
            if (token_refresh_in_progress) return;

            if (shouldForceRefresh()) {
                token_refresh_in_progress = true;
                getToken(true)
                    .then(() => initAvailableOptions())
                    .catch((error: unknown) => {
                        console.error('MHO - rafraîchissement du token en échec', error);
                        initOptionsWithoutLoginNeeded();
                    })
                    .finally(() => {
                        token_refresh_in_progress = false;
                    });
            } else {
                initAvailableOptions();
            }
        };

        const handleEvent = (event_name: string) => (): void => {
            pending_event_names.push(event_name);
            if (pending_init_timeout !== undefined) return;

            /** Le premier évènement d'une salve n'est pas retardé ; les suivants attendent la fin de la fenêtre */
            const elapsed: number = Date.now() - last_init_at;
            const delay: number = Math.max(0, init_throttle_delay - elapsed);
            pending_init_timeout = setTimeout(runPendingInit, delay);
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
        ].forEach(({ target, events }) => {
            events.forEach((event_name) => {
                target.addEventListener(event_name, handleEvent(event_name));
            });
        });

        /** Chaîne d'appels backend, en best effort : un échec ne doit dégrader que les fonctionnalités connectées */
        try {
            await getParameters();
            await getApiKey();
            await getToken();
        } catch (error) {
            console.error('MHO - initialisation connectée en échec', error);
        }

        setTimeout(() => initAvailableOptions());
    }
})();
