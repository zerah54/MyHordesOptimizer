import { btn_id } from '../config/constants';
import { state } from '../state';

/////////////////////////////////////////
// Fonctions utiles / Useful functions //
/////////////////////////////////////////

/** @return {string}     website language */
export function getWebsiteLanguage(): string {
    return (document.getElementsByTagName('html')[0].attributes as any).lang.value;
}

/** @return {boolean}     true if button exists */
export function buttonOptimizerElement(): HTMLElement {
    return document.getElementById(btn_id);
}

/** @return {boolean}    true si la page de l'utilisateur est la page de selection de ville */
export function pageIsWelcome(): boolean {
    return document.URL.endsWith('welcome');
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la ville */
export function pageIsTown(): boolean {
    return document.URL.indexOf('town') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de l'atelier */
export function pageIsWorkshop(): boolean {
    return document.URL.endsWith('workshop');
}

/** @return {boolean}    true si la page de l'utilisateur est la page principale de sa maison */
export function pageIsHouse(): boolean {
    return document.URL.indexOf('town/house/dash') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page d'envoi de messages */

export function pageIsMsgReceived(): boolean {
    return document.URL.indexOf('town/house/messages') > -1;
}


/** @return {boolean}    true si la page de l'utilisateur est la page des améliorations de sa maison */
export function pageIsAmelio(): boolean {
    return document.URL.indexOf('town/house/build') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la porte */
export function pageIsDoors(): boolean {
    return document.URL.endsWith('town/door');
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la tour de guet */
export function pageIsWatchtower(): boolean {
    return document.URL.indexOf('town/watchtower') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la veille (onglet des remparts, route town_nightwatch) */
export function pageIsNightwatch(): boolean {
    return document.URL.indexOf('town/nightwatch') > -1;
}

/**
 * Tableau des objets de la page de la décharge.
 * Même absence de classe distinctive que sur la page de pièges : on le reconnaît à sa
 * cellule d'en-tête de largeur 5.
 * @return {Element | undefined}
 */
export function dumpItemsTableElement(): Element | undefined {
    return Array.from(document.querySelectorAll('.row-table'))
        .find((table: Element) => !!table.querySelector('.row.header .cell.rw-5'));
}

/** @return {boolean}    true si la page de l'utilisateur est la page du système de pièges (route town_tamer_trap) */
export function pageIsTrap(): boolean {
    return document.URL.indexOf('town/trap') > -1;
}

/**
 * Tableau des appâts disponibles de la page de pièges.
 * Le jeu ne pose aucune classe distinctive dessus : on le reconnaît à sa cellule d'en-tête
 * de largeur 7, propre à ce tableau.
 * @return {Element | undefined}
 */
export function trapItemsTableElement(): Element | undefined {
    return Array.from(document.querySelectorAll('.row-table'))
        .find((table: Element) => !!table.querySelector('.row.header .cell.rw-7'));
}

/** @return {boolean}    true si la page de l'utilisateur est la page du puit */
export function pageIsWell(): boolean {
    return document.URL.indexOf('town/well') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la banque */
export function pageIsBank(): boolean {
    return document.URL.indexOf('town/bank') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page de la décharge */
export function pageIsDump(): boolean {
    return document.URL.indexOf('town/dump') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la liste des citoyens */
export function pageIsCitizens(): boolean {
    return document.URL.endsWith('citizens');
}

/** @return {boolean}    true si la page de l'utilisateur est la page des chantiers */
export function pageIsConstructions(): boolean {
    return document.URL.endsWith('constructions');
}

/** @return {boolean}    true si la page de l'utilisateur est la page du désert */
export function pageIsDesert(): boolean {
    return document.URL.indexOf('desert') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est la page du forum */
export function pageIsForum(): boolean {
    return document.URL.indexOf('forum') > -1;
}

/** @return {boolean}    true si la page de l'utilisateur est une âme */
export function pageIsSoul(): boolean {
    return document.URL.indexOf('soul') > -1;
}

/** @return {boolean}    true si la page est un historique de ville */
export function pageIsTownHistory(): boolean {
    return document.URL.indexOf('town') > -1 && (document.URL.indexOf('me') > -1 || document.URL.indexOf('soul') > -1);
}

/** @return {boolean}    true si la page de l'utilisateur est liste omniscience */
export function pageIsOmniscience(): boolean {
    return document.URL.endsWith('omniscience');
}

/**
 * Signature ville + jour telle qu'affichée par l'horloge du jeu.
 * Permet de savoir si un rafraîchissement forcé des données utilisateur a déjà été
 * effectué pour cet état : `shouldRefreshMe()` peut rester vrai en boucle tant que
 * l'horloge est incomplète, sans qu'un nouvel appel réseau n'y change quoi que ce soit.
 * @return {string | undefined}    undefined si l'horloge n'est pas (encore) dans le DOM
 */
export function getTownClockSignature(): string | undefined {
    const game_clock: Element | null = document.querySelector('.game-clock[data-town-id]');
    if (!game_clock) return undefined;

    const day: Element | null = game_clock.querySelector('.day-number');
    return `${game_clock.getAttribute('data-town-id')}|${day?.textContent?.trim() ?? ''}`;
}

/** @return {boolean}    on doit refresh le user actuel si le jour de la ville est différent du jour précédent */
export function shouldRefreshMe(): boolean {
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
