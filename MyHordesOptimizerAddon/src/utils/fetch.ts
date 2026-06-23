import {getToken} from '../api/token';
import {state} from '../state';
import {displayAntiAbuseCounter} from '../ui/anti-abuse';
import {automaticallyOpenBag} from '../ui/bag';
import {displayCampingPredict} from '../ui/camping-predict';
import {displayCellDetailsOnPage} from '../ui/cell-details';
import {alertIfInactiveAndNoEscort, changeDefaultEscortOptions, preventFromLeaving} from '../ui/desert';
import {createExpeditionsBtn} from '../ui/expeditions';
import {displayCountCharacters, fillItemsMessages} from '../ui/forum';
import {displayGhoulVoracityPercent} from '../ui/ghoul';
import {addExternalLinksToProfiles, addExternalLinksToTowns} from '../ui/profiles';
import {addCopyRegistryButton} from '../ui/registry';
import {displayMinApOnBuildings, displaySearchFields} from '../ui/search-fields';
import {sortCitizenList, sortOmniscienceList} from '../ui/sort-lists';
import {createStoreNotificationsBtn} from '../ui/store-notifications';
import {displayAdvancedTooltips} from '../ui/tooltips';
import {displayTranslateTool} from '../ui/translate';
import {createUpdateExternalToolsButton} from '../ui/update-button';
import {displayEstimationsOnWatchtower} from '../ui/watchtower';
import {createWikiToolsWindow} from '../ui/window';
import {displayPriorityOnItems, displayWishlistInApp} from '../ui/wishlist';
import {displayNbDeadZombies} from '../ui/zombie-counter';
import {isValidToken} from './misc';
import {getScriptInfo} from './version';

export function initOptionsWithLoginNeeded() {
    displayWishlistInApp();
    displayPriorityOnItems();
    createUpdateExternalToolsButton();
    createExpeditionsBtn();
    setTimeout(() => {
        displayCellDetailsOnPage();
    }, 500)
    displayEstimationsOnWatchtower();
}


export function initOptionsWithoutLoginNeeded() {
    createWikiToolsWindow();
    preventFromLeaving();
    alertIfInactiveAndNoEscort();
    displaySearchFields();
    displayMinApOnBuildings();
    setTimeout(() => {
        displayNbDeadZombies();
    }, 250)

    displayAdvancedTooltips();
    displayTranslateTool();
    displayCampingPredict();
    displayAntiAbuseCounter();
    automaticallyOpenBag();
    addCopyRegistryButton();
    changeDefaultEscortOptions();
    displayGhoulVoracityPercent();
    addExternalLinksToProfiles();
    // createDisplayMapButton();
    fillItemsMessages();
    displayCountCharacters();
    createStoreNotificationsBtn();
    addExternalLinksToTowns();
    sortCitizenList();
    sortOmniscienceList();
    // blockUsersPosts();
}


export function updateFetchRequestOptions(options?: any) {
    const update = {...options};
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
        })
    }
    return update;
}


export function updateFetchRequestOptionsWithoutBearer(options?: any) {
    const update = {...options};
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
