import { fetchCitizenHomeRows } from '../api/citizens';
import {
    lang,
    mh_optimizer_icon,
    mh_optimizer_icon_16x16,
    mho_citizen_heroics_id,
    mho_citizen_heroics_tab_id,
    mho_citizen_homes_id,
    mho_citizen_homes_tab_id,
    mho_hidden_class,
    repo_img_hordes_url
} from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import type { CitizenHomeRow, HomeCell, HomeCellValue, HomeColumn, HomeColumnBlock, HomeSortKey, HomeUpdate, SortDirection } from '../utils/citizen-homes';
import { filterHomeRows, HOME_COLUMNS, homeCellText, isStale, passesHomeFilter, relativeUpdate, sortHomeRows } from '../utils/citizen-homes';
import { createCheckboxDropdown, createSingleFilterSelect } from '../utils/dom';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { pageIsCitizens } from '../utils/page';

const wait_key_homes_tab: string = 'citizen-homes-tab:main-content';

interface PanelInfo {
    panel: string;
    tab: string;
    /** Clé de `texts` */
    title: string;
    update: 'homeUpdate' | 'heroicUpdate';
}

/** Panneau et onglet de chaque bloc. */
const PANELS: Readonly<Record<HomeColumnBlock, PanelInfo>> = {
    home: { panel: mho_citizen_homes_id, tab: mho_citizen_homes_tab_id, title: 'homes_tab_title', update: 'homeUpdate' },
    heroic: { panel: mho_citizen_heroics_id, tab: mho_citizen_heroics_tab_id, title: 'heroics_tab_title', update: 'heroicUpdate' },
};

/** Libellé traduit d'une clé de `texts`. */
function label(key: string): string {
    return getI18N(texts[key as keyof typeof texts]) ?? key;
}

/** Texte « date · auteur » d'une mise à jour, ou `jamais`. */
function updateTitle(update: HomeUpdate | null): string {
    if (update === null) {
        return label('homes_never');
    }
    return `${update.updateTime.toLocaleString()} · ${update.userName}`;
}

/** Crée un élément avec classe et texte optionnels. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
    const node: HTMLElementTagNameMap[K] = document.createElement(tag);
    if (className !== undefined) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

/** Image du jeu, à sa taille native. */
function gameImg(path: string, alt: string): HTMLImageElement {
    const img: HTMLImageElement = el('img');
    img.src = repo_img_hordes_url + path;
    img.alt = alt;
    return img;
}

/** Classe de largeur d'une colonne de valeur : l'icône de l'habitation est plus large qu'un chiffre. */
function valueClass(col: HomeColumn): string {
    return col.key === 'houseLevel' ? 'mho-homes-value mho-homes-house' : 'mho-homes-value';
}

/** Cellule de valeur : coche du jeu, icône de l'habitation, niveau ou tiret si inconnue. */
function valueCell(col: HomeColumn, value: HomeCellValue | undefined): HTMLDivElement {
    const cell: HomeCell = homeCellText(col, value);
    const div: HTMLDivElement = el('div', `padded cell factor-0 citizen-box content-center-vertical ${valueClass(col)}`);
    if (cell.empty) {
        div.classList.add('mho-homes-empty');
        div.textContent = cell.text;
    } else if (col.kind === 'flag') {
        div.appendChild(gameImg(value === true ? 'icons/tickOn.gif' : 'icons/tickOff.gif', cell.text));
    } else if (col.key === 'houseLevel') {
        div.appendChild(gameImg(`home/home_lv${cell.text}.gif`, cell.text));
    } else {
        div.textContent = cell.text;
    }
    return div;
}

/** Ligne d'un citoyen pour les colonnes du bloc. */
function buildRow(row: CitizenHomeRow, columns: readonly HomeColumn[], block: HomeColumnBlock, now: Date, me: number | undefined): HTMLDivElement {
    const line: HTMLDivElement = el('div', 'row-flex stretch');
    const update: HomeUpdate | null = row[PANELS[block].update];
    // `citizen-box` : la mise à jour MHO relève les citoyens présents via `.citizen-box .username`.
    const name: HTMLDivElement = el('div', `padded cell factor-1 left small citizen-box content-center-vertical ${row.id === me ? 'citizen-box-name-me' : 'citizen-box-name'} mho-homes-name`, row.name);
    name.dataset['userId'] = String(row.id);
    name.dataset['name'] = row.name;
    line.appendChild(name);
    for (const col of columns) {
        const cell: HTMLDivElement = valueCell(col, row[block][col.key]);
        cell.title = updateTitle(update);
        line.appendChild(cell);
    }
    const last: HTMLDivElement = el('div', 'padded cell factor-0 small citizen-box content-center-vertical mho-homes-update', update === null ? '—' : relativeUpdate(update.updateTime, now, lang));
    last.classList.toggle('mho-homes-stale', isStale(update, now));
    last.title = updateTitle(update);
    line.appendChild(last);
    return line;
}

/** Remplace le libellé texte d'un champ de filtre par l'icône de sa colonne, le libellé passant en infobulle. */
function iconLabel(container: HTMLDivElement, col: HomeColumn): HTMLDivElement {
    const field_label: HTMLElement = container.querySelector('.mho-filter-label') as HTMLElement;
    field_label.title = label(col.label);
    field_label.replaceChildren(gameImg(col.icon, label(col.label)));
    return container;
}

/** Lit la valeur courante d'un filtre de colonne. */
type FilterReader = () => string | readonly string[];

/** Barre de filtres MHO (recherche par nom puis un filtre par colonne) ; `onChange` est appelé à chaque modification. */
function buildFilterBar(rows: readonly CitizenHomeRow[], columns: readonly HomeColumn[], block: HomeColumnBlock, onChange: () => void):
    { bar: HTMLDivElement; search: HTMLInputElement; readers: Map<string, FilterReader> } {
    const bar: HTMLDivElement = el('div', 'mho-filter-bar');
    const wrapper: HTMLDivElement = el('div', 'mho-search-wrapper');
    const search: HTMLInputElement = el('input', 'mho-input inline mho-search-input');
    search.type = 'text';
    search.placeholder = label('homes_search_name');
    search.addEventListener('input', onChange);
    const icon: HTMLImageElement = el('img', 'mho-search-icon');
    icon.src = mh_optimizer_icon;
    wrapper.append(search, icon);
    bar.appendChild(wrapper);

    const readers: Map<string, FilterReader> = new Map();
    for (const col of columns) {
        const id: string = `${PANELS[block].panel}-filter-${col.key}`;
        if (col.kind === 'flag') {
            const { container, select } = createSingleFilterSelect(label(col.label), id, [
                { value: 'all', text: label('filter_all') },
                { value: 'yes', text: label('homes_filter_yes') },
                { value: 'no', text: label('homes_filter_no') },
            ]);
            select.addEventListener('change', onChange);
            readers.set(col.key, (): string => select.value);
            bar.appendChild(iconLabel(container, col));
        } else {
            const levels: number[] = [...new Set(rows.map((r: CitizenHomeRow): HomeCellValue | undefined => r[block][col.key])
                .filter((v: HomeCellValue | undefined): v is number => typeof v === 'number'))].sort((a: number, b: number): number => a - b);
            const options: { value: string; text: string; icon?: string }[] = levels.map((level: number): { value: string; text: string; icon?: string } => ({
                value: String(level),
                text: String(level),
                icon: col.key === 'houseLevel' ? `${repo_img_hordes_url}home/home_lv${level}.gif` : undefined,
            }));
            const { container, getSelectedValues } = createCheckboxDropdown(label(col.label), id, options, onChange);
            readers.set(col.key, getSelectedValues);
            bar.appendChild(iconLabel(container, col));
        }
    }
    return { bar, search, readers };
}

/** Liste des citoyens d'un bloc au format de la liste du jeu, avec recherche et en-têtes triables (un clic trie, un second inverse). */
export function buildHomesTable(rows: readonly CitizenHomeRow[], now: Date, block: HomeColumnBlock, me?: number): HTMLElement {
    const columns: HomeColumn[] = HOME_COLUMNS.filter((c: HomeColumn): boolean => c.block === block);
    const root: HTMLElement = el('div');
    root.id = PANELS[block].panel;
    const table: HTMLDivElement = el('div', 'row-table mho-homes-list');
    const head: HTMLDivElement = el('div', 'row-flex header');
    table.appendChild(head);

    const lines: Map<number, HTMLDivElement> = new Map(rows.map((r: CitizenHomeRow): [number, HTMLDivElement] => [r.id, buildRow(r, columns, block, now, me)]));
    let sortKey: HomeSortKey = 'name';
    let direction: SortDirection = 'asc';
    const filters: { bar: HTMLDivElement; search: HTMLInputElement; readers: Map<string, FilterReader> } =
        buildFilterBar(rows, columns, block, (): void => refresh());
    root.append(filters.bar, table);

    /** Réordonne et filtre les lignes selon le tri, la recherche et les filtres courants. */
    const refresh = (): void => {
        const visible: Set<number> = new Set(filterHomeRows(rows, filters.search.value)
            .filter((r: CitizenHomeRow): boolean => columns.every((c: HomeColumn): boolean =>
                passesHomeFilter(c, r[block][c.key], (filters.readers.get(c.key) as FilterReader)())))
            .map((r: CitizenHomeRow): number => r.id));
        for (const r of sortHomeRows(rows, sortKey, direction)) {
            const line: HTMLDivElement = lines.get(r.id) as HTMLDivElement;
            line.classList.toggle(mho_hidden_class, !visible.has(r.id));
            table.appendChild(line);
        }
    };

    /** Ajoute un en-tête triable. */
    const addHeader = (key: HomeSortKey, className: string, content: string | HTMLImageElement, title: string): void => {
        const cell: HTMLDivElement = el('div', `padded cell ${className} mho-homes-sortable`);
        cell.append(content);
        cell.title = title;
        cell.dataset['key'] = key;
        cell.addEventListener('click', (): void => {
            direction = sortKey === key && direction === 'asc' ? 'desc' : 'asc';
            sortKey = key;
            refresh();
        });
        head.appendChild(cell);
    };
    addHeader('name', 'factor-1 left', label('homes_column_name'), label('homes_column_name'));
    columns.forEach((c: HomeColumn): void => addHeader(c.key, `factor-0 ${valueClass(c)}`, gameImg(c.icon, label(c.label)), label(c.label)));
    addHeader(PANELS[block].update, 'factor-0 small mho-homes-update', label('homes_column_update'), label('homes_column_update'));

    refresh();
    return root;
}

/**
 * Déplace la ligne d'identité du jeu (métier, rôles, nom cliquable portant l'infobulle du joueur, sans l'annonce) dans le panneau affiché ;
 * les cellules qu'il quitte, ou sans équivalent dans la liste du jeu, affichent le nom seul.
 */
function showGameNames(main_content: Element, panel: HTMLElement): void {
    const blocks: Map<string, Element> = new Map();
    main_content.querySelectorAll('.citizens-list .userCell > div > div:first-child, .mho-homes-name > *').forEach((block: Element): void => {
        const id: string | null | undefined = block.querySelector('.username[x-user-id]')?.getAttribute('x-user-id');
        if (id !== null && id !== undefined) {
            blocks.set(id, block);
        }
    });
    panel.querySelectorAll<HTMLElement>('.mho-homes-name').forEach((cell: HTMLElement): void => {
        const block: Element | undefined = blocks.get(cell.dataset['userId'] as string);
        if (block !== undefined) {
            cell.replaceChildren(block);
        }
    });
    main_content.querySelectorAll<HTMLElement>('.mho-homes-name').forEach((cell: HTMLElement): void => {
        if (cell.childElementCount === 0) {
            cell.textContent = cell.dataset['name'] as string;
        }
    });
}

/** Onglets de la page Citoyens activés par les options (parente puis sous-options). */
export function enabledCitizenTabs(params: Readonly<Record<string, unknown>>): HomeColumnBlock[] {
    if (params['citizen_tabs'] !== true) {
        return [];
    }
    return [
        ...(params['citizen_tab_homes'] === true ? ['home' as const] : []),
        ...(params['citizen_tab_heroics'] === true ? ['heroic' as const] : []),
    ];
}

/** Ajoute (une seule fois) les onglets demandés et leurs listes à la page Citoyens. */
export function graftHomesTab(main_content: Element, rows: readonly CitizenHomeRow[], now: Date, blocks: readonly HomeColumnBlock[], me?: number): void {
    const tabs: Element | null = main_content.querySelector('ul.tabs');
    if (tabs === null || main_content.querySelector(`#${mho_citizen_homes_tab_id}, #${mho_citizen_heroics_tab_id}`) !== null) {
        return;
    }
    for (const block of blocks) {
        const panel: HTMLElement = buildHomesTable(rows, now, block, me);
        panel.classList.add(mho_hidden_class);
        main_content.appendChild(panel);

        const tab: HTMLLIElement = el('li', 'tab');
        tab.id = PANELS[block].tab;
        const link: HTMLDivElement = el('div', 'tab-link');
        const logo: HTMLImageElement = el('img');
        logo.src = mh_optimizer_icon_16x16;
        logo.alt = '';
        link.append(logo, ` ${label(PANELS[block].title)}`);
        tab.appendChild(link);
        tabs.appendChild(tab);
        tab.addEventListener('click', (): void => {
            const children: Element[] = Array.from(main_content.children);
            const first: number = children.findIndex((child: Element): boolean => child.contains(tabs)) + 1;
            children.slice(first).forEach((child: Element): void => { child.classList.toggle(mho_hidden_class, child !== panel); });
            showGameNames(main_content, panel);
            tabs.querySelectorAll('.tab').forEach((t: Element): void => { t.classList.toggle('selected', t === tab); });
        });
    }
}

/** Sur la page Citoyens, greffe les onglets Maisons et Actions héroïques activés par les options. */
export function displayCitizenHomesTab(): void {
    const blocks: HomeColumnBlock[] = enabledCitizenTabs(state.mho_parameters);
    if (blocks.length === 0 || !pageIsCitizens()
        || document.getElementById(mho_citizen_homes_tab_id) !== null || document.getElementById(mho_citizen_heroics_tab_id) !== null) {
        cancelWaitForElement(wait_key_homes_tab);
        return;
    }
    waitForElement(wait_key_homes_tab, '.town-main-content', (main_content: Element): void => {
        fetchCitizenHomeRows()
            .then((rows: CitizenHomeRow[]): void => graftHomesTab(main_content, rows, new Date(), blocks, state.mh_user?.id))
            .catch((): void => { /* erreur déjà notifiée par le fetch */ });
    });
}
