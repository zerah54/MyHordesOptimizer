import { mh_content_id } from '../config/constants';
import { jobs, texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { dumpItemsTableElement, pageIsCitizens, pageIsDump, pageIsNightwatch, pageIsOmniscience, pageIsTrap, trapItemsTableElement } from '../utils/page';

// TypeScript's arrFrom(any) can infer element type as 'unknown' rather
// than 'any' when the source isn't a statically-typed iterable.
const arrFrom = (x: any): any[] => Array.from(x);

////////////////////////
// TRI SUR LES LISTES //
////////////////////////
/**
 * Critère de tri : la valeur extraite d'une ligne et la façon de comparer deux valeurs.
 * `cell_index` permet de rattacher plusieurs critères à une même cellule d'en-tête, et
 * `label` transforme le critère en étiquette cliquable au lieu de rendre la cellule entière cliquable.
 */
export interface SortableColumn<T> {
    cell_index?: number;
    label?: string;
    extract: (row: HTMLElement) => T;
    compare: (a: T, b: T) => number;
}

/**
 * Options d'adaptation du moteur de tri aux tableaux qui ne suivent pas la structure
 * de la liste des citoyens.
 */
export interface SortableTableOptions {
    /** Sélecteur de la ligne d'en-tête portant les cellules cliquables */
    header_selector?: string;
    /** Lignes à maintenir en bas du tableau après réordonnancement (totaux) */
    footer_selector?: string;
    /** Classe du jeu à poser sur les cellules d'en-tête qui reçoivent un critère (ex: 'center') */
    header_cell_class?: string;
}

export function mhoInitSortableTable(table, columns, rowSelector, options: SortableTableOptions = {}) {
    if (!table || table.dataset.sortEnabled) return;
    table.dataset.sortEnabled = 'true';

    const header_selector: string = options.header_selector ?? '.row-flex.header';
    const footer_selector: string | undefined = options.footer_selector;

    arrFrom(table.querySelectorAll(rowSelector))
        .forEach((row, i) => {
            row.dataset.origIdx = i;
        });

    const header = table.querySelector(header_selector);
    if (!header) return;

    const cells = arrFrom(header.children).filter((el) => el.classList.contains('cell'));
    let activeCol = -1;
    let direction = 0;

    /** Remet en bas les lignes de total, que le réordonnancement fait forcément remonter */
    const moveFooterRowsToEnd = (): void => {
        if (!footer_selector) return;
        arrFrom(table.querySelectorAll(footer_selector)).forEach((footer_row) => table.appendChild(footer_row));
    };

    const doSort = (colIndex, dir) => {
        const rows = arrFrom(table.querySelectorAll(rowSelector));
        if (dir === 0) {
            rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
        } else {
            const { extract, compare } = columns[colIndex];
            rows.sort((a, b) => dir * compare(extract(a), extract(b)));
        }
        rows.forEach((row) => table.appendChild(row));
        moveFooterRowsToEnd();
    };

    const arrows = columns.map((column, colIdx) => {
        /** Plusieurs critères peuvent viser la même cellule d'en-tête (métier et pseudo, par exemple) */
        const cell = cells[column.cell_index ?? colIdx];
        if (!cell) return undefined;

        cell.querySelector('.help-button')
            ?.addEventListener('click', (e) => e.stopPropagation());

        /**
         * Les cellules d'en-tête que l'on garnit peuvent avoir besoin d'une classe de mise en
         * forme du jeu. On mémorise l'ajout pour ne retirer au nettoyage que ce que l'on a posé.
         */
        if (options.header_cell_class && !cell.classList.contains(options.header_cell_class)) {
            cell.classList.add(options.header_cell_class);
            cell.dataset.mhoHeaderClass = options.header_cell_class;
        }

        const arrow = document.createElement('span');
        arrow.className = 'mho-sort-arrow';
        arrow.textContent = ' ⇅';

        /**
         * Sans libellé, la cellule entière reste la zone de clic, comme sur la liste des
         * citoyens. Avec libellé, chaque critère reçoit sa propre étiquette cliquable :
         * c'est la seule façon d'en loger plusieurs dans une même cellule sans ambiguïté.
         */
        let trigger;
        if (column.label) {
            const control = document.createElement('span');
            control.className = 'mho-sort-control';
            control.textContent = column.label;
            control.appendChild(arrow);
            cell.appendChild(control);
            trigger = control;
        } else {
            cell.classList.add('mho-sortable-cell');
            cell.appendChild(arrow);
            trigger = cell;
        }

        trigger.addEventListener('click', () => {
            if (activeCol !== colIdx) {
                activeCol = colIdx;
                direction = 1;
            } else {
                if (direction === 1) direction = -1;
                else if (direction === -1) {
                    direction = 0;
                    activeCol = -1;
                } else {
                    direction = 1;
                    activeCol = colIdx;
                }
            }

            arrows.forEach((a, j) => {
                /** Une colonne dont la cellule d'en-tête est absente n'a pas de flèche */
                if (!a) return;
                const on = (j === activeCol && direction !== 0);
                a.textContent = on ? (direction === 1 ? ' ↑' : ' ↓') : ' ⇅';
                a.style.opacity = on ? '1' : '0.4';
            });

            doSort(activeCol < 0 ? 0 : activeCol, direction);
        });

        return arrow;
    });
}


export function mhoCleanupSortableTable(table, rowSelector, options: SortableTableOptions = {}) {
    if (!table?.dataset.sortEnabled) return;

    const header_selector: string = options.header_selector ?? '.row-flex.header';

    /** Les étiquettes cliquables contiennent leur propre flèche : elles partent en premier */
    table.querySelectorAll('.mho-sort-control').forEach((control) => control.remove());
    table.querySelectorAll('.mho-sort-arrow').forEach(a => a.remove());

    const header = table.querySelector(header_selector);
    if (header) {
        arrFrom(header.children)
            .filter((el) => el.classList.contains('cell'))
            .forEach((cell) => {
                cell.classList.remove('mho-sortable-cell');
                /** Ne retirer que la classe que l'on a effectivement ajoutée */
                if (cell.dataset.mhoHeaderClass) {
                    cell.classList.remove(cell.dataset.mhoHeaderClass);
                    delete cell.dataset.mhoHeaderClass;
                }
            });
    }

    const rows = arrFrom(table.querySelectorAll(rowSelector));
    rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
    rows.forEach((row) => {
        table.appendChild(row);
        delete row.dataset.origIdx;
    });

    if (options.footer_selector) {
        arrFrom(table.querySelectorAll(options.footer_selector)).forEach((footer_row) => table.appendChild(footer_row));
    }

    delete table.dataset.sortEnabled;
}


export function sortCitizenList() {

    const COLUMNS = [
        { // Citoyens : tri alphabétique
            extract: row => (row.querySelector('.username')?.textContent ?? '').trim().toLowerCase(),
            compare: (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Déf. : tri numérique
            extract: row => {
                const m = (row.querySelector('.citizen-defense')?.textContent ?? '').match(/(\d+)/);
                return m ? parseInt(m[1], 10) : 0;
            },
            compare: (a, b) => a - b,
        },
        { // Dehors ? — ↑ : en ville d'abord, puis plus proche → plus loin
            extract: row => {
                const text = (row.querySelector('.location')?.textContent ?? '').trim();
                const m = text.match(/\[(-?\d+),(-?\d+)\]/);
                if (!m) return { inTown: true, dist: 0 };
                const x = parseInt(m[1], 10), y = parseInt(m[2], 10);
                return { inTown: false, dist: Math.abs(x) + Math.abs(y) };
            },
            compare: (a, b) => {
                if (a.inTown && b.inTown) return 0;
                if (a.inTown) return -1;
                if (b.inTown) return 1;
                return a.dist - b.dist;
            },
        },
    ];

    const table = [...document.querySelectorAll('.row-table.citizens-list')]
        .find((t) => t.querySelectorAll('.row-flex.header .cell').length === 3);

    if (state.mho_parameters.sort_citizen_list && pageIsCitizens()) {
        mhoInitSortableTable(table, COLUMNS, '.row-flex.stretch.pointer');
    } else if (!state.mho_parameters.sort_citizen_list && pageIsCitizens()) {
        mhoCleanupSortableTable(table, '.row-flex.stretch.pointer');
    }
}


export function sortOmniscienceList() {

    const COLUMNS = [
        { // Citoyens : tri alphabétique
            extract: row => (row.querySelector('.username')?.textContent ?? '').trim().toLowerCase(),
            compare: (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Coffre : nombre d'objets dans l'inventaire
            extract: row => row.querySelectorAll('li.item').length,
            compare: (a, b) => a - b,
        },
        { // Âme : points (ex: "18 754 pts" ou "18754 pts")
            extract: row => {
                const cell = [...row.querySelectorAll('.citizen-box')]
                    .find((c) => c.textContent.includes('pts'));
                const m = cell?.textContent.replace(/\s+/g, '').match(/(\d+)pts/);
                return m ? parseInt(m[1], 10) : 0;
            },
            compare: (a, b) => a - b,
        },
        { // Activité : nombre d'étoiles
            extract: row => row.querySelectorAll('img[alt="*"]').length,
            compare: (a, b) => a - b,
        },
    ];

    const table = [...document.querySelectorAll('.row-table.citizens-list')]
        .find((t) => t.querySelectorAll('.row-flex.header .cell').length === 4);

    if (state.mho_parameters.sort_omniscience_list && pageIsOmniscience()) {
        mhoInitSortableTable(table, COLUMNS, '.row-flex.stretch');
    } else if (!state.mho_parameters.sort_omniscience_list && pageIsOmniscience()) {
        mhoCleanupSortableTable(table, '.row-flex.stretch');
    }
}


/** Sélecteur du tableau de la veille */
const nightwatch_table_selector: string = '.row-table.nightwatch';
/** La ligne de total ne participe pas au tri et doit rester en bas */
const nightwatch_row_selector: string = '.row.small:not(.total)';
const nightwatch_options: SortableTableOptions = {
    header_selector: '.row.header',
    footer_selector: '.row.small.total',
    /** Les cellules de données correspondantes sont centrées : l'en-tête doit l'être aussi */
    header_cell_class: 'center'
};

/**
 * Observer unique guettant l'injection AJAX de la liste de veille.
 * Un seul peut exister à la fois, il est déconnecté dès que le tableau est trouvé, et
 * `sortNightwatchList` le coupe à la première ré-initialisation faite hors de cette page :
 * il ne peut donc ni s'empiler ni survivre à la navigation.
 */
let nightwatch_observer: MutationObserver | undefined;

function stopWatchingNightwatchList(): void {
    nightwatch_observer?.disconnect();
    nightwatch_observer = undefined;
}

/**
 * Attend que l'onglet des remparts ait injecté la liste, puis équipe le tableau une fois.
 * L'observation est volontairement limitée à la zone de contenu du jeu et à sa seule
 * arborescence d'éléments, et ne dure que le temps du chargement.
 */
function watchForNightwatchList(): void {
    if (nightwatch_observer) return;

    const container: Element = document.getElementById(mh_content_id) ?? document.body;
    if (!container) return;

    nightwatch_observer = new MutationObserver(() => {
        /** L'option a pu être décochée ou la page quittée pendant l'attente */
        if (!state.mho_parameters.sort_nightwatch_list || !pageIsNightwatch()) {
            stopWatchingNightwatchList();
            return;
        }

        const table: Element | null = document.querySelector(nightwatch_table_selector);
        if (!table) return;

        stopWatchingNightwatchList();
        mhoInitSortableTable(table, buildNightwatchColumns(), nightwatch_row_selector, nightwatch_options);
    });

    nightwatch_observer.observe(container, { childList: true, subtree: true });
}

/**
 * Libellé traduit du métier d'une ligne de veille.
 *
 * Le rapprochement se fait sur le nom de fichier de l'icône (`tamer`, `book`, `tech`…), qui
 * correspond au champ `img` du référentiel des métiers : le texte `alt` de l'image ne peut pas
 * servir de clé, il est traduit et peut varier d'une ligne à l'autre. On trie donc sur un
 * libellé lisible tout en garantissant que deux citoyens du même métier restent groupés.
 */
function getJobLabelFromRow(row: HTMLElement): string {
    const src: string = row.querySelector('img[src*="/professions/"]')?.getAttribute('src') ?? '';
    /** '/build/images/professions/tamer.198b64bc.gif' → 'tamer' */
    const job_img: string = src.split('/').pop().split('.')[0];

    const job: typeof jobs[number] | undefined = jobs.find((known_job: typeof jobs[number]) => known_job.img === job_img);
    /** Métier inconnu du référentiel : on retombe sur la clé technique, qui groupe toujours correctement */
    return (getI18N(job?.label) ?? job_img).toLowerCase();
}


function buildNightwatchColumns(): (SortableColumn<string> | SortableColumn<number>)[] {
    return [
        { // Métier : tri alphabétique sur le libellé traduit, résolu depuis le nom technique de l'icône
            cell_index: 0,
            label: getI18N(texts.job),
            extract: (row: HTMLElement): string => getJobLabelFromRow(row),
            compare: (a: string, b: string): number => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Pseudo : tri alphabétique
            cell_index: 0,
            label: getI18N(texts.pseudo),
            extract: (row: HTMLElement): string => (row.querySelector('a')?.textContent ?? '').trim().toLowerCase(),
            compare: (a: string, b: string): number => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Défense : tri numérique
            cell_index: 1,
            label: getI18N(texts.defense),
            extract: (row: HTMLElement): number => {
                /** Les milliers peuvent être séparés par une espace insécable */
                const matched: RegExpMatchArray | null = (row.querySelector('.rw-2')?.textContent ?? '').replace(/\s/g, '').match(/(\d+)/);
                return matched ? parseInt(matched[1], 10) : 0;
            },
            compare: (a: number, b: number): number => a - b,
        },
    ];
}


export function sortNightwatchList(): void {
    /** Toute ré-initialisation hors de la page de veille coupe une attente restée en cours */
    if (!pageIsNightwatch()) {
        stopWatchingNightwatchList();
        return;
    }

    const is_enabled: boolean = !!state.mho_parameters.sort_nightwatch_list;
    const table: Element | null = document.querySelector(nightwatch_table_selector);

    if (!is_enabled) {
        stopWatchingNightwatchList();
        if (table) {
            mhoCleanupSortableTable(table, nightwatch_row_selector, nightwatch_options);
        }
        return;
    }

    /**
     * L'onglet des remparts charge sa liste en AJAX : elle peut ne pas être là au moment de
     * l'évènement de navigation. On l'attend alors, plutôt que de sonder la page à l'aveugle.
     */
    if (!table) {
        watchForNightwatchList();
        return;
    }

    stopWatchingNightwatchList();
    mhoInitSortableTable(table, buildNightwatchColumns(), nightwatch_row_selector, nightwatch_options);
}


/** Les lignes d'appâts sont les enfants directs du tableau, hors ligne d'en-tête */
const trap_row_selector: string = ':scope > .row:not(.header)';
const trap_options: SortableTableOptions = { header_selector: '.row.header' };

export function sortTrapList(): void {
    if (!pageIsTrap()) return;

    const table: Element | undefined = trapItemsTableElement();
    if (!table) return;

    const COLUMNS: (SortableColumn<string> | SortableColumn<number>)[] = [
        { // Objet : tri alphabétique sur le libellé, lu dans l'alt de l'icône
            extract: (row: HTMLElement): string => (row.querySelector('img[alt]')?.getAttribute('alt') ?? '').trim().toLowerCase(),
            compare: (a: string, b: string): number => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Stock restant : tri numérique
            extract: (row: HTMLElement): number => {
                const matched: RegExpMatchArray | null = (row.querySelector('.cell.rw-2')?.textContent ?? '').replace(/\s/g, '').match(/(\d+)/);
                return matched ? parseInt(matched[1], 10) : 0;
            },
            compare: (a: number, b: number): number => a - b,
        },
    ];

    if (state.mho_parameters.sort_trap_list) {
        mhoInitSortableTable(table, COLUMNS, trap_row_selector, trap_options);
    } else {
        mhoCleanupSortableTable(table, trap_row_selector, trap_options);
    }
}


/** Les lignes d'objets de la décharge sont des `.row-flex`, alors que son en-tête reste une `.row` */
const dump_row_selector: string = ':scope > .row-flex';
const dump_options: SortableTableOptions = { header_selector: '.row.header' };

/**
 * Nombre porté par la n-ième ligne de la cellule « Stock ».
 * Le jeu y empile « Banque : x » puis « Décharge : y », et n'ajoute « Sac : z » qu'à la fin
 * et sous condition : les deux premiers indices sont donc toujours stables.
 */
function getDumpCount(row: HTMLElement, line_index: number): number {
    const stock_cell: Element | undefined = Array.from(row.querySelectorAll('.cell'))[1];
    const line: Element | undefined = Array.from(stock_cell?.querySelectorAll('div.small') ?? [])[line_index];
    const matched: RegExpMatchArray | null = (line?.textContent ?? '').replace(/\s/g, '').match(/(\d+)/);
    return matched ? parseInt(matched[1], 10) : 0;
}

export function sortDumpList(): void {
    if (!pageIsDump()) return;

    const table: Element | undefined = dumpItemsTableElement();
    if (!table) return;

    const COLUMNS: (SortableColumn<string> | SortableColumn<number>)[] = [
        { // Objet : tri alphabétique sur le libellé rendu par le composant du jeu
            extract: (row: HTMLElement): string => (row.querySelector('.item-line img')?.getAttribute('alt') ?? row.querySelector('img[alt]')?.getAttribute('alt') ?? '').trim().toLowerCase(),
            compare: (a: string, b: string): number => a.localeCompare(b, 'fr', { sensitivity: 'base' }),
        },
        { // Stock : total banque + décharge, soit tout ce que la ville possède de cet objet
            extract: (row: HTMLElement): number => getDumpCount(row, 0) + getDumpCount(row, 1),
            compare: (a: number, b: number): number => a - b,
        },
        { // Défense apportée par l'objet
            extract: (row: HTMLElement): number => {
                const matched: RegExpMatchArray | null = (row.querySelector('.defense')?.textContent ?? '').replace(/\s/g, '').match(/(\d+)/);
                return matched ? parseInt(matched[1], 10) : 0;
            },
            compare: (a: number, b: number): number => a - b,
        },
    ];

    if (state.mho_parameters.sort_dump_list) {
        mhoInitSortableTable(table, COLUMNS, dump_row_selector, dump_options);
    } else {
        mhoCleanupSortableTable(table, dump_row_selector, dump_options);
    }
}

