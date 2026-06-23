import {btn_id} from '../config/constants';
import {state} from '../state';

export function getWebsiteLanguage() {
    return (document.getElementsByTagName('html')[0].attributes as any).lang.value;
}

/** @return {boolean}     true if button exists */

export function buttonOptimizerElement() {
    return document.getElementById(btn_id);
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la ville */

export function pageIsTown() {
    return document.URL.indexOf('town') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de l'atelier */

export function pageIsWorkshop() {
    return document.URL.endsWith('workshop');
}

/** @return {boolean}    true si la page de l'utilisateur est la page principale de sa maison */

export function pageIsHouse() {
    return document.URL.indexOf('town/house/dash') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page d'envoi de messages */

export function pageIsMsgReceived() {
    return document.URL.indexOf('town/house/messages') > -1;
}


/** @return {boolean}    true si la page de l'utilisateur est la page des améliorations de sa maison */

export function pageIsAmelio() {
    return document.URL.indexOf('town/house/build') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la porte */

export function pageIsDoors() {
    return document.URL.endsWith('town/door');
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */

export function pageIsWatchtower() {
    return document.URL.indexOf('town/watchtower') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page du puit */

export function pageIsWell() {
    return document.URL.indexOf('town/well') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la banque */

export function pageIsBank() {
    return document.URL.indexOf('town/bank') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la décharge */

export function pageIsDump() {
    return document.URL.indexOf('town/dump') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la liste des citoyens */

export function pageIsCitizens() {
    return document.URL.endsWith('citizens');
}

/** @return {boolean}    true si la page de l'utilisateur est la page des chantiers */

export function pageIsConstructions() {
    return document.URL.endsWith('constructions');
}

/** @return {boolean}    true si la page de l'utilisateur est la page du désert */

export function pageIsDesert() {
    return document.URL.indexOf('desert') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page du forum */

export function pageIsForum() {
    return document.URL.indexOf('forum') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est une âme */

export function pageIsSoul() {
    return document.URL.indexOf('soul') > -1;
}

/** @return {boolean}    true si la page est un historique de ville */

export function pageIsTownHistory() {
    return document.URL.indexOf('town') > -1 && (document.URL.indexOf('me') > -1 || document.URL.indexOf('soul') > -1);
}

/** @return {boolean}    true si la page de l'utilisateur est liste omniscience */
export function pageIsOmniscience() {
    return document.URL.endsWith('omniscience');
}

/** @return {boolean}    on doit refresh le user actuel si le jour de la ville est différent du jour précédent */

export function shouldRefreshMe() {
    // Si on est pendant l'attaque, on ne fait rien
    const during_attack = document.querySelector('.during-attack');
    if (during_attack) return false;

    // si on change de ville on force le refresh
    const game_clock = document.querySelector('.game-clock[data-town-id]');
    if (!game_clock) return false;

    const current_town_id = game_clock?.getAttribute('data-town-id');
    if (isNaN(current_town_id as any) && +state.mh_user.townDetails?.townId === 0) return false;
    if (+current_town_id !== +(state.mh_user.townDetails?.townId ?? 0)) return true;

    const current_town_day = game_clock?.querySelector('.day-number');
    if (!current_town_day) return true;

    // si on change de jour, on force le refresh
    return +current_town_day.innerText.replace(/(\D)*/, '') > +state.mh_user.townDetails?.day;
}
