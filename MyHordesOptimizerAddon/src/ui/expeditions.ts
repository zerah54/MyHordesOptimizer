import { getCitizens } from '../api/citizens';
import { getMyExpeditions } from '../api/expeditions';
import { lang, mh_optimizer_icon, mho_display_expeditions_id, mho_expeditions_window_id, mho_header_space_id, repo_img_hordes_url } from '../config/constants';
import { state } from '../state';
import { createWindow } from './window';

export function createExpeditionsBtn() {
    const expeditions_btn = document.getElementById(mho_display_expeditions_id);
    if (state.mho_parameters.display_my_expeditions) {
        createWindow(mho_expeditions_window_id, false);

        const mho_header_space = document.getElementById(mho_header_space_id);
        if (expeditions_btn || !mho_header_space) return;

        const btn_container = document.createElement('div');
        btn_container.id = mho_display_expeditions_id;

        const postbox_img = document.querySelector('#postbox img');

        const btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_mho_img);

        const btn_img = document.createElement('img');
        btn_img.src = repo_img_hordes_url + '/icons/planner.gif';
        btn_img.style.height = postbox_img && postbox_img.height ? postbox_img.height + 'px' : '16px';
        btn_container.appendChild(btn_img);
        mho_header_space.appendChild(btn_container);

        btn_container.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            document.getElementById(mho_expeditions_window_id).classList.add('visible');
            createExpeditionsWindowContent();
        });

    } else if (expeditions_btn) {
        expeditions_btn.remove();
    }
}


export function createExpeditionsWindowContent() {
    const get_my_expeditions_promise = getMyExpeditions();
    const get_citizens_promize = getCitizens();

    Promise.all([get_my_expeditions_promise, get_citizens_promize]).then(([expeditions, citizens]) => {
        const window_content = document.querySelector(`#${mho_expeditions_window_id}-content`);
        window_content.innerHTML = '';

        const tabs_ul = document.createElement('ul');

        expeditions.forEach((expedition, index) => {
            const tab_link = document.createElement('div');

            const tab_text = document.createTextNode(expedition.label || ' ');
            tab_link.appendChild(tab_text);

            const tab_li = document.createElement('li');
            tab_li.appendChild(tab_link);

            if (index === 0) {
                tab_li.classList.add('selected');
                dispatchExpeditionContent(expedition, citizens.citizens);
            }

            const tab_content = document.getElementById(mho_expeditions_window_id + '-tab-content');
            tab_li.addEventListener('click', () => {
                if (!tab_li.classList.contains('selected') && tab_content !== undefined && tab_content !== null) {
                    for (const li of tabs_ul.children) {
                        li.classList.remove('selected');
                    }
                    tab_li.classList.add('selected');
                }

                dispatchExpeditionContent(expedition, citizens.citizens);
            });

            tabs_ul.appendChild(tab_li);
        });

        const tabs_div = document.createElement('div');
        tabs_div.id = 'tabs';
        tabs_div.appendChild(tabs_ul);

        window_content.appendChild(tabs_div);
    });
}


export function dispatchExpeditionContent(expedition, citizens) {
    const window_content = document.getElementById(mho_expeditions_window_id + '-content');

    let tab_content = document.getElementById(mho_expeditions_window_id + '-tab-content');
    if (tab_content) {
        tab_content.remove();
    }
    tab_content = document.createElement('div');
    tab_content.id = mho_expeditions_window_id + '-tab-content';
    tab_content.classList.add('tab-content');

    window_content.appendChild(tab_content);

    expedition.parts.forEach((part, index) => {
        const part_content = document.createElement('div');
        tab_content.appendChild(part_content);

        if (part.label) {
            const part_content_header = document.createElement('h2');
            part_content_header.innerText = part.label;
            part_content.appendChild(part_content_header);
        }

        const part_content_path = document.createElement('h5');
        part_content_path.innerText = part.path;
        part_content.appendChild(part_content_path);

        switch (part.direction) {
            case 'Süden':
                part_content_path.innerText += ' ⇩';
                break;
            case 'Westen':
                part_content_path.innerText += ' ⇦';
                break;
            case 'Osten':
                part_content_path.innerText += ' ⇨';
                break;
            case 'Norden':
                part_content_path.innerText += ' ⇧';
                break;
            default:
                break;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.classList.add('mho-table');
        part_content.appendChild(table);

        const header = document.createElement('thead');
        table.appendChild(header);

        const header_row = document.createElement('tr');
        header_row.classList.add('mho-header');
        header.appendChild(header_row);

        const header_cells = [
            {
                id: 'citizen',
                label: {
                    de: 'Bürger',
                    en: 'Citizen',
                    es: 'Habitante',
                    fr: 'Citoyens'
                }
            },
            {
                id: 'isThirsty',
                label: {
                    de: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                    en: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                    es: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`,
                    fr: `<img src="${repo_img_hordes_url}/status/status_thirst1.gif">`
                }
            },
            {
                id: 'starts7ap',
                label: {
                    de: `7<img src="${repo_img_hordes_url}/icons/ap_small.gif">`,
                    en: `7<img src="${repo_img_hordes_url}/icons/ap_small_en.gif">`,
                    es: `7<img src="${repo_img_hordes_url}/icons/ap_small_es.gif">`,
                    fr: `7<img src="${repo_img_hordes_url}/icons/ap_small_fr.gif">`
                }
            },
            {
                id: 'orders',
                label: {
                    de: 'Anweisungen',
                    en: 'Instructions',
                    es: 'Instrucciones',
                    fr: 'Consignes'
                }
            },
            {
                id: 'bag',
                label: {
                    de: 'Rucksack',
                    en: 'Backpack',
                    es: 'Mochila',
                    fr: 'Sac'
                }
            }
        ];
        header_cells.forEach((header_cell) => {
            const header_cell_html = document.createElement('th');
            header_cell_html.innerHTML = header_cell.label[lang];
            header_row.appendChild(header_cell_html);
        });

        const body = document.createElement('tbody');
        table.appendChild(body);

        part.citizens.forEach((citizen_part) => {
            const citizen_row = document.createElement('tr');
            body.appendChild(citizen_row);

            header_cells.forEach((header_cell) => {
                const cell = document.createElement('td');
                switch (header_cell.id) {
                    case 'citizen':
                        cell.innerText = citizens.find((citizen) => citizen.id === citizen_part.idUser)?.name ?? '';
                        break;
                    case 'isThirsty':
                        cell.innerHTML = citizen_part.isThirsty ? `<img src="${repo_img_hordes_url}status/status_thirst1.gif">` : '';
                        cell.style.textAlign = 'center';
                        break;
                    case 'starts7ap':
                        cell.innerHTML = citizen_part.nombrePaDepart === 7 ? '✓' : (citizen_part.nombrePaDepart === 6 ? '𐄂' : '');
                        cell.style.textAlign = 'center';
                        break;
                    case 'orders':
                        citizen_part.orders.forEach((order) => {
                            const order_html = document.createElement('div');
                            order_html.innerHTML = order.text;
                            cell.appendChild(order_html);
                        });
                        break;
                    case 'bag':
                        citizen_part.bag?.items?.forEach((item) => {
                            const bag_item = document.createElement('span');
                            bag_item.innerHTML = `<img src="${repo_img_hordes_url}${item.item.img}">`;
                            cell.appendChild(bag_item);
                        });
                        break;
                    default:
                        break;
                }
                citizen_row.appendChild(cell);
            });
        });

        const part_orders = document.createElement('div');
        part_orders.style.width = '100%';
        part.orders.forEach((order) => {
            const order_html = document.createElement('div');
            order_html.innerHTML = order.text;
            part_orders.appendChild(order_html);
        });
        part_content.appendChild(part_orders);

        if (index < expedition.parts.length - 1) {
            const separator = document.createElement('hr');
            tab_content.appendChild(separator);
        }
    });
}

/** Permet de bloquer / débloquer des utilisateurs et de masquer les posts des utilisateurs bloqués */
