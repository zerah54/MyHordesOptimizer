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

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */

export function alertIfInactiveAndNoEscort() {
    if (state.mho_parameters.alert_if_no_escort && state.mho_parameters.alert_if_inactive && pageIsDesert()) {

        const ae_button = document.querySelector('button[x-toggle-escort="1"]:not([x-escort-control-endpoint])');
        const is_escorting = document.getElementsByClassName('beyond-escort-on')[0];

        const notify = () => {
            createNotification(getI18N(ae_button ? texts.prevent_not_in_ae : texts.escort_not_released));
        };

        if (ae_button || is_escorting) {

            const timer = 300000;

            let timeout = setTimeout(notify, timer);

            document.addEventListener('click', () => {
                clearTimeout(timeout);
                timeout = setTimeout(timeout as any, timer);
            });

            document.addEventListener('mousemove', () => {
                clearTimeout(timeout);
                timeout = setTimeout(timeout as any, timer);
            });
        }
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
