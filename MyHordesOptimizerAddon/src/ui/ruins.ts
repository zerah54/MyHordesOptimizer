import {getRuins} from '../api/ruins';
import {mh_optimizer_window_id, repo_img_hordes_url} from '../config/constants';
import {table_ruins_headers} from '../data/informations';
import {getI18N} from '../utils/i18n';

export function displayRuins() {
    getRuins().then((ruins) => {
        if (ruins) {
            let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

            let header_cells = [...table_ruins_headers];

            let header_row = document.createElement('tr');
            header_row.classList.add('mho-header');
            header_cells.forEach((header_cell) => {
                let cell = document.createElement('th');
                cell.innerText = getI18N(header_cell.label);
                header_row.appendChild(cell);
            })

            let table = document.createElement('table');
            table.classList.add('mho-table');
            table.appendChild(header_row);
            tab_content.appendChild(table);
            ruins.forEach((ruin) => {
                let ruin_row = document.createElement('tr');
                table.appendChild(ruin_row);

                header_cells.forEach((header_cell) => {
                    let cell = document.createElement(header_cell.type);
                    let img = document.createElement('img');
                    switch (header_cell.id) {
                        case 'img':
                            img.src = `${repo_img_hordes_url}ruin/${ruin[header_cell.id]}.gif`;
                            cell.appendChild(img);
                            break;
                        case 'label':
                        case 'description':
                            cell.setAttribute('style', 'text-align: left');
                            cell.innerText = getI18N(ruin[header_cell.id]);
                            break;
                        case 'drops':
                            cell.setAttribute('style', 'text-align: left');
                            var item_divs = document.createElement('div');
                            item_divs.style.display = 'flex';
                            item_divs.style.flexWrap = 'wrap';
                            item_divs.style.justifyContent = 'space-around';
                            cell.appendChild(item_divs);
                            ruin[header_cell.id].forEach((item) => {
                                let item_div = document.createElement('div');
                                item_div.style.margin = '0 0.5em';
                                item_div.title = getI18N(item.item.label);

                                let item_img = document.createElement('img');
                                item_img.src = repo_img_hordes_url + item.item.img;
                                item_img.style.display = 'block';
                                item_img.style.margin = 'auto';
                                // let item_label = document.createElement('span');
                                // item_label.innerText = getI18N(item.item.label);
                                let item_proba = document.createElement('span');
                                item_proba.innerText = Math.round(item.probability * 1000) / 10 + '%';
                                item_proba.style.display = 'block';
                                item_proba.style.margin = 'auto';

                                item_div.appendChild(item_img);
                                // item_div.appendChild(item_label);
                                item_div.appendChild(item_proba);

                                item_divs.appendChild(item_div);
                            });
                            break;
                        case 'minDist':
                        case 'maxDist':
                            cell.setAttribute('style', 'text-align: center');
                            cell.innerText = ruin[header_cell.id] + 'km';
                            break;
                        case 'camping':
                            cell.setAttribute('style', 'text-align: center');
                            cell.innerText = ruin[header_cell.id] + '%';
                            break;
                        case 'capacity':
                            cell.setAttribute('style', 'text-align: center');
                            cell.innerText = ruin[header_cell.id];
                            break;
                        default:
                            break;
                    }
                    ruin_row.appendChild(cell);
                })
            });
        }
    });
}

/** Affiche la liste des recettes */
