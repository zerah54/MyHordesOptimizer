import {getEstimations, saveEstimations} from '../api/estimations';
import {mh_optimizer_icon, mho_watchtower_estim_id, repo_img_hordes_url} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {copyToClipboard} from '../utils/misc';
import {pageIsWatchtower} from '../utils/page';
import {getScriptInfo} from '../utils/version';

export function displayEstimationsOnWatchtower() {
    if (state.mho_parameters.display_estimations_on_watchtower && pageIsWatchtower()) {
        let estim_block = document.querySelector(`#${mho_watchtower_estim_id}`);
        let small_note = document.querySelector('.small-note');
        if (estim_block || !small_note) return;


        const TDG_VALUES = [33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];
        const PLANIF_VALUES = [0, 4, 8, 13, 17, 21, 25, 29, 33, 38, 42, 46, 50, 54, 58, 63, 67, 71, 75, 79, 83, 88, 92, 96, 100];

        const watchtower_estim_block = document.querySelector('.block.watchtower');
        const watchtower_estim_block_prediction = watchtower_estim_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;

        if (watchtower_estim_block) {
            const current_estimation_percent_read = watchtower_estim_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '');
            const current_estimation_percent = current_estimation_percent_read !== undefined && current_estimation_percent_read !== null ? +current_estimation_percent_read : (watchtower_estim_block_prediction ? 100 : undefined);

            const watchtower_planif_block = watchtower_estim_block.nextElementSibling;
            const watchtower_planif_block_prediction = watchtower_planif_block.querySelector('.x-copy-prediction')?.querySelector('[x-contain-prediction]')?.innerText;
            const current_planif_percent_read = watchtower_planif_block.querySelector('.watchtower-prediction-text')?.innerText?.replace('%', '')
            const current_planif_percent = current_planif_percent_read !== undefined && current_planif_percent_read !== null ? +current_planif_percent_read : (watchtower_planif_block_prediction ? 100 : undefined);

            let createEstimationRow = (value, is_new_estimation, estimation, type) => {
                return `<b style="color: #afb3cf; opacity: .8;">[${value}%]</b>
                        <div id="${type}_${value}" style="font-weight: ${is_new_estimation ? 'bold' : 'normal'}; color: ${is_new_estimation ? 'lightgreen' : 'unset'}">
                            <span class="start" style="width: 100px">${estimation?.min || ''}</span> - <span class="end" style="width: 100px">${estimation?.max || ''}</span><img src="${repo_img_hordes_url}emotes/zombie.gif">
                        </div>`;
            };
            let createCalculatedAttackRow = (calculated_attack) => {
                let estim_values_block_title_calculated_text = ``;
                estim_values_block_title_calculated_text += `<div class="attack" style="display: flex; justify-content: space-between; gap: 1em;"><b>${getI18N(texts.calculated_attack)}</b><div><span>${calculated_attack.result.min}</span> - <span>${calculated_attack.result.max}</span></div></div>`;

                return estim_values_block_title_calculated_text;
            }

            let updateEstimationRow = (estimations, percent, type) => {
                if (!estimations.estimations[type][`_${percent}`]) {
                    /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                    let estimations_workaround_estim = {...estimations.estimations};
                    let estimations_workaround_type = {...estimations_workaround_estim[type]};
                    let estimations_workaround_type_percent = {min: null, max: null};
                    estimations_workaround_type[`_${percent}`] = {...estimations_workaround_type_percent};
                    estimations_workaround_estim[type] = {...estimations_workaround_type};
                    estimations.estimations = {...estimations_workaround_estim};
                }

                let estimation = estimations.estimations[type][`_${percent}`];
                let main = document.querySelector(`#${mho_watchtower_estim_id}`);
                let row = main.querySelector(`#${type}_${percent}`);
                row.style.fontWeight = 'normal';
                row.style.color = 'unset';

                let start = row.querySelector(`.start`);
                start.innerText = estimation?.min || '';
                let end = row.querySelector(`.end`);
                end.innerText = estimation?.max || '';
            }

            let updateCalculatedAttackRow = (estimations, type) => {
                let main = document.querySelector(`#${mho_watchtower_estim_id}`);
                let block = main.querySelector(`#${type}`);
                if (block) {
                    let header = block.querySelector(`h5`);
                    let calc_block = header.lastElementChild;
                    let calc_attack = calc_block.querySelector('.attack').lastElementChild;
                    if (type === 'estim') {
                        if (calc_attack) {
                            calc_attack.firstElementChild.innerText = estimations.today_attack.result.min;
                            calc_attack.lastElementChild.innerText = estimations.today_attack.result.max;
                        }
                    } else {
                        if (calc_attack) {
                            calc_attack.firstElementChild.innerText = estimations.tomorrow_attack.result.min;
                            calc_attack.lastElementChild.innerText = estimations.tomorrow_attack.result.max;
                        }
                    }
                }
            }

            getEstimations().then((estimations) => {
                estimations = {...estimations};
                estim_block = document.createElement('div');
                estim_block.style.marginTop = '1em';
                estim_block.style.padding = '0.25em';
                estim_block.style.border = '1px solid #ddab76';
                estim_block.id = mho_watchtower_estim_id;

                let estim_block_title = document.createElement('h5');
                estim_block_title.style.margin = '0 0 0.5em';
                estim_block_title.style.display = 'flex';
                estim_block_title.style.gap = '0.5em';
                estim_block_title.style.alignItems = 'center';
                estim_block.appendChild(estim_block_title);
                let estim_block_title_mho_img = document.createElement('img');
                estim_block_title_mho_img.src = mh_optimizer_icon;
                estim_block_title_mho_img.style.height = '24px';
                estim_block_title.appendChild(estim_block_title_mho_img);

                let estim_block_title_text = document.createElement('text');
                estim_block_title_text.style.flex = '1';
                estim_block_title_text.innerText = getScriptInfo().name;
                estim_block_title.appendChild(estim_block_title_text);

                let estim_block_title_save_button = document.createElement('button');
                estim_block_title_save_button.style.flex = '0';
                estim_block_title_save_button.style.margin = '0';
                estim_block_title_save_button.innerText = `💾`;
                estim_block_title_save_button.title = getI18N(texts.save);
                estim_block_title.appendChild(estim_block_title_save_button);

                estim_block_title_save_button.addEventListener('click', () => {
                    saveEstimations({
                            percent: current_estimation_percent,
                            value: {
                                min: +watchtower_estim_block_prediction?.split(' ')[0],
                                max: +watchtower_estim_block_prediction?.split(' ')[2]
                            }
                        },
                        {
                            percent: current_planif_percent,
                            value: {
                                min: +watchtower_planif_block_prediction?.split(' ')[0],
                                max: +watchtower_planif_block_prediction?.split(' ')[2]
                            }
                        })
                        .then(() => {
                            estim_block_title_save_button.innerHTML = `<img src="${repo_img_hordes_url}icons/done.png">`;

                            getEstimations().then((new_saved_estimations) => {
                                updateCalculatedAttackRow(new_saved_estimations, 'estim')
                                updateCalculatedAttackRow(new_saved_estimations, 'planif')
                                TDG_VALUES.forEach((percent) => {
                                    updateEstimationRow(new_saved_estimations, percent, 'estim');
                                });
                                if (watchtower_planif_block && watchtower_planif_block_prediction) {
                                    PLANIF_VALUES.forEach((percent) => {
                                        updateEstimationRow(new_saved_estimations, percent, 'planif');
                                    });
                                }
                            });
                        });
                });

                let estim_block_title_share_button = document.createElement('button');
                estim_block_title_share_button.style.flex = '0';
                estim_block_title_share_button.style.margin = '0';
                estim_block_title_share_button.style.whiteSpace = 'nowrap';
                estim_block_title_share_button.innerText = `⧉ ${getI18N(texts.copy_forum)}`;
                estim_block_title_share_button.title = `${getI18N(texts.copy_forum_watchtower_tooltip)}`;
                estim_block_title.appendChild(estim_block_title_share_button);

                estim_block_title_share_button.addEventListener('click', () => {
                    getEstimations().then((saved_estimations) => {
                        let text = '';
                        /** Ajout du titre **/
                        text += `[big][b][bad]J${saved_estimations.estimations.day}[/bad][/b][/big]{hr}\n`;

                        /** Ajout du titre "Attaque du jour" */
                        text += `[i]${getI18N(texts.estim_title)} (J${saved_estimations.estimations.day})[/i]\n`;

                        /** Ajout des valeurs du jour */
                        TDG_VALUES.forEach((value_key) => {
                            const value = saved_estimations.estimations.estim['_' + value_key];
                            if (value && (value.min || value.max)) {
                                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
                            } else {
                                text += `[b][${value_key}%][/b] \n`
                            }
                        });

                        text += '{hr}\n';

                        /** Ajout du titre "Attaque du lendemain" */
                        text += `[i]${getI18N(texts.planif_title)} (J${saved_estimations.estimations.day + 1})[/i]\n`;

                        /** Ajout des valeurs du lendemain */
                        PLANIF_VALUES.forEach((value_key) => {
                            const value = saved_estimations.estimations.planif['_' + value_key];
                            if (value && (value.min || value.max)) {
                                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
                            }
                        });

                        text += '{hr}';

                        copyToClipboard(text);
                        estim_block_title_share_button.innerHTML = `<img src="${repo_img_hordes_url}icons/done.png">`;
                    });
                });

                small_note.parentElement.insertBefore(estim_block, small_note);

                let estim_block_content = document.createElement('div');
                estim_block_content.style.display = 'flex';
                estim_block_content.style.flexWrap = 'wrap';
                estim_block_content.style.justifyContent = 'space-around';
                estim_block.appendChild(estim_block_content);

                let estim_values_block = document.createElement('div');
                estim_values_block.id = 'estim';
                estim_block_content.appendChild(estim_values_block);

                let estim_values_block_title = document.createElement('h5');
                estim_values_block_title.style.marginTop = '0.25em';

                let estim_values_block_title_title = document.createElement('div');
                estim_values_block_title_title.innerText = getI18N(texts.estim_title);
                estim_values_block_title.appendChild(estim_values_block_title_title);

                let estim_values_block_title_calculated = document.createElement('div');
                let estim_values_block_title_calculated_text = createCalculatedAttackRow(estimations.today_attack);
                estim_values_block_title_calculated.innerHTML = estim_values_block_title_calculated_text;
                estim_values_block_title.appendChild(estim_values_block_title_calculated);

                estim_values_block.appendChild(estim_values_block_title);

                TDG_VALUES.forEach((value) => {
                    let saved_estimation = estimations.estimations.estim['_' + value] ? {
                        min: estimations.estimations.estim['_' + value].min,
                        max: estimations.estimations.estim['_' + value].max
                    } : undefined;

                    if (!estimations.estimations.estim['_' + value]) {
                        /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                        let new_estimations = {...estimations};
                        let new_estimations_estimations = {...new_estimations.estimations};
                        let new_estimations_estimations_estim = {...new_estimations_estimations.estim};
                        new_estimations_estimations_estim['_' + value] = {min: null, max: null};
                        new_estimations_estimations.estim = {...new_estimations_estimations_estim};
                        new_estimations.estimations = {...new_estimations_estimations};
                        estimations = {...new_estimations};
                    }
                    let value_block = document.createElement('div');
                    value_block.style.display = 'flex';
                    value_block.style.justifyContent = 'space-between';
                    value_block.style.gap = '1em';
                    estim_values_block.appendChild(value_block);

                    let estimation = estimations.estimations.estim['_' + value];

                    if (current_estimation_percent === value) {
                        let current_estimation_value = {
                            min: watchtower_estim_block_prediction.split(' ')[0],
                            max: watchtower_estim_block_prediction.split(' ')[2]
                        };
                        if (current_estimation_percent !== null && current_estimation_percent !== undefined && current_estimation_value) {
                            estimation.min = current_estimation_value.min;
                            estimation.max = current_estimation_value.max;
                        }
                    }
                    const is_new_estimation = current_estimation_percent === value && (+saved_estimation?.min !== +estimation?.min || +saved_estimation?.max !== +estimation?.max);
                    value_block.innerHTML = createEstimationRow(value, is_new_estimation, estimation, 'estim');
                });

                if (watchtower_planif_block && watchtower_planif_block_prediction) {

                    let planif_values_block = document.createElement('div');
                    planif_values_block.id = 'planif';
                    estim_block_content.appendChild(planif_values_block);

                    let planif_values_block_title = document.createElement('h5');
                    planif_values_block_title.style.marginTop = '0.25em';

                    let planif_values_block_title_title = document.createElement('div');
                    planif_values_block_title_title.innerText = getI18N(texts.planif_title);
                    planif_values_block_title.appendChild(planif_values_block_title_title);

                    let planif_values_block_title_calculated = document.createElement('div');
                    let planif_values_block_title_calculated_text = createCalculatedAttackRow(estimations.tomorrow_attack);
                    planif_values_block_title_calculated.innerHTML = planif_values_block_title_calculated_text;
                    planif_values_block_title.appendChild(planif_values_block_title_calculated);

                    planif_values_block.appendChild(planif_values_block_title);

                    PLANIF_VALUES.forEach((value) => {
                        let saved_estimation = estimations.estimations.planif['_' + value] ? {
                            min: estimations.estimations.planif['_' + value].min,
                            max: estimations.estimations.planif['_' + value].max
                        } : undefined;


                        if (!estimations.estimations.planif['_' + value]) {
                            /** Workaround pour définir sur l'extension firefox sans passer par cloneinto */
                            let new_estimations = {...estimations};
                            let new_estimations_estimations = {...new_estimations.estimations};
                            let new_estimations_estimations_planif = {...new_estimations_estimations.planif};
                            new_estimations_estimations_planif['_' + value] = {min: null, max: null};
                            new_estimations_estimations.planif = {...new_estimations_estimations_planif};
                            new_estimations.estimations = {...new_estimations_estimations};
                            estimations = {...new_estimations};
                        }

                        let value_block = document.createElement('div');
                        value_block.style.display = 'flex';
                        value_block.style.justifyContent = 'space-between';
                        value_block.style.gap = '1em';
                        planif_values_block.appendChild(value_block);

                        let estimation = estimations.estimations.planif['_' + value];

                        if (current_planif_percent === value) {
                            let current_estimation_value = {
                                min: watchtower_planif_block_prediction.split(' ')[0],
                                max: watchtower_planif_block_prediction.split(' ')[2]
                            };
                            if (current_planif_percent !== null && current_planif_percent !== undefined && current_estimation_value) {
                                estimation.min = current_estimation_value.min;
                                estimation.max = current_estimation_value.max;
                            }
                        }
                        const is_new_estimation = current_planif_percent === value && (+saved_estimation?.min !== +estimation?.min || +saved_estimation?.max !== +estimation?.max);
                        value_block.innerHTML = createEstimationRow(value, is_new_estimation, estimation, 'planif');
                    });
                }
            });
        }
    }
}
