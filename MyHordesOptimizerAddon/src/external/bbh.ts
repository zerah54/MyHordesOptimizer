import { big_broth_hordes_url, mho_map_key } from '../config/constants';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { getStorageItem } from '../utils/storage';
import { convertResponsePromiseToError } from '../utils/version';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);


export function getBBHMap() {
    return new Promise<any>((resolve, reject) => {
        fetcher(`${big_broth_hordes_url}/?cid=5-${state.mh_user.townDetails?.townId}&pg=map`)
            .then((response: any) => {
                if (response.status === 200) {
                    return response.text();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response: any) => {
                const new_map = [];
                const map = response.querySelector('#carte');
                if (map) {
                    const x_mapping = arrFrom(arrFrom(map.children)[0].querySelectorAll('td')).map((x) => x.innerText);
                    x_mapping.push('');
                    x_mapping.splice(0, 0, '');
                    if (map.querySelector('#cases')) {
                        arrFrom(map.querySelector('#cases')?.querySelectorAll('tr') || [])
                            .forEach((row, row_index) => {
                                const cells = [];
                                let y;
                                arrFrom(row.children).forEach((cell, cell_index) => {
                                    const cell_parts = arrFrom(cell.querySelector('.divs')?.children);

                                    const new_cell: any = {
                                        horizontal: map.querySelector('.lgd_l')?.firstElementChild.children[row_index].firstElementChild.innerText,
                                        vertical: x_mapping[cell_index],
                                        town: cell.querySelector('.door'),
                                        bat: cell.querySelector('.bat'),
                                        my_pos: cell.querySelector('.me'),
                                        expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('expeditionVille') && cell_part.children.length > 0 /*&& arrFrom(cell_part.children).some((expedition_arrow) => expedition_arrow.classList.contains('selected_expe'))*/),
                                        expedition_arrows: [],
                                        not_yet_visited: cell.querySelector('.nv'),
                                        not_visited_today: cell.querySelector('.nvt'),
                                        zombies: cell.querySelector('.zombies') ? arrFrom(cell.querySelector('.zombies').classList).find((class_name) => class_name.startsWith('z_')).replace('z_', '') : undefined,
                                        empty: cell.querySelector('.praf'),
                                        empty_bat: cell.querySelector('.mark1'),
                                        ruin: cell.querySelector('.tag_11')
                                    };
                                    cells.push(new_cell);
                                });
                                new_map.push(cells);
                            });
                        resolve({ map: new_map, vertical_mapping: x_mapping });
                    }
                }
                reject();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}


/** Récupère la carte de BBH */

export function getBBHRuin() {
    return new Promise<any>((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                const map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                const new_map = [];
                const rows = arrFrom(map_html.querySelector('#plan').firstElementChild.children);
                const x_mapping = arrFrom(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => arrFrom(row.children).some((cell) => cell.querySelector('.divs')))
                    .forEach((row, row_index, rows_array) => {
                        const new_cells = [];
                        const cells = arrFrom(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (!cell.querySelector('.divs')) {
                                y = cell.innerText;
                            } else {

                                const cell_parts = arrFrom(cell.firstElementChild.children);

                                const div_zombies = cell_parts.find((cell_part) => arrFrom(cell_part.classList).some((class_name) => class_name.startsWith('z')));
                                const zombies = div_zombies ? arrFrom(div_zombies.classList).find(() => (class_name) => class_name.startsWith('z')) : undefined;

                                const new_cell: any = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: zombies ? zombies[1] : ''
                                };

                                const div_path = cell_parts.find((cell_part) => arrFrom(cell_part.classList).some((class_name) => class_name.startsWith('m')));
                                const img_path = div_path ? arrFrom(div_path.classList).find(() => (class_name) => class_name.startsWith('m')) : undefined;
                                switch (img_path) {
                                    case 'm1':
                                        new_cell.borders = 'exit';
                                        break;
                                    case 'm2':
                                        new_cell.borders = '0000';
                                        break;
                                    case 'm11':
                                        new_cell.borders = '0101';
                                        break;
                                    case 'm12':
                                        new_cell.borders = '1010';
                                        break;
                                    case 'm13':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'm21':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'm22':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'm23':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'm24':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'm31':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'm32':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'm33':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'm34':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'm41':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'm42':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'm43':
                                        new_cell.borders = '0001';
                                        break;
                                    case 'm44':
                                        new_cell.borders = '0010';
                                        break;
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                const div_door = cell_parts.find((cell_part) => arrFrom(cell_part.classList).some((class_name) => class_name.startsWith('p')));
                                const img_door = div_door ? arrFrom(div_door.classList).find(() => (class_name) => class_name.startsWith('p')) : undefined;
                                if (img_door) {
                                    switch (img_door) {
                                        case 'p2':
                                            new_cell.door = 'item_lock';
                                            break;
                                        case 'p1':
                                            new_cell.door = 'item_door';
                                            break;
                                        case 'p5':
                                            new_cell.door = 'item_classicKey';
                                            break;
                                        case 'p4':
                                            new_cell.door = 'item_bumpKey';
                                            break;
                                        case 'p3':
                                            new_cell.door = 'item_magneticKey';
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                new_cells.push(new_cell);
                            }
                        });
                        new_map.push(new_cells);
                    });
                resolve({ map: new_map, vertical_mapping: x_mapping });
            }
        });
    });
}

