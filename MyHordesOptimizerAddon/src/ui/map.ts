import { mh_optimizer_icon, mh_optimizer_map_window_id, mho_display_map_id, mho_header_space_id, mho_map_key, repo_img_hordes_url } from '../config/constants';
import { getBBHMap, getBBHRuin } from '../external/bbh';
import { getFMMap, getFMRuin } from '../external/fata-morgana';
import { getGHMap, getGHRuin } from '../external/gest-hordes';
import { state } from '../state';
import { getStorageItem } from '../utils/storage';
import { createMapWindow } from './window';

export function createDisplayMapButton() {
    const display_map_btn = document.getElementById(mho_display_map_id);

    if (state.mho_parameters.display_map) {
        const mho_header_space = document.getElementById(mho_header_space_id);
        if (display_map_btn || !mho_header_space) return;

        const btn_container = document.createElement('div');
        btn_container.id = mho_display_map_id;

        const postbox_img = document.querySelector('#postbox img');

        const btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_mho_img);

        const btn_img = document.createElement('img');
        btn_img.src = repo_img_hordes_url + 'emotes/explo.gif';
        btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_img);

        btn_container.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            displayMapContent();
        });

        mho_header_space.appendChild(btn_container);

        createMapWindow();
    } else if (display_map_btn) {
        display_map_btn.remove();
    }
}


export function displayMapContent() {
    const map_window = document.getElementById(mh_optimizer_map_window_id);
    map_window.classList.add('visible');
    displayMap();
}


export function displayMap() {
    const content = document.getElementById(mh_optimizer_map_window_id + '-content');
    let table = content.querySelector('table');
    if (table) {
        table.outerHTML = '';
    }

    const transformMapping = (map) => {
        table = document.createElement('table');
        table.setAttribute('style', 'border-collapse: collapse;');
        table.classList.add('mho-map');
        const init_col_tr = document.createElement('tr');
        table.appendChild(init_col_tr);

        map.vertical_mapping.forEach((cell) => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            init_col_tr.appendChild(td);
        });

        map.map.forEach((row) => {
            const tr = document.createElement('tr');
            row.forEach((cell, cell_index) => {
                if (cell_index === 0) {
                    const init_row_td = document.createElement('td');
                    init_row_td.innerText = cell.horizontal;
                    init_row_td.classList.add('around-map');
                    tr.appendChild(init_row_td);
                }
                const td = document.createElement('td');
                tr.appendChild(td);

                const td_content = document.createElement('div');
                td_content.style.position = 'relative';
                td_content.style.height = '100%';
                td_content.style.width = '100%';
                td.appendChild(td_content);

                if (cell.not_yet_visited) {
                    td.style.backgroundColor = '#0f1717';
                } else if (cell.not_visited_today) {
                    td.style.backgroundColor = 'darkslategray';
                } else {
                    if (+cell.zombies === 1) {
                        td.style.backgroundColor = 'goldenrod';
                    } else if (+cell.zombies === 2) {
                        td.style.backgroundColor = 'chocolate';
                    } else if (+cell.zombies >= 3) {
                        td.style.backgroundColor = 'firebrick';
                    } else {
                        td.style.backgroundColor = 'green';
                    }
                }


                if (cell.town) {
                    const town_here = document.createElement('div');
                    town_here.innerText = '🏠';
                    town_here.style.position = 'absolute';
                    town_here.style.inset = 'calc(50% - 11px)';

                    td_content.appendChild(town_here);
                }
                if (cell.bat) {
                    const bat_here = document.createElement('div');
                    bat_here.style.backgroundColor = 'grey';
                    bat_here.style.position = 'absolute';
                    bat_here.style.inset = '4px';

                    if (cell.ruin) {
                        bat_here.innerText = 'R';
                        bat_here.style.color = 'black';
                    } else if (cell.empty_bat) {
                        bat_here.classList.add('empty-bat');
                    }
                    td_content.appendChild(bat_here);
                }

                if (cell.empty && !cell.town && !cell.not_yet_visited) {
                    const empty_here = document.createElement('div');
                    empty_here.classList.add('dotted-background');
                    empty_here.style.position = 'absolute';
                    empty_here.style.inset = '-1px';

                    td_content.appendChild(empty_here);
                }

                if (cell.my_pos) {
                    const player_here = document.createElement('div');
                    player_here.style.backgroundColor = 'white';
                    player_here.style.margin = 'auto';
                    player_here.style.width = '6px';
                    player_here.style.height = '6px';
                    player_here.style.position = 'absolute';
                    player_here.style.inset = 'calc(50% - 3px)';
                    td_content.appendChild(player_here);
                }
                // if (cell.expedition_here) {
                //     let expedition_here = document.createElement('div');
                //     expedition_here.style.backgroundColor = 'black';
                //     expedition_here.style.margin = 'auto';
                //     expedition_here.textAlign = 'center';
                //     expedition_here.style.width = '10px';
                //     expedition_here.style.height = '10px';
                //     td_content.appendChild(expedition_here);
                // }

                if (cell_index === row.length - 1) {
                    const final_row_td = document.createElement('td');
                    final_row_td.innerText = cell.horizontal;
                    final_row_td.classList.add('around-map');
                    tr.appendChild(final_row_td);
                }
            });
            table.appendChild(tr);
        });

        const final_col_tr = document.createElement('tr');
        map.vertical_mapping.forEach((cell) => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            final_col_tr.appendChild(td);
        });
        table.appendChild(final_col_tr);
        table.firstElementChild.firstElementChild.innerText = '🗘';
        table.firstElementChild.firstElementChild.style.cursor = 'pointer';
        table.firstElementChild.firstElementChild.addEventListener('click', () => displayMap());
        content.appendChild(table);
    };

    const transformRuinMapping = (map) => {
        table = document.createElement('table');
        table.setAttribute('style', 'border-collapse: collapse;');
        table.classList.add('mho-ruin');
        const init_col_tr = document.createElement('tr');
        table.appendChild(init_col_tr);

        map.vertical_mapping.forEach((cell) => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            init_col_tr.appendChild(td);
        });
        map.map.forEach((row) => {
            const tr = document.createElement('tr');
            row.forEach((cell, cell_index) => {
                if (cell_index === 0) {
                    const init_row_td = document.createElement('td');
                    init_row_td.innerText = cell.horizontal;
                    init_row_td.classList.add('around-map');
                    tr.appendChild(init_row_td);
                }
                const td = document.createElement('td');
                td.style.padding = (0) as any;
                tr.appendChild(td);
                const td_content = document.createElement('div');
                td.style.position = 'relative';
                td.appendChild(td_content);

                if (cell.borders !== '0000') {
                    // let border = document.createElement('div');
                    td_content.style.backgroundColor = 'black';
                    td_content.style.position = 'absolute';
                    td_content.style.top = '0';
                    td_content.style.left = '0';
                    td_content.style.bottom = '0';
                    td_content.style.right = '0';

                    const path = document.createElement('div');
                    path.style.position = 'absolute';
                    path.style.backgroundColor = 'grey';
                    if (cell.borders === 'exit') {
                        path.style.boxShadow = 'inset 0px 5px 6px lightyellow';
                        path.style.left = '4px';
                        path.style.top = '4px';
                        path.style.right = '4px';
                        path.style.bottom = '0';
                        td.classList.add('exit');
                    } else {
                        path.style.left = cell.borders[0] === '0' ? '4px' : '0';
                        path.style.top = cell.borders[1] === '0' ? '4px' : '0';
                        path.style.right = cell.borders[2] === '0' ? '4px' : '0';
                        path.style.bottom = cell.borders[3] === '0' ? '4px' : '0';
                    }
                    td_content.appendChild(path);
                } else {
                    td.classList.add('empty');
                }

                if (cell.zombies && cell.zombies !== '' && cell.zombies > 0) {
                    const zombies = document.createElement('div');
                    zombies.innerText = cell.zombies;
                    zombies.style.position = 'absolute';
                    zombies.style.bottom = '4px';
                    zombies.style.right = '4px';
                    zombies.style.fontSize = '10px';
                    zombies.style.lineHeight = '10px';
                    td_content.appendChild(zombies);
                }

                if (cell.door) {
                    const img = document.createElement('img');
                    img.src = `${repo_img_hordes_url}item/${cell.door}.gif`;
                    img.style.position = 'absolute';
                    img.style.left = 'calc(50% - 8px)';
                    img.style.top = 'calc(50% - 8px)';
                    img.style.zIndex = '100';
                    td_content.appendChild(img);
                    td.classList.add('door');
                }

                if (cell_index === row.length - 1) {
                    const final_row_td = document.createElement('td');
                    final_row_td.innerText = cell.horizontal;
                    final_row_td.classList.add('around-map');
                    tr.appendChild(final_row_td);
                }

                td.addEventListener('click', () => {
                    const my_pos = table.querySelector('.my-pos');
                    if (my_pos) {
                        my_pos.remove();
                    }
                    const new_pos = document.createElement('div');
                    new_pos.classList.add('my-pos');
                    new_pos.style.position = 'absolute';
                    new_pos.style.backgroundColor = 'white';
                    new_pos.style.zIndex = '300';
                    new_pos.style.inset = 'calc(50% - 3px)';
                    td_content.appendChild(new_pos);
                });
            });
            table.appendChild(tr);
        });

        const final_col_tr = document.createElement('tr');
        map.vertical_mapping.forEach((cell) => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.classList.add('around-map');
            final_col_tr.appendChild(td);
        });
        table.appendChild(final_col_tr);
        table.firstElementChild.firstElementChild.innerText = '🗘';
        table.firstElementChild.firstElementChild.style.cursor = 'pointer';
        table.firstElementChild.firstElementChild.addEventListener('click', () => displayMap());
        content.appendChild(table);
    };

    getStorageItem(mho_map_key).then((mho_map) => {
        if (mho_map) {
            if (mho_map.source === 'gh') {
                if (mho_map.map === 'ruin') {
                    getGHRuin().then((map) => transformRuinMapping(map));
                } else {
                    getGHMap().then((map) => transformMapping(map));
                }
            } else if (mho_map.source === 'bbh') {
                if (mho_map.map === 'ruin') {
                    getBBHRuin().then((map) => transformRuinMapping(map));
                } else {
                    getBBHMap().then((map) => transformMapping(map));
                }
            } else if (mho_map.source === 'fm') {
                if (mho_map.map === 'ruin') {
                    getFMRuin().then((map) => transformRuinMapping(map));
                } else {
                    getFMMap().then((map) => transformMapping(map));
                }
            }
        }
    });
}

/** Si l'option associée est activée, demande confirmation avant de quitter si les options d'escorte ne sont pas bonnes */
