import {mho_map_key} from '../config/constants';
import {getStorageItem} from '../utils/storage';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);

/** Récupère la carte de GH */
export function getGHMap() {
    return new Promise<any>((resolve, reject) => {
        let getArrow = (arrow) => {
            let arrow_sprite = arrow.firstChild.href.baseVal.replace(/^(.*)#/, '');
            switch (arrow_sprite) {
                case 'fleche_0':
                case 'fleche_0_b':
                case 'fleche_0_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_1':
                case 'fleche_1_b':
                case 'fleche_1_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_2':
                case 'fleche_2_b':
                case 'fleche_2_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_3':
                case 'fleche_3_b':
                case 'fleche_3_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_4':
                case 'fleche_4_b':
                case 'fleche_4_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_5':
                case 'fleche_5_b':
                case 'fleche_5_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_6':
                case 'fleche_6_b':
                case 'fleche_6_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_7':
                case 'fleche_7_b':
                case 'fleche_7_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_8':
                case 'fleche_8_b':
                case 'fleche_8_n':
                    return {direction: 'both', type: 'horizontal', source: '', length: 'semi', position: 'right'};
                case 'fleche_9':
                case 'fleche_9_b':
                case 'fleche_9_n':
                    return {direction: 'both', type: 'vertical', source: '', length: 'semi', position: 'top'};
                case 'fleche_10':
                case 'fleche_10_b':
                case 'fleche_10_n':
                    return {direction: 'both', type: 'horizontal', source: '', length: 'semi', position: 'left'};
                case 'fleche_11':
                case 'fleche_11_b':
                case 'fleche_11_n':
                    return {direction: 'both', type: 'vertical', source: '', length: 'semi', position: 'bottom'};
                case 'fleche_12':
                case 'fleche_12_b':
                case 'fleche_12_n':
                    return {direction: 'left', type: 'horizontal', source: '', length: 'plain', position: 'middle'};
                case 'fleche_13':
                case 'fleche_13_b':
                case 'fleche_13_n':
                    return {direction: 'bottom', type: 'vertical', source: '', length: 'plain', position: 'middle'};
                case 'fleche_14':
                case 'fleche_14_b':
                case 'fleche_14_n':
                    return {direction: 'right', type: 'horizontal', source: '', length: 'plain', position: 'middle'};
                case 'fleche_15':
                case 'fleche_15_b':
                case 'fleche_15_n':
                    return {direction: 'top', type: 'vertical', source: '', length: 'plain', position: 'middle'};
                case 'fleche_16':
                case 'fleche_16_b':
                case 'fleche_16_n':
                    return {direction: 'top', type: 'corner', source: 'right', length: '', position: ''};
                case 'fleche_17':
                case 'fleche_17_b':
                case 'fleche_17_n':
                    return {direction: 'bottom', type: 'corner', source: 'right', length: '', position: ''};
                case 'fleche_18':
                case 'fleche_18_b':
                case 'fleche_18_n':
                    return {direction: 'left', type: 'corner', source: 'top', length: '', position: ''};
                case 'fleche_19':
                case 'fleche_19_b':
                case 'fleche_19_n':
                    return {direction: 'right', type: 'corner', source: 'top', length: '', position: ''};
                case 'fleche_20':
                case 'fleche_20_b':
                case 'fleche_20_n':
                    return {direction: 'top', type: 'corner', source: 'left', length: '', position: ''};
                case 'fleche_21':
                case 'fleche_21_b':
                case 'fleche_21_n':
                    return {direction: 'bottom', type: 'corner', source: 'left', length: '', position: ''};
                case 'fleche_22':
                case 'fleche_22_b':
                case 'fleche_22_n':
                    return {direction: 'right', type: 'corner', source: 'bottom', length: '', position: ''};
                case 'fleche_23':
                case 'fleche_23_b':
                case 'fleche_23_n':
                    return {direction: 'left', type: 'corner', source: 'bottom', length: '', position: ''};
                case 'fleche_24':
                case 'fleche_24_b':
                case 'fleche_24_n':
                    return {direction: 'none', type: 'point', source: 'middle', length: 'none', position: 'middle'};
            }
        }
        getStorageItem(mho_map_key).then((mho_map) => {
            let map_html = document.createElement('div');
            map_html.innerHTML = mho_map.block;

            let new_map = [];
            let map = arrFrom(map_html.querySelectorAll('.ligneCarte'));
            let x_mapping = arrFrom(map[0].children).map((x) => x.innerText);
            map
                .filter((row) => arrFrom(row.children).some((cell) => cell.classList.contains('caseCarte')))
                .forEach((row) => {
                    let cells = [];
                    let y;
                    arrFrom(row.children).forEach((cell, index) => {
                        if (cell.classList.contains('fondNoir')) {
                            y = cell.innerText;
                        } else {
                            let cell_parts = arrFrom(cell.children);

                            let new_cell: any = {
                                horizontal: y,
                                vertical: x_mapping[index],
                                town: cell.querySelector('.caseVille'),
                                bat: cell.querySelector('.bat'),
                                my_pos: cell.querySelector('.posJoueur'),
                                expedition_here: cell_parts.some((cell_part) => cell_part.classList.contains('expeditionVille') && cell_part.children.length > 0 /*&& arrFrom(cell_part.children).some((expedition_arrow) => expedition_arrow.classList.contains('selected_expe'))*/),
                                expedition_arrows: [],/*arrFrom(cell_parts.find((cell_part) => cell_part.classList.contains('expeditionVille')).children).map((arrow) => getArrow(arrow)), */
                                not_yet_visited: cell.querySelector('.zone-NonExplo'),
                                not_visited_today: !cell.querySelector('.danger') && !cell.querySelector('.caseVille'),
                                zombies: cell.querySelector('.danger') ? arrFrom(cell.querySelector('.danger').classList).filter((class_name) => class_name.startsWith('zone-danger')).map((class_name) => class_name.replace('zone-danger', ''))[0] : undefined,
                                empty: cell.querySelector('.epuise'),
                                empty_bat: cell.querySelector('.bat') && cell.querySelector('.bat').firstChild.href.baseVal.replace(/^(.*)#/, '') === 'bat-e',
                                ruin: cell.querySelector('.bat') && cell.querySelector('.bat').firstChild.href.baseVal.replace(/^(.*)#/, '') === 'bat-r',
                            };
                            cells.push(new_cell);
                        }
                    });
                    new_map.push(cells);
                });
            resolve({map: new_map, vertical_mapping: x_mapping});
        });
    });
}


/** Récupère la carte de Gest'Hordes */
export function getGHRuin() {
    return new Promise<any>((resolve, reject) => {
        getStorageItem(mho_map_key).then((mho_map) => {
            if (mho_map.ruin) {
                let map_html = document.createElement('div');
                map_html.innerHTML = mho_map.ruin;

                let new_map = [];
                let rows = arrFrom(map_html.querySelector('#carteRuine')?.querySelector('tbody')?.children);
                let x_mapping = arrFrom(rows[0].children).map((x) => x.innerText);
                rows
                    .filter((row) => arrFrom(row.children).some((cell) => cell.classList.contains('caseCarteRuine')))
                    .forEach((row, row_index, rows_array) => {
                        let new_cells = [];
                        let cells = arrFrom(row.children);
                        let y;
                        cells.forEach((cell, cell_index, cell_array) => {
                            if (cell.classList.contains('bordCarteRuine')) {
                                y = cell.innerText;
                            } else {

                                let cell_parts = arrFrom(cell.children);
                                let new_cell: any = {
                                    horizontal: y,
                                    vertical: x_mapping[cell_index],
                                    borders: '0000',
                                    zombies: cell.firstElementChild.getAttribute('data-z')
                                };

                                let img_path = cell.querySelector('.ruineCarte')?.firstElementChild.href.baseVal.replace(/^(.*)#/, '');
                                switch (img_path) {
                                    case 'ruineCarte_16':
                                        new_cell.borders = 'exit';
                                        break;
                                    case 'ruineCarte_15':
                                        new_cell.borders = '1111';
                                        break;
                                    case 'ruineCarte_7':
                                        new_cell.borders = '1110';
                                        break;
                                    case 'ruineCarte_11':
                                        new_cell.borders = '1101';
                                        break;
                                    case 'ruineCarte_3':
                                        new_cell.borders = '1100';
                                        break;
                                    case 'ruineCarte_13':
                                        new_cell.borders = '1011';
                                        break;
                                    case 'ruineCarte_5':
                                        new_cell.borders = '1010'; // ?
                                        break;
                                    case 'ruineCarte_18':
                                        new_cell.borders = '1010'; // ?
                                        break;
                                    case 'ruineCarte_9':
                                        new_cell.borders = '1001';
                                        break;
                                    case 'ruineCarte_1':
                                        new_cell.borders = '1000';
                                        break;
                                    case 'ruineCarte_14':
                                        new_cell.borders = '0111';
                                        break;
                                    case 'ruineCarte_6':
                                        new_cell.borders = '0110';
                                        break;
                                    case 'ruineCarte_10':
                                        new_cell.borders = '0101';
                                        break;
                                    case 'ruineCarte_2':
                                        new_cell.borders = '0100';
                                        break;
                                    case 'ruineCarte_12':
                                        new_cell.borders = '0011';
                                        break;
                                    case 'ruineCarte_4':
                                        new_cell.borders = '0010';
                                        break;
                                    case 'ruineCarte_8':
                                        new_cell.borders = '0001';
                                        break;
                                    default:
                                        new_cell.borders = '0000';
                                        break;
                                }

                                console.log('cell.firstElementChild', cell.firstElementChild);
                                switch (cell.firstElementChild.getAttribute('data-porte')) {
                                    case 'pC':
                                        new_cell.door = 'item_lock';
                                        break;
                                    case 'p':
                                        new_cell.door = 'item_door';
                                        break;
                                    case 'pD':
                                        new_cell.door = 'item_classicKey';
                                        break;
                                    case 'pP':
                                        new_cell.door = 'item_bumpKey';
                                        break;
                                    case 'pM':
                                        new_cell.door = 'item_magneticKey';
                                        break;
                                    default:
                                        break;
                                }
                                new_cells.push(new_cell);
                            }
                        });
                        new_map.push(new_cells);
                    });
                resolve({map: new_map, vertical_mapping: x_mapping});
            }
        })
    });
}

