import {getMap} from '../api/map';
import {mh_optimizer_icon, repo_img_hordes_url} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {pageIsDesert} from '../utils/page';
import {getCellDetailsByPosition} from '../utils/position';

export function displayCellDetailsOnPage() {
    if (state.mho_parameters.display_more_informations_from_mho && pageIsDesert()) {
        let cell = getCellDetailsByPosition();
        let cell_informations = document.querySelector('#cell-informations');
        if (cell) {
            state.current_cell = cell;
            if (!cell_informations) {
                cell_informations = document.createElement('div');
                cell_informations.id = 'cell-informations';
                cell_informations.classList.add('row');

                let cell_informations_div = document.createElement('div');
                cell_informations_div.style.width = '100%';
                cell_informations_div.classList.add('background', 'cell');
                cell_informations.appendChild(cell_informations_div);

                let cell_informations_header = document.createElement('h5');
                cell_informations_header.style.marginTop = '0';
                cell_informations_header.style.display = 'flex';
                cell_informations_header.style.justifyContent = 'space-between';
                cell_informations_header.style.alignItems = 'center';
                cell_informations_div.appendChild(cell_informations_header);

                let cell_informations_header_left = document.createElement('div');
                cell_informations_header_left.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px; height: 24px; margin-right: 0.5em">${getI18N(texts.additional_informations)}`;
                cell_informations_header.appendChild(cell_informations_header_left);

                let cell_informations_header_right = document.createElement('div');
                cell_informations_header_right.innerText = `🗘`;
                cell_informations_header_right.style.fontSize = '16px';
                cell_informations_header_right.style.cursor = 'pointer';
                cell_informations_header.appendChild(cell_informations_header_right);

                cell_informations_header_right.addEventListener('click', () => {
                    if (cell_informations.querySelector('#cell-note-content')) {
                        cell_informations.querySelector('#cell-note-content').innerText = '🗘';
                    }
                    if (cell_informations.querySelector('#cell-digs-content')) {
                        cell_informations.querySelector('#cell-digs-content').innerText = '🗘';
                    }
                    if (cell_informations.querySelector('#cell-ruin-content')) {
                        cell_informations.querySelector('#cell-ruin-content').innerText = '🗘';
                    }
                    getMap().then(() => {
                        cell = getCellDetailsByPosition();
                        updateInformations(cell);
                    });
                });

                let cell_informations_content = document.createElement('div');
                cell_informations_content.style.display = 'flex';
                cell_informations_content.style.flexDirection = 'column';
                cell_informations_content.style.gap = '0.5em';
                cell_informations_div.appendChild(cell_informations_content);

                let createSubBlock = (id, title) => {
                    let sub_block = document.createElement('div');
                    sub_block.id = id;
                    cell_informations_content.appendChild(sub_block);

                    let sub_block_header = document.createElement('h5');
                    sub_block_header.id = id + '-header'
                    sub_block_header.style.marginTop = '0';
                    sub_block_header.style.borderBottomWidth = '1px';
                    sub_block_header.style.fontWeight = 'normal';
                    sub_block_header.innerText = title;
                    sub_block.appendChild(sub_block_header);

                    let sub_block_content = document.createElement('div');
                    sub_block_content.id = id + '-content';
                    sub_block.appendChild(sub_block_content);
                }

                let map_box = document.querySelector('.map-box');
                map_box.parentElement.parentElement.appendChild(cell_informations);

                let cell_note = createSubBlock('cell-note', getI18N(texts.note));
                let cell_digs = createSubBlock('cell-digs', getI18N(texts.digs_state_header));
                if (state.current_cell.idRuin !== null && state.current_cell.idRuin !== undefined) {
                    let cell_ruin = createSubBlock('cell-ruin', getI18N(texts.ruin_state_header));
                }
            }

            let insertCellNote = (cell) => {
                if (cell_informations.querySelector('#cell-note-content')) {
                    cell_informations.querySelector('#cell-note-content').innerHTML = cell.note && cell.note !== ''
                        ? `<div>${cell.note}</div>`
                        : `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.no_note)}</div>`;
                }
            };

            let insertCellDigs = (cell) => {
                if (cell_informations.querySelector('#cell-digs-content')) {
                    cell_informations.querySelector('#cell-digs-content').innerHTML = `
                    <div>${getI18N(texts.digs_max)} : ${Math.round(cell.maxPotentialRemainingDig - cell.totalSucces)}</div>
                    <div>${getI18N(texts.digs_average)} : ${Math.round(cell.averagePotentialRemainingDig - cell.totalSucces)}</div>
                `;
                }
            };

            let insertRuinDigs = (cell) => {
                if (state.current_cell.idRuin !== null && state.current_cell.idRuin !== undefined && state.current_cell.idRuin > 0) {
                    let current_ruin = state.ruins.find((ruin) => ruin.id === state.current_cell.idRuin);
                    let empty_text = `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.ruin_dried)}</div>`;
                    let complete_text = `<div>${getI18N(texts.ruin_not_dried)}</div>`;
                    let ruin_drops = ``;
                    if (current_ruin && (current_ruin.explorable || !state.current_cell.isRuinDryed)) {
                        ruin_drops += `<div style="display: flex; flex-direction: row; gap: 0.5em; flex-wrap: wrap; font-size: 12px;">`;
                        if (current_ruin?.drops) {
                            current_ruin.drops.forEach((drop) => {
                                ruin_drops += `<span style="display: flex; flex-direction: column; align-items: center;"><img src="${repo_img_hordes_url}/${drop.item.img}">${Math.round(drop.probability * 100 * 10) / 10}%</span>`
                            })
                        }
                    }
                    ruin_drops += `</div>`;
                    if (cell_informations.querySelector('#cell-ruin-content')) {
                        cell_informations.querySelector('#cell-ruin-content').innerHTML = (!current_ruin?.explorable ? (state.current_cell.isRuinDryed ? empty_text : complete_text) : '') + ruin_drops;
                    }
                }
            };

            let updateInformations = (cell) => {
                insertCellNote(cell);
                insertCellDigs(cell);
                insertRuinDigs(cell);
            }

            updateInformations(cell);

        }
    } else {
        state.current_cell = undefined;
    }
}
