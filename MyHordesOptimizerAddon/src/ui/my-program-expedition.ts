import { lang, repo_img_hordes_url } from '../config/constants';
import { expedition_texts } from '../i18n/texts';
import type { ApiCitizen, ApiExpedition, ApiExpeditionBagItem, ApiExpeditionCitizen, ApiExpeditionPart, ApiMapPoint, I18nLabel } from '../types';
import { requirementCells } from '../utils/expedition-requirements';
import { type GridPoint, type PassageOrders, type RouteCellOrders, routeCellOrders, samePoint, toRelative } from '../utils/expedition-route';
import { getI18N } from '../utils/i18n';
import { programText } from '../utils/my-program';
import { appendPassageGroups, createRouteLine } from './cell-orders';
import { formatCell } from './expedition-route';

/** Onglet « Expédition » de la fenêtre « Mon programme ». */

/** Colonne du tableau de préparation (sans les consignes, affichées case par case) */
interface HeaderCell {
    readonly id: 'citizen' | 'isThirsty' | 'starts7ap' | 'sp' | 'shoes' | 'bag';
    readonly label: I18nLabel;
}

const header_cells: readonly HeaderCell[] = [
    { id: 'citizen', label: { de: 'Bürger', en: 'Citizen', es: 'Habitante', fr: 'Citoyens' } },
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
            de: `<img src="${repo_img_hordes_url}/icons/ap_small.gif">`,
            en: `<img src="${repo_img_hordes_url}/icons/ap_small_en.gif">`,
            es: `<img src="${repo_img_hordes_url}/icons/ap_small_es.gif">`,
            fr: `<img src="${repo_img_hordes_url}/icons/ap_small_fr.gif">`
        }
    },
    {
        id: 'sp',
        label: {
            de: `<img src="${repo_img_hordes_url}icons/sp_small.gif">`,
            en: `<img src="${repo_img_hordes_url}icons/sp_small_en.gif">`,
            es: `<img src="${repo_img_hordes_url}icons/sp_small_es.gif">`,
            fr: `<img src="${repo_img_hordes_url}icons/sp_small_fr.gif">`
        }
    },
    {
        id: 'shoes',
        label: {
            de: `<img src="${repo_img_hordes_url}item/item_shoe.gif" title="Ausgetretene Sportschuhe">`,
            en: `<img src="${repo_img_hordes_url}item/item_shoe.gif" title="Worn-out sports shoes">`,
            es: `<img src="${repo_img_hordes_url}item/item_shoe.gif" title="Zapatillas deportivas desgastadas">`,
            fr: `<img src="${repo_img_hordes_url}item/item_shoe.gif" title="Chaussures de sport usées">`
        }
    },
    { id: 'bag', label: { de: 'Rucksack', en: 'Backpack', es: 'Mochila', fr: 'Sac' } }
];

/** Flèche de la direction d'une partie (valeurs allemandes de l'API) */
const direction_arrows: Readonly<Record<string, string>> = { Süden: '⇩', Westen: '⇦', Osten: '⇨', Norden: '⇧' };

/** Vrai si je suis inscrit sur au moins une partie de l'expédition. */
function isMember(expedition: ApiExpedition, user_id: number): boolean {
    return (expedition.parts ?? []).some((part: ApiExpeditionPart): boolean => (part.citizens ?? []).some((citizen: ApiExpeditionCitizen): boolean => citizen.idUser === user_id));
}

/** Tableau de préparation d'une partie : citoyen, soif, PA de départ, PE, chaussures, sac. */
function createPartTable(part: ApiExpeditionPart, citizens: readonly ApiCitizen[]): HTMLTableElement {
    const table: HTMLTableElement = document.createElement('table');
    table.style.width = '100%';
    table.classList.add('mho-table');
    const header: HTMLTableSectionElement = table.createTHead();
    const header_row: HTMLTableRowElement = document.createElement('tr');
    header_row.classList.add('mho-header');
    header.appendChild(header_row);
    header_cells.forEach((header_cell: HeaderCell): void => {
        const th: HTMLTableCellElement = document.createElement('th');
        th.innerHTML = header_cell.label[lang];
        header_row.appendChild(th);
    });
    const body: HTMLTableSectionElement = table.createTBody();
    (part.citizens ?? []).forEach((citizen_part: ApiExpeditionCitizen): void => {
        const row: HTMLTableRowElement = body.insertRow();
        const requirements: { sp: string; shoes: string } = requirementCells(citizen_part);
        header_cells.forEach((header_cell: HeaderCell): void => {
            const cell: HTMLTableCellElement = row.insertCell();
            switch (header_cell.id) {
                case 'citizen':
                    cell.textContent = citizens.find((citizen: ApiCitizen): boolean => citizen.id === citizen_part.idUser)?.name ?? '';
                    break;
                case 'isThirsty':
                    cell.innerHTML = citizen_part.isThirsty ? `<img src="${repo_img_hordes_url}status/status_thirst1.gif">` : '';
                    cell.style.textAlign = 'center';
                    break;
                case 'starts7ap':
                    cell.textContent = `${citizen_part.nombrePaDepart ?? ''}`;
                    cell.style.textAlign = 'center';
                    break;
                case 'sp':
                    cell.textContent = requirements.sp;
                    cell.style.textAlign = 'center';
                    break;
                case 'shoes':
                    cell.textContent = requirements.shoes;
                    cell.style.textAlign = 'center';
                    break;
                case 'bag':
                    citizen_part.bag?.items?.forEach((item: ApiExpeditionBagItem): void => {
                        const bag_item: HTMLSpanElement = document.createElement('span');
                        bag_item.innerHTML = `<img src="${repo_img_hordes_url}${item.item.img}">`;
                        cell.appendChild(bag_item);
                    });
                    break;
            }
        });
    });
    return table;
}

/** Libellé d'une case du tracé ou hors tracé, suivi de ses PA depuis la ville si le tracé ne la traverse qu'une fois (sinon ils sont sur chaque passage). */
function cellLabel(entry: RouteCellOrders, cells: readonly GridPoint[]): string {
    const point: GridPoint | null = entry.point;
    if (point === null) return programText('no_cell');
    const index: number = cells.findIndex((cell: GridPoint): boolean => samePoint(cell, point));
    const single_passage: boolean = entry.groups.every((group: PassageOrders): boolean => group.passage === null);
    return index >= 0 && single_passage ? `${formatCell(point)} · ${index}${getI18N(expedition_texts.ap_short) ?? ''}` : formatCell(point);
}

/** Contenu d'une partie : titre, tableau, tracé puis toutes ses consignes case par case. */
function createPart(part: ApiExpeditionPart, citizens: readonly ApiCitizen[], user_id: number, town: GridPoint | null, names: ReadonlyMap<number, string>): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    if (part.label) {
        const title: HTMLHeadingElement = document.createElement('h2');
        title.textContent = part.label;
        container.appendChild(title);
    }
    const route_line: HTMLDivElement | null = createRouteLine(part);
    const arrow: string = direction_arrows[part.direction ?? ''] ?? '';
    if (route_line) {
        if (arrow) route_line.appendChild(document.createTextNode(` ${arrow}`));
        container.appendChild(route_line);
    } else if (part.path) {
        const path_line: HTMLDivElement = document.createElement('div');
        path_line.classList.add('mho-expedition-route-name');
        path_line.textContent = `${part.path}${arrow ? ` ${arrow}` : ''}`;
        container.appendChild(path_line);
    }
    container.appendChild(createPartTable(part, citizens));
    if (!town) return container;

    const cells: GridPoint[] = (part.mapRoute?.cells ?? []).map((point: ApiMapPoint): GridPoint => toRelative(point, town));
    routeCellOrders(part, town, cells).forEach((entry: RouteCellOrders): void => {
        const label: HTMLDivElement = document.createElement('div');
        label.classList.add('mho-program-expedition-cell');
        label.textContent = cellLabel(entry, cells);
        container.appendChild(label);
        appendPassageGroups(container, entry.groups, user_id, names);
    });
    return container;
}

/**
 * Onglet Expédition : liste (si plusieurs) des expéditions où je suis inscrit, puis les parties de celle choisie.
 * @param {number | null} initial_expedition_id Expédition à ouvrir si elle est encore dans la liste, sinon la première.
 * @param {(id: number) => void} on_expedition_change Appelé avec l'id de l'expédition choisie dans la liste.
 */
export function createExpeditionTab(expeditions: readonly ApiExpedition[], citizens: readonly ApiCitizen[], user_id: number, town: GridPoint | null, initial_expedition_id: number | null = null, on_expedition_change?: (id: number) => void): HTMLElement {
    const root: HTMLDivElement = document.createElement('div');
    const mine: ApiExpedition[] = expeditions.filter((expedition: ApiExpedition): boolean => isMember(expedition, user_id));
    if (mine.length === 0) {
        const empty: HTMLParagraphElement = document.createElement('p');
        empty.textContent = programText('not_registered');
        root.appendChild(empty);
        return root;
    }
    const names: Map<number, string> = new Map<number, string>(citizens
        .filter((citizen: ApiCitizen): boolean => typeof citizen?.id === 'number')
        .map((citizen: ApiCitizen): [number, string] => [citizen.id, citizen.name ?? '']));
    const content: HTMLDivElement = document.createElement('div');
    /** Rend les parties de l'expédition d'indice `index` sous la liste. */
    const render = (index: number): void => {
        content.replaceChildren();
        const parts: ApiExpeditionPart[] = mine[index].parts ?? [];
        parts.forEach((part: ApiExpeditionPart, part_index: number): void => {
            content.appendChild(createPart(part, citizens, user_id, town, names));
            if (part_index < parts.length - 1) content.appendChild(document.createElement('hr'));
        });
    };
    const initial_index: number = Math.max(0, mine.findIndex((expedition: ApiExpedition): boolean => initial_expedition_id !== null && expedition.id === initial_expedition_id));
    if (mine.length > 1) {
        const select: HTMLSelectElement = document.createElement('select');
        select.classList.add('mho-program-expedition-choice');
        mine.forEach((expedition: ApiExpedition, index: number): void => {
            select.add(new Option(expedition.label || (getI18N(expedition_texts.my_expedition_title) ?? ''), String(index)));
        });
        select.value = String(initial_index);
        select.addEventListener('change', (): void => {
            const index: number = Number(select.value);
            render(index);
            const id: number | null | undefined = mine[index].id;
            if (typeof id === 'number') on_expedition_change?.(id);
        });
        root.appendChild(select);
    }
    root.appendChild(content);
    render(initial_index);
    return root;
}
