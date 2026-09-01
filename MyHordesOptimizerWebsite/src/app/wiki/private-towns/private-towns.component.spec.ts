import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { PrivateTownsComponent } from './private-towns.component';
import { private_town_params, PrivateTownParamOptions, PrivateTownParams } from './private-towns-params.const';

describe('PrivateTownsComponent', (): void => {
    let fixture: ComponentFixture<PrivateTownsComponent>;
    let component: PrivateTownsComponent;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [PrivateTownsComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(PrivateTownsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function rows(): DebugElement[] {
        return fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
    }

    /** Localise, dans la donnée source, la ligne (paramètre + option) attendue après aplatissement. */
    function findRowIndex(paramName: string, optionName: string): number {
        let index: number = 0;
        for (const param of private_town_params) {
            for (const option of param.options) {
                if (param.name['fr'] === paramName && option.name['fr'] === optionName) {
                    return index;
                }
                index++;
            }
        }
        throw new Error(`Row not found: ${paramName} / ${optionName}`);
    }

    it('shows the "Villes privées" card title', (): void => {
        expect(fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim()).toBe('Villes privées');
    });

    it('flattens every param option into one row each, on init', (): void => {
        const expected_row_count: number = private_town_params.reduce((sum: number, param: PrivateTownParams) => sum + param.options.length, 0);

        expect(rows().length).toBe(expected_row_count);
    });

    it('spans the name cell over all the rows of its group, only on the first row of that group', (): void => {
        const first_group: PrivateTownParams = private_town_params[0];
        const second_group: PrivateTownParams = private_town_params[1];
        const second_group_start: number = first_group.options.length;

        // 1ère ligne d'un groupe : rowspan = taille du groupe. Les lignes suivantes du même groupe : 0.
        expect(component['getRowSpan']('name', 0)).toBe(first_group.options.length);
        for (let i: number = 1; i < first_group.options.length; i++) {
            expect(component['getRowSpan']('name', i)).toBe(0);
        }

        // groupe suivant : le compteur repart à zéro sur sa propre taille
        expect(component['getRowSpan']('name', second_group_start)).toBe(second_group.options.length);
        expect(component['getRowSpan']('name', second_group_start + 1)).toBe(0);
    });

    it('hides the name cell (rowspan 0, display none) for every row after the first one in its group', (): void => {
        const name_cells: DebugElement[] = rows().map((row: DebugElement) => row.query(By.css('td.mat-column-name')));
        const first_group_size: number = private_town_params[0].options.length;

        expect(name_cells[0].nativeElement.getAttribute('rowspan')).toBe(`${first_group_size}`);
        expect(name_cells[0].nativeElement.style.display).not.toBe('none');
        expect(name_cells[1].nativeElement.getAttribute('rowspan')).toBe('0');
        expect(name_cells[1].nativeElement.style.display).toBe('none');
    });

    it('getRowSpan always returns 1 for any column other than "name" (unreachable via the current template, which only calls it for "name")', (): void => {
        expect(component['getRowSpan']('option_name', 1)).toBe(1);
        expect(component['getRowSpan']('default_rne', 42)).toBe(1);
    });

    it('shows the "default" star icon when an option is the default for a mode', (): void => {
        const row_index: number = findRowIndex('Type de goule', 'Normal');
        const cell: DebugElement = rows()[row_index].query(By.css('td.mat-column-default_rne'));
        const img: HTMLImageElement = cell.query(By.css('img')).nativeElement;

        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/star.gif`);
    });

    it('shows the "unavailable" icon when an option is disabled at the param level, even if not marked disabled at the option level', (): void => {
        // "Mode nuit" a disabled_rne=true au niveau paramètre ; son option "Étendu" a disabled_rne=false au niveau option
        const target_param: PrivateTownParams = private_town_params.find((p: PrivateTownParams) => p.name['fr'] === 'Mode nuit')!;
        const target_option: PrivateTownParamOptions = target_param.options.find((o: PrivateTownParamOptions) => o.name['fr'] === 'Étendu')!;
        expect(target_option.disabled_rne).toBeFalse();
        expect(target_param.disabled_rne).toBeTrue();

        const row_index: number = findRowIndex('Mode nuit', 'Étendu');
        const cell: DebugElement = rows()[row_index].query(By.css('td.mat-column-default_rne'));
        const img: HTMLImageElement = cell.query(By.css('img')).nativeElement;

        expect(img.src).toContain(`${HORDES_IMG_REPO}icons/small_remove.gif`);
    });

    it('shows no icon when an option is neither the default nor disabled for a mode', (): void => {
        const row_index: number = findRowIndex('Type de goule', 'Ville de bisounours');
        const cell: DebugElement = rows()[row_index].query(By.css('td.mat-column-default_rne'));

        expect(cell.query(By.css('img'))).toBeNull();
    });
});
