import {pageIsCitizens, pageIsOmniscience} from '../utils/page';
import {state} from '../state';

// TypeScript's arrFrom(any) can infer element type as 'unknown' rather
// than 'any' when the source isn't a statically-typed iterable.
const arrFrom = (x: any): any[] => Array.from(x);

////////////////////////
// TRI SUR LES LISTES //
////////////////////////
export function mhoInitSortableTable(table, columns, rowSelector) {
    if (!table || table.dataset.sortEnabled) return;
    table.dataset.sortEnabled = 'true';

    arrFrom(table.querySelectorAll(rowSelector))
        .forEach((row, i) => {
            row.dataset.origIdx = i;
        });

    const header = table.querySelector('.row-flex.header');
    if (!header) return;

    const cells = arrFrom(header.children).filter((el) => el.classList.contains('cell'));
    let activeCol = -1;
    let direction = 0;

    const doSort = (colIndex, dir) => {
        const rows = arrFrom(table.querySelectorAll(rowSelector));
        if (dir === 0) {
            rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
        } else {
            const {extract, compare} = columns[colIndex];
            rows.sort((a, b) => dir * compare(extract(a), extract(b)));
        }
        rows.forEach((row) => table.appendChild(row));
    };

    const arrows = cells.map((cell, colIdx) => {
        cell.querySelector('.help-button')
            ?.addEventListener('click', (e) => e.stopPropagation());

        const arrow = document.createElement('span');
        arrow.className = 'mho-sort-arrow';
        arrow.textContent = ' ⇅';
        cell.classList.add('mho-sortable-cell');
        cell.appendChild(arrow);

        cell.addEventListener('click', () => {
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
                const on = (j === activeCol && direction !== 0);
                a.textContent = on ? (direction === 1 ? ' ↑' : ' ↓') : ' ⇅';
                a.style.opacity = on ? '1' : '0.4';
            });

            doSort(activeCol < 0 ? 0 : activeCol, direction);
        });

        return arrow;
    });
}


export function mhoCleanupSortableTable(table, rowSelector) {
    if (!table?.dataset.sortEnabled) return;

    table.querySelectorAll('.mho-sort-arrow').forEach(a => a.remove());

    const header = table.querySelector('.row-flex.header');
    if (header) {
        arrFrom(header.children)
            .filter((el) => el.classList.contains('cell'))
            .forEach((cell) => cell.classList.remove('mho-sortable-cell'));
    }

    const rows = arrFrom(table.querySelectorAll(rowSelector));
    rows.sort((a, b) => Number(a.dataset.origIdx) - Number(b.dataset.origIdx));
    rows.forEach((row) => {
        table.appendChild(row);
        delete row.dataset.origIdx;
    });

    delete table.dataset.sortEnabled;
}


export function sortCitizenList() {

    const COLUMNS = [
        { // Citoyens : tri alphabétique
            extract: row => (row.querySelector('.username')?.textContent ?? '').trim().toLowerCase(),
            compare: (a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'}),
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
                if (!m) return {inTown: true, dist: 0};
                const x = parseInt(m[1], 10), y = parseInt(m[2], 10);
                return {inTown: false, dist: Math.abs(x) + Math.abs(y)};
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
            compare: (a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'}),
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

