import { afterEach, describe, expect, it, vi } from 'vitest';

import { mhoCleanupSortableTable, mhoInitSortableTable } from './sort-lists';

vi.mock('../utils/page', () => ({
    dumpItemsTableElement: (): undefined => undefined,
    pageIsCitizens: (): boolean => false,
    pageIsDump: (): boolean => false,
    pageIsNightwatch: (): boolean => false,
    pageIsOmniscience: (): boolean => false,
    pageIsTrap: (): boolean => false,
    trapItemsTableElement: (): undefined => undefined
}));

const row_selector: string = '.row-flex.stretch';

/** Tableau minimal : un en-tête à deux cellules (la première porte un bouton d'aide) et trois lignes */
function buildTable(): HTMLElement {
    document.body.innerHTML = `
        <div class="row-table">
            <div class="row-flex header"><div class="cell">Nom<span class="help-button"></span></div><div class="cell">Val</div></div>
            <div class="row-flex stretch"><span class="n">b</span></div>
            <div class="row-flex stretch"><span class="n">c</span></div>
            <div class="row-flex stretch"><span class="n">a</span></div>
        </div>`;
    return document.querySelector('.row-table') as HTMLElement;
}

const columns: { extract: (row: HTMLElement) => string | number; compare: (a: any, b: any) => number }[] = [{
    extract: (row: HTMLElement): string => row.querySelector('.n')!.textContent ?? '',
    compare: (a: string, b: string): number => a.localeCompare(b)
}, {
    extract: (): number => 0,
    compare: (a: number, b: number): number => a - b
}];

function order(table: HTMLElement): string {
    return Array.from(table.querySelectorAll('.n')).map((n: Element): string => n.textContent ?? '').join('');
}

afterEach((): void => {
    document.body.innerHTML = '';
});

describe('tri : réactivation', () => {
    it('ne change le sens de tri qu\'une fois par clic après activer / désactiver / réactiver', () => {
        /** Nombre d'appels de `compare` pour un clic : un second écouteur résiduel le doublerait */
        const compareCallsForOneClick = (reactivate: boolean): number => {
            const table: HTMLElement = buildTable();
            const compare = vi.fn((a: string, b: string): number => a.localeCompare(b));
            const spied_columns = [{ extract: columns[0].extract, compare }, columns[1]];
            mhoInitSortableTable(table, spied_columns, row_selector);
            if (reactivate) {
                mhoCleanupSortableTable(table, row_selector);
                mhoInitSortableTable(table, spied_columns, row_selector);
            }
            (table.querySelector('.header .cell') as HTMLElement).click();
            expect(order(table)).toBe('abc');
            return compare.mock.calls.length;
        };

        expect(compareCallsForOneClick(true)).toBe(compareCallsForOneClick(false));
    });

    it('le nettoyage retire l\'écouteur du bouton d\'aide', () => {
        const table: HTMLElement = buildTable();
        const help: HTMLElement = table.querySelector('.help-button') as HTMLElement;
        const parent_clicks: { count: number } = { count: 0 };
        (help.parentElement as HTMLElement).addEventListener('click', (): void => { parent_clicks.count++; });

        mhoInitSortableTable(table, columns, row_selector);
        mhoCleanupSortableTable(table, row_selector);
        help.click();

        /** Sans l'écouteur résiduel, la propagation n'est plus stoppée */
        expect(parent_clicks.count).toBe(1);
    });
});
