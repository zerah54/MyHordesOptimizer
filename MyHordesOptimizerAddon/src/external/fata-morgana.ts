import { mho_map_key } from '../config/constants';
import { getStorageItem } from '../utils/storage';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);


/** Récupère la carte de FataMorgana */
export function getFMMap() {
    return new Promise<any>((resolve, reject) => {
        const map_html = document.createElement('div');

        getStorageItem(mho_map_key).then((mho_map) => {
            map_html.innerHTML = mho_map.block;

            const new_map = [];
            const map = arrFrom(map_html.querySelector('#map')?.children);
            const x_mapping = arrFrom(map[0].children).map((x) => x.innerText);

            map
                .filter((row) => arrFrom(row.children).some((cell) => cell.classList.contains('mapzone')))
                .forEach((row) => {
                    const cells = [];
                    let y;
                    arrFrom(row.children).forEach((cell, index) => {
                        if (cell.classList.contains('mapruler')) {
                            y = cell.innerText;
                        } else {
                            const cell_parts = arrFrom(cell.children);

                            const new_cell: any = {
                                horizontal: y,
                                vertical: x_mapping[index],
                                town: cell.classList.contains('city'),
                                bat: cell_parts.some((cell_part) => cell_part.classList.contains('building')),
                                my_pos: cell_parts.some((cell_part) => cell_part.classList.contains('posJoueur')),
                                expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('route-counter')),
                                expedition_arrows: [],
                                not_yet_visited: cell.classList.contains('nyv'),
                                not_visited_today: cell.classList.contains('nvt'),
                                zombies: arrFrom(cell.classList).filter((class_name) => class_name.startsWith('danger')).map((class_name) => class_name.replace('danger', ''))[0],
                                empty: !cell.querySelector('.zone-status-full'),
                                empty_bat: cell.querySelector('.depleted-building'),
                                ruin: cell.querySelector('.explorable-building'),
                            };
                            cells.push(new_cell);
                        }
                    });
                    new_map.push(cells);
                });
            resolve({ map: new_map, vertical_mapping: x_mapping });
        });
    });
}

/** Récupère la carte de FataMorgana */
export function getFMRuin() {
    return new Promise<any>((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                const map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                const new_map = [];
                const rows = arrFrom(map_html.querySelector('#ruinmap')?.children);
                const x_mapping = arrFrom(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => arrFrom(row.children).some((cell) => cell.classList.contains('mapzone')))
                    .forEach((row, row_index, rows_array) => {
                        const new_cells = [];
                        const cells = arrFrom(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (cell.classList.contains('mapruler')) {
                                y = cell.innerText;
                            } else {
                                const new_cell: any = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: cell.getAttribute('z')
                                };

                                const img = arrFrom(cell.classList).find((class_name) => class_name.startsWith('tile-'));
                                switch (img) {
                                    case 'tile-1':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'tile-2':
                                        new_cell.borders = '0010';
                                        break;
                                    case 'tile-3':
                                        new_cell.borders = '0001';
                                        break;
                                    case 'tile-4':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'tile-5':
                                        if (cell.classList.contains('ruinEntry')) {
                                            new_cell.borders = 'exit';
                                        } else {
                                            new_cell.borders = '0101';
                                        }
                                        break;
                                    case 'tile-6':
                                        new_cell.borders = '1010';
                                        break;
                                    case 'tile-7':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'tile-8':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'tile-9':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'tile-10':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'tile-11':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'tile-12':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'tile-13':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'tile-14':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'tile-15':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'tile-0':
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                if (cell.classList.contains('doorlock-1')) {
                                    new_cell.door = 'item_lock';
                                } else if (cell.classList.contains('doorlock-2')) {
                                    new_cell.door = 'item_door';
                                } else if (cell.classList.contains('doorlock-3')) {
                                    new_cell.door = 'item_classicKey';
                                } else if (cell.classList.contains('doorlock-4')) {
                                    new_cell.door = 'item_bumpKey';
                                } else if (cell.classList.contains('doorlock-5')) {
                                    new_cell.door = 'item_magneticKey';
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
