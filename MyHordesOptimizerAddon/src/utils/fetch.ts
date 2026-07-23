import { getToken } from '../api/token';
import { state } from '../state';
import { displayAntiAbuseCounter } from '../ui/anti-abuse';
import { freezeAvatarsAnimations } from '../ui/avatars';
import { automaticallyOpenBag } from '../ui/bag';
import { displayCampingPredict } from '../ui/camping-predict';
import { displayCellDetailsOnPage } from '../ui/cell-details';
import { alertIfInactiveAndNoEscort, changeDefaultEscortOptions, preventFromLeaving } from '../ui/desert';
import { createExpeditionsBtn } from '../ui/expeditions';
import { addExternalLinksColumnToWelcomeTowns, addExternalLinksToProfiles, addExternalLinksToTowns } from '../ui/external-links';
import { displayCountCharacters, fillItemsMessages } from '../ui/forum';
import { styleForumThreadTitles } from '../ui/forum-styles';
import { displayGhoulVoracityPercent } from '../ui/ghoul';
import { addCopyRegistryButton } from '../ui/registry';
import { displayMinApOnBuildings, displaySearchFields } from '../ui/search-fields';
import { sortCitizenList, sortDumpList, sortNightwatchList, sortOmniscienceList, sortTrapList } from '../ui/sort-lists';
import { createStoreNotificationsBtn } from '../ui/store-notifications';
import { displayAdvancedTooltips } from '../ui/tooltips';
import { displayTranslateTool } from '../ui/translate';
import { createUpdateExternalToolsButton } from '../ui/update-button';
import { displayEstimationsOnWatchtower } from '../ui/watchtower';
import { createWikiToolsWindow } from '../ui/window';
import { displayPriorityOnItems, displayWishlistInApp } from '../ui/wishlist';
import { displayNbDeadZombies, notifyOnSearchEnd } from '../ui/zombie-counter';
import { isValidToken } from './misc';
import { getScriptInfo } from './version';

/**
 * Exécute une initialisation en isolant ses erreurs : une fonctionnalité qui
 * casse (état incomplet, DOM inattendu, backend injoignable) ne doit jamais
 * empêcher les suivantes de s'afficher.
 */
function runSafely(init: () => void): void {
    try {
        init();
    } catch (error) {
        console.error(`MHO - initialisation en échec : ${init.name || 'anonyme'}`, error);
    }
}


export function initOptionsWithLoginNeeded(): void {
    [
        displayWishlistInApp,
        displayPriorityOnItems,
        createUpdateExternalToolsButton,
        createExpeditionsBtn,
        displayEstimationsOnWatchtower,
        /** Se cale elle-même sur le rendu de la carte : plus besoin de la retarder */
        displayCellDetailsOnPage
    ].forEach(runSafely);
}


export function initOptionsWithoutLoginNeeded(): void {
    [
        createWikiToolsWindow,
        preventFromLeaving,
        alertIfInactiveAndNoEscort,
        displaySearchFields,
        displayMinApOnBuildings,
        displayAdvancedTooltips,
        displayTranslateTool,
        displayCampingPredict,
        displayAntiAbuseCounter,
        automaticallyOpenBag,
        addCopyRegistryButton,
        changeDefaultEscortOptions,
        displayGhoulVoracityPercent,
        freezeAvatarsAnimations,
        addExternalLinksToProfiles,
        // createDisplayMapButton,
        fillItemsMessages,
        displayCountCharacters,
        createStoreNotificationsBtn,
        addExternalLinksToTowns,
        addExternalLinksColumnToWelcomeTowns,
        sortCitizenList,
        sortOmniscienceList,
        sortNightwatchList,
        sortTrapList,
        sortDumpList,
        styleForumThreadTitles,
        // blockUsersPosts
        /** Se cale elle-même sur le rendu de la carte : plus besoin de la retarder */
        displayNbDeadZombies,
        /** Idempotente : elle reprogramme son réveil à chaque navigation, au lieu de s'auto-relancer sans fin */
        notifyOnSearchEnd
    ].forEach(runSafely);
}


export function updateFetchRequestOptions(options?: any) {
    const update = { ...options };
    update.headers = {
        ...update.headers,
        'Mho-Origin': 'mho-addon',
        'Mho-Addon-Version': getScriptInfo().version,
    };
    if (isValidToken()) {
        update.headers.Authorization = `Bearer ${state.token.token.accessToken?.toString()}`;
    } else {
        getToken().then(() => {
            if (isValidToken()) {
                update.headers.Authorization = `Bearer ${state.token.token.accessToken?.toString()}`;
            }
        });
    }
    return update;
}


export function updateFetchRequestOptionsWithoutBearer(options?: any) {
    const update = { ...options };
    update.headers = {
        ...update.headers,
        'Mho-Origin': 'mho-addon',
        'Mho-Addon-Version': getScriptInfo().version,
    };
    return update;
}


export function fetcher(url: string, options?: any) {
    return fetch(url, updateFetchRequestOptions(options));
}


export function fetcherWithoutBearer(url: string, options?: any) {
    return fetch(url, updateFetchRequestOptionsWithoutBearer(options));
}

/**
 * Copie un texte
 * @param {string} le texte à copier
 */
