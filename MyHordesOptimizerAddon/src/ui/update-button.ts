import { updateExternalTools } from '../api/update';
import {
    gm_bbh_updated_key,
    gm_fata_updated_key,
    gm_gh_updated_key,
    gm_mho_updated_key,
    mh_optimizer_icon,
    mh_update_external_tools_id,
    mho_warn_missing_logs_id,
    repo_img_hordes_url
} from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { pageIsAmelio, pageIsDoors, pageIsHouse } from '../utils/page';
import { setStorageItem } from '../utils/storage';
import { getScriptInfo } from '../utils/version';
import { createHelpButton } from './params';

/** Clés d'attente : une seule attente en vol par cible, quel que soit le nombre de rejeux */
const wait_key_anchor: string = 'update-button:anchor';
const wait_key_complete_log: string = 'update-button:complete-log';

/**
 * Zones d'ancrage possibles du bouton. Toutes sont rendues par le jeu APRÈS
 * `mh-navigation-complete` : on attend leur apparition au lieu d'enchaîner des essais.
 */
const anchor_selector: string = '#zone-marker, hordes-inventory, #upgrade_home_level, #door_opener, #door_exit';

export function createUpdateExternalToolsButton() {
    const tools_to_update = {
        isBigBrothHordes: /* mho_parameters && !is_mh_beta ? mho_parameters.update_bbh : */ false,
        isFataMorgana: state.mho_parameters ? state.mho_parameters.update_fata : false,
        isGestHordes: state.mho_parameters ? state.mho_parameters.update_gh : false,
        isMyHordesOptimizer: state.mho_parameters ? state.mho_parameters.update_mho : false
    };

    const nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;

    const zone_marker = document.querySelector('#zone-marker');
    const compact_actions_zone = document.querySelector('.actions-box .mdg');

    const update_external_tools_btn = document.getElementById(mh_update_external_tools_id);
    const external_display_zone = zone_marker ? (window.innerWidth < 480 && compact_actions_zone ? compact_actions_zone : zone_marker) : undefined;
    const chest = document.querySelector('hordes-inventory');
    const amelios = document.querySelector('#upgrade_home_level')?.parentElement?.parentElement;
    const map_actions = document.querySelector('#door_opener')?.parentElement ?? document.querySelector('#door_exit')?.parentElement;

    /**
     * L'avertissement « journal incomplet » est traité à part : au tour où le bouton
     * vient d'être créé, la variable locale lue plus haut vaut encore null. On relit
     * donc le bouton dans le DOM, ce qui évite le tour de rattrapage d'origine.
     */
    const handleMissingLogsWarning = (): void => {
        const btn: HTMLElement | null = document.getElementById(mh_update_external_tools_id);
        let warn_missing_logs = document.getElementById(mho_warn_missing_logs_id);
        const has_complete_log: boolean = !!document.querySelector('.log-complete-link');

        if (!warn_missing_logs && has_complete_log && external_display_zone && btn && state.mho_parameters.update_mho_digs) {
            if (window.innerWidth < 480 && compact_actions_zone) {
                const external_tools_btn_tooltip = document.querySelector('#external-tools-btn-tooltip');
                if (!external_tools_btn_tooltip) return;
                warn_missing_logs = document.createElement('div');
                warn_missing_logs.id = mho_warn_missing_logs_id;
                warn_missing_logs.classList.add('note', 'note-important');
                warn_missing_logs.style.fontSize = '10px';
                warn_missing_logs.innerHTML = getI18N(texts.warn_missing_logs_title) + '<br /><br />' + getI18N(texts.warn_missing_logs_help);

                external_tools_btn_tooltip.appendChild(warn_missing_logs);
            } else {
                warn_missing_logs = document.createElement('div');
                warn_missing_logs.id = mho_warn_missing_logs_id;
                warn_missing_logs.classList.add('note', 'note-important');
                warn_missing_logs.innerText = getI18N(texts.warn_missing_logs_title);
                const warn_help = createHelpButton(getI18N(texts.warn_missing_logs_help));
                warn_missing_logs.appendChild(warn_help);

                btn.parentElement.appendChild(warn_missing_logs);
            }
        } else if (warn_missing_logs && (!has_complete_log || !state.mho_parameters.update_mho_digs)) {
            warn_missing_logs.remove();
        }
    };

    if (nb_tools_to_update <= 0 || !state.external_app_id) {
        cancelWaitForElement(wait_key_anchor);
        cancelWaitForElement(wait_key_complete_log);
        if (update_external_tools_btn) {
            update_external_tools_btn.parentElement.remove();
        }
    } else {
        if (external_display_zone || (chest && pageIsHouse()) || (amelios && pageIsAmelio()) || (map_actions && pageIsDoors() && state.mho_parameters.update_mho && state.mho_parameters.update_mho_souls)) {
            if (!update_external_tools_btn) {
                if (window.innerWidth < 480 && compact_actions_zone) {
                    const el = external_display_zone ?? chest?.parentElement ?? amelios ?? map_actions;
                    const updater_bloc = createSmallUpdateExternalToolsButton(update_external_tools_btn);
                    if (amelios) {
                        el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                    } else {
                        el.appendChild(updater_bloc);
                    }
                } else {
                    const el = external_display_zone?.parentElement.parentElement.parentElement ?? chest?.parentElement ?? amelios ?? map_actions;
                    const updater_bloc = createLargeUpdateExternalToolsButton(update_external_tools_btn);
                    if (amelios) {
                        el.parentElement.insertBefore(updater_bloc, el.nextElementSibling);
                    } else {
                        el.appendChild(updater_bloc);
                    }
                }
            }

            cancelWaitForElement(wait_key_anchor);
            handleMissingLogsWarning();

            /**
             * Le lien de journal complet peut n'apparaître qu'après le bouton : on
             * attend son arrivée plutôt que de repasser à intervalle fixe. Si le
             * traitement a déjà tout réglé, l'attente est simplement remplacée au
             * rejeu suivant.
             */
            if (!document.getElementById(mho_warn_missing_logs_id) && state.mho_parameters.update_mho_digs) {
                waitForElement(wait_key_complete_log, '.log-complete-link', () => handleMissingLogsWarning());
            } else {
                cancelWaitForElement(wait_key_complete_log);
            }
        } else if (update_external_tools_btn && (!(external_display_zone && pageIsHouse()) || !(amelios && pageIsAmelio()))) {
            cancelWaitForElement(wait_key_anchor);
            update_external_tools_btn.parentElement.remove();
        } else if (!update_external_tools_btn && !document.querySelector(anchor_selector)) {
            /**
             * Aucune zone d'ancrage n'est encore rendue : on se met en attente de la
             * première qui apparaîtra. La branche de repli d'origine exigeait
             * `external_display_zone`, dont l'absence est justement la condition pour
             * l'atteindre : elle était morte, et le bouton n'apparaissait donc qu'au
             * rejeu suivant, déclenché par une action de l'utilisateur.
             *
             * L'attente n'est posée que si aucune ancre n'est présente : le sélecteur
             * couvre plus de cas que les conditions de placement ci-dessus, et un
             * rappel immédiat sur une ancre déjà là bouclerait indéfiniment.
             */
            waitForElement(wait_key_anchor, anchor_selector, () => createUpdateExternalToolsButton());
        }
    }
}


export function createLargeUpdateExternalToolsButton(update_external_tools_btn) {
    const updater_bloc = document.createElement('div');
    updater_bloc.style.marginTop = '1em';
    updater_bloc.style.padding = '0.25em';
    updater_bloc.style.border = '1px solid #ddab76';
    const updater_title = document.createElement('h5');
    updater_title.style.margin = '0 0 0.5em';
    const updater_title_mho_img = document.createElement('img');
    updater_title_mho_img.src = mh_optimizer_icon;
    updater_title_mho_img.style.height = '24px';
    updater_title_mho_img.style.marginRight = '0.5em';
    updater_title.appendChild(updater_title_mho_img);

    const updater_title_text = document.createElement('text');
    updater_title_text.innerText = getScriptInfo().name;
    updater_title.appendChild(updater_title_text);

    updater_bloc.appendChild(updater_title);

    update_external_tools_btn = document.createElement('button');

    update_external_tools_btn.innerHTML = `<img src="${repo_img_hordes_url}emotes/arrowright.gif">` + getI18N(texts.update_external_tools_needed_btn_label);
    update_external_tools_btn.id = mh_update_external_tools_id;

    update_external_tools_btn.addEventListener('click', () => {
        /** Au clic sur le bouton, on appelle la fonction de mise à jour */
        update_external_tools_btn.innerHTML = `<img src="${repo_img_hordes_url}emotes/middot.gif">` + getI18N(texts.update_external_tools_pending_btn_label);
        updateExternalTools()
            .then((response: any) => {
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok') setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok') setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok') setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok') setStorageItem(gm_mho_updated_key, true);

                let tools_fail = [];
                const response_items = Object.keys(response).map((key) => {
                    return { key: key, value: response[key] };
                });

                response_items.forEach((response_item, index) => {

                    const final = Object.keys(response_item.value).map((key) => {
                        return { key: key, value: response_item.value[key] };
                    });
                    tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                    if (index >= response_items.length - 1) {

                        update_external_tools_btn.innerText = '';
                        if (tools_fail.length === 0) {
                            const icon = document.createElement('img');
                            icon.src = `${repo_img_hordes_url}icons/done.png`;
                            update_external_tools_btn.appendChild(icon);

                            const text = document.createElement('text');
                            text.innerText = getI18N(texts.update_external_tools_success_btn_label);
                            update_external_tools_btn.appendChild(text);
                        } else {
                            const icon = document.createElement('img');
                            icon.src = `${repo_img_hordes_url}emotes/warning.gif`;
                            update_external_tools_btn.appendChild(icon);

                            const text = document.createElement('div');
                            update_external_tools_btn.appendChild(text);

                            tools_fail.forEach((tool_fail) => {
                                const tool_text = document.createElement('div');
                                tool_text.innerText = tool_text.key.replace('Status', tool_text.value);
                                text.appendChild(tool_fail);
                            });
                        }
                    }
                });

                if (tools_fail.length > 0) {
                    console.error('Erreur lors de la mise à jour de l\'un des outils', response);
                }
            })
            .catch((e) => {
                update_external_tools_btn.innerText = '';

                const icon = document.createElement('img');
                icon.src = `${repo_img_hordes_url}professions/death.gif`;
                update_external_tools_btn.appendChild(icon);

                const text = document.createElement('text');
                text.innerText = getI18N(texts.update_external_tools_fail_btn_label);
                update_external_tools_btn.appendChild(text);
            });
    });

    updater_bloc.appendChild(update_external_tools_btn);

    return updater_bloc;
}


export function createSmallUpdateExternalToolsButton(update_external_tools_btn) {
    update_external_tools_btn = document.createElement('button');

    update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/arrowright.gif" height="16">`;
    update_external_tools_btn.id = mh_update_external_tools_id;


    const tooltips_container = document.querySelector('#tooltip_container');
    let external_tools_btn_tooltip = tooltips_container.querySelector('#external-tools-btn-tooltip');
    if (!external_tools_btn_tooltip) {
        external_tools_btn_tooltip = document.createElement('div');
        external_tools_btn_tooltip.id = 'external-tools-btn-tooltip';
        external_tools_btn_tooltip.classList.add('tooltip', 'help', 'mho');
        tooltips_container.appendChild(external_tools_btn_tooltip);
    } else {
        external_tools_btn_tooltip.innerHTML = undefined;
    }

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerHTML = `<h5 style="margin-top: 0; font-size: 10px;">${getScriptInfo().name}</h5>`;
    external_tools_btn_tooltip.appendChild(title);

    const status_div = document.createElement('div');
    status_div.classList.add('status');
    status_div.innerText = getI18N(texts.update_external_tools_needed_btn_label);
    external_tools_btn_tooltip.appendChild(status_div);

    update_external_tools_btn.addEventListener('pointerover', () => {
        external_tools_btn_tooltip.style.display = 'block';
        external_tools_btn_tooltip.style.top = update_external_tools_btn.getBoundingClientRect().bottom - 20 + 'px';
        external_tools_btn_tooltip.style.right = (window.innerWidth - update_external_tools_btn.getBoundingClientRect().right - 20) + 'px';
    });

    update_external_tools_btn.addEventListener('pointerout', () => {
        external_tools_btn_tooltip.style.display = 'none';
    });

    update_external_tools_btn.addEventListener('click', () => {
        /** Au clic sur le bouton, on appelle la fonction de mise à jour */
        update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/middot.gif" height="16">`;
        status_div.innerText = getI18N(texts.update_external_tools_pending_btn_label);

        updateExternalTools()
            .then((response: any) => {
                if (response.mapResponseDto.bigBrothHordesStatus.toLowerCase() === 'ok') setStorageItem(gm_bbh_updated_key, true);
                if (response.mapResponseDto.gestHordesApiStatus.toLowerCase() === 'ok' || response.mapResponseDto.gestHordesCellsStatus.toLowerCase() === 'ok') setStorageItem(gm_gh_updated_key, true);
                if (response.mapResponseDto.fataMorganaStatus.toLowerCase() === 'ok') setStorageItem(gm_fata_updated_key, true);
                if (response.mapResponseDto.mhoApiStatus.toLowerCase() === 'ok') setStorageItem(gm_mho_updated_key, true);

                let tools_fail = [];
                const response_items = Object.keys(response).map((key) => {
                    return { key: key, value: response[key] };
                });
                response_items.forEach((response_item, index) => {
                    const final = Object.keys(response_item.value).map((key) => {
                        return { key: key, value: response_item.value[key] };
                    });
                    tools_fail = [...tools_fail, ...final.filter((final_item) => !final_item.value || (final_item.value.toLowerCase() !== 'ok' && final_item.value.toLowerCase() !== 'not activated'))];
                    if (index >= response_items.length - 1) {
                        update_external_tools_btn.innerHTML = tools_fail.length === 0
                            ? `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}icons/done.png" height="16">`
                            : `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}emotes/warning.gif" height="16">`;
                        status_div.innerHTML = tools_fail.length === 0 ? getI18N(texts.update_external_tools_success_btn_label)
                            : `${getI18N(texts.update_external_tools_errors_btn_label)}<br>${tools_fail.map((item) => item.key.replace('Status', ` : ${item.value}`)).join('<br>')}`;
                    }
                });
                if (tools_fail.length > 0) {
                    console.error('Erreur lors de la mise à jour de l\'un des outils', response);
                }
            })
            .catch((error) => {
                console.error('Erreur lors de la mise à jour de l\'un des outils', error);
                update_external_tools_btn.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"><img src="${repo_img_hordes_url}professions/death.gif" height="16">`;
                status_div.innerText = getI18N(texts.update_external_tools_fail_btn_label);
            });
    });

    return update_external_tools_btn;
}
