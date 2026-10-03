import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { createNotification } from '../utils/notifications';
import { pageIsDesert } from '../utils/page';

export function preventFromLeaving() {
    if (state.mho_parameters.alert_if_no_escort && state.mho_parameters.prevent_from_leaving && pageIsDesert()) {
        const prevent_function = (event) => {
            const e = event || window.event;

            const ae_button = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
            if (ae_button) {
                let mho_leaving_info = document.getElementById('mho-leaving-info');
                if (!mho_leaving_info) {
                    mho_leaving_info = document.createElement('div');
                    mho_leaving_info.id = 'mho-leaving-info';
                    mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                    mho_leaving_info.innerText = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.prevent_not_in_ae);
                    ae_button.parentNode.insertBefore(mho_leaving_info, ae_button.nextSibling);
                }
            }

            const is_escorting = document.getElementsByClassName('beyond-escort-on')[0];

            if (is_escorting) {
                let mho_leaving_info = document.getElementById('mho-leaving-info');
                if (!mho_leaving_info) {
                    mho_leaving_info = document.createElement('div');
                    mho_leaving_info.id = 'mho-leaving-info';
                    mho_leaving_info.setAttribute('style', 'background-color: red; padding: 0.5em; margin-top: 0.5em; border: 1px solid;');
                    mho_leaving_info.innerText = getI18N(texts.prevent_from_leaving_information) + getI18N(texts.escort_not_released);
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
        };

        window.addEventListener('beforeunload', prevent_function, false);
    }
}

/** Bouton « Attendre une escorte » : sa présence signifie que l'attente d'escorte n'est pas activée */
const escort_waiting_button_selector: string = 'button[x-toggle-escort="1"]:not([x-escort-control-endpoint])';

/** Durée d'inactivité au-delà de laquelle le joueur est prévenu : 5 minutes */
const inactivity_delay_ms: number = 5 * 60 * 1000;

/** Évènements considérés comme une activité du joueur sur la page */
const activity_events: string[] = ['click', 'mousemove', 'keydown', 'touchstart'];

/** Horodatage de la dernière activité du joueur */
let last_activity_at: number = 0;

/** Réveil de vérification de l'inactivité, unique pour toute la page */
let inactivity_timeout: ReturnType<typeof setTimeout> | undefined;

/** L'inactivité en cours a déjà été vérifiée à son échéance : seule une nouvelle activité ouvre une nouvelle période */
let inactivity_checked: boolean = false;

/** Les écouteurs d'activité ne sont posés qu'une fois pour toute la durée de vie de la page */
let activity_listeners_bound: boolean = false;

function isInactivityAlertEnabled(): boolean {
    return !!(state.mho_parameters?.alert_if_no_escort && state.mho_parameters?.alert_if_inactive) && pageIsDesert();
}

/**
 * Avertissement correspondant à l'état d'escorte ACTUEL de la page, ou `undefined` si tout est
 * en ordre. Évalué au moment de notifier et non à l'initialisation : l'état a pu changer
 * pendant les 5 minutes d'attente.
 */
function getEscortWarning(): string | undefined {
    if (document.querySelector(escort_waiting_button_selector)) {
        return getI18N(texts.prevent_not_in_ae);
    }
    if (document.querySelector('.beyond-escort-on')) {
        return getI18N(texts.escort_not_released);
    }
    return undefined;
}

function clearInactivityTimeout(): void {
    if (inactivity_timeout !== undefined) {
        clearTimeout(inactivity_timeout);
        inactivity_timeout = undefined;
    }
}

function scheduleInactivityCheck(delay_ms: number): void {
    clearInactivityTimeout();
    inactivity_timeout = setTimeout(checkInactivity, delay_ms);
}

/**
 * Vérifie l'inactivité à l'échéance. Une activité ne relance pas le minuteur à chaque
 * mouvement de souris (bien trop fréquent) : elle met seulement à jour `last_activity_at`,
 * et la vérification se reprogramme ici pour le temps d'inactivité restant.
 */
function checkInactivity(): void {
    inactivity_timeout = undefined;
    if (!isInactivityAlertEnabled()) return;

    const idle_ms: number = Date.now() - last_activity_at;
    if (idle_ms < inactivity_delay_ms) {
        scheduleInactivityCheck(inactivity_delay_ms - idle_ms);
        return;
    }

    inactivity_checked = true;
    const warning: string | undefined = getEscortWarning();
    if (warning) {
        createNotification(warning);
    }
}

function onUserActivity(): void {
    last_activity_at = Date.now();
    if (inactivity_timeout === undefined && isInactivityAlertEnabled()) {
        inactivity_checked = false;
        scheduleInactivityCheck(inactivity_delay_ms);
    }
}

function bindActivityListenersOnce(): void {
    if (activity_listeners_bound) return;
    activity_listeners_bound = true;

    activity_events.forEach((event_name: string): void => {
        document.addEventListener(event_name, onUserActivity, { capture: true, passive: true });
    });
}

/**
 * Si l'option associée est activée, notifie le joueur resté inactif 5 minutes dans le désert
 * alors que son attente d'escorte n'est pas activée ou qu'il n'a pas relâché son escorte.
 *
 * Rejouée à chaque navigation : un seul minuteur et un seul jeu d'écouteurs existent pour toute
 * la page, et un rejeu n'interrompt pas la période d'inactivité en cours.
 */
export function alertIfInactiveAndNoEscort(): void {
    if (!isInactivityAlertEnabled()) {
        clearInactivityTimeout();
        inactivity_checked = false;
        return;
    }

    bindActivityListenersOnce();

    if (inactivity_timeout === undefined && !inactivity_checked) {
        last_activity_at = Date.now();
        scheduleInactivityCheck(inactivity_delay_ms);
    }
}

/** Affiche une notification 5 secondes avant la fin de la fouille en cours */

export function changeDefaultEscortOptions() {
    if (state.mho_parameters.default_escort_options && pageIsDesert()) {
        const btn_activate_escort = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
        if (!btn_activate_escort) return;

        btn_activate_escort.addEventListener('click', () => {
            document.addEventListener('mh-navigation-complete', () => {
                const escort_force_return = document.querySelector('#escort_force_return');
                const escort_allow_rucksack = document.querySelector('#escort_allow_rucksack');

                if (!escort_force_return || !escort_allow_rucksack) return;

                const escort_force_return_correct = escort_force_return.checked === state.mho_parameters.default_escort_force_return;
                const escort_allow_rucksack_correct = escort_allow_rucksack.checked === state.mho_parameters.default_escort_allow_rucksack;
                if (!escort_force_return_correct && !escort_allow_rucksack_correct) {
                    escort_force_return.checked = !escort_force_return.checked;
                    escort_allow_rucksack.click();
                } else if (!escort_force_return_correct || !escort_allow_rucksack_correct) {
                    if (!escort_force_return_correct) {
                        escort_force_return.click();
                    }
                    if (!escort_allow_rucksack_correct) {
                        escort_allow_rucksack.click();
                    }
                }
            }, { once: true });
        });
    }
}
