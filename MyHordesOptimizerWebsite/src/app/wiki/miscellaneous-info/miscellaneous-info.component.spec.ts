import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown } from '../../_core/utilities/localstorage.util';
import { DespairDeathsCalculatorComponent } from './despair-deaths-calculator/despair-deaths-calculator.component';
import { MiscellaneousInfoComponent } from './miscellaneous-info.component';

describe('MiscellaneousInfoComponent', (): void => {
    let fixture: ComponentFixture<MiscellaneousInfoComponent>;
    let component: MiscellaneousInfoComponent;
    let dialog: jasmine.SpyObj<MatDialog>;
    let router: jasmine.SpyObj<Router>;

    /** Crée le composant après que le localStorage ait été positionné (my_town est lu à la construction). */
    function createComponent(): void {
        TestBed.resetTestingModule();
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        TestBed.configureTestingModule({
            imports: [MiscellaneousInfoComponent],
            providers: [
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router }
            ]
        });
        fixture = TestBed.createComponent(MiscellaneousInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    function cards(): DebugElement[] {
        return fixture.debugElement.queryAll(By.css('mat-card.card'));
    }

    function cellText(card: DebugElement, rowIndex: number, columnId: string): string {
        const rows: DebugElement[] = card.queryAll(By.css('tr.mat-mdc-row'));
        return rows[rowIndex].query(By.css(`td.mat-column-${columnId}`)).nativeElement.textContent.trim();
    }

    beforeEach((): void => {
        setTown(null);
    });

    afterEach((): void => {
        setTown(null);
    });

    it('renders the six wiki cards, in order', (): void => {
        createComponent();

        const titles: string[] = cards().map((card: DebugElement) => card.query(By.css('mat-card-title')).nativeElement.textContent.trim());

        expect(titles).toEqual([
            'Morts par désespoir',
            'Attaque théorique',
            'Débordement',
            'Manuel des ermites',
            'Points d\'âme',
            'Points clean'
        ]);
    });

    it('shows a calculate button only on the cards that declare a header action (despair deaths, overflow)', (): void => {
        createComponent();

        const hasButton: boolean[] = cards().map((card: DebugElement) => card.query(By.css('button[mat-icon-button]')) !== null);

        expect(hasButton).toEqual([true, false, true, false, false, false]);
    });

    it('opens the despair-deaths calculator dialog when its calculate button is clicked', (): void => {
        createComponent();

        cards()[0].query(By.css('button[mat-icon-button]')).nativeElement.click();

        expect(dialog.open).toHaveBeenCalledOnceWith(DespairDeathsCalculatorComponent);
    });

    it('navigates to the overflow tool when the overflow calculate button is clicked', (): void => {
        createComponent();

        cards()[2].query(By.css('button[mat-icon-button]')).nativeElement.click();

        expect(router.navigate).toHaveBeenCalledOnceWith(['tools', 'overflow']);
    });

    it('computes will_dead_zombies as floor(max(0, (nb_killed_zombies - 1) / 2)) in the despair-deaths table', (): void => {
        createComponent();
        const table: DebugElement = cards()[0];

        expect(cellText(table, 0, 'nb_killed_zombies')).toBe('0');
        expect(cellText(table, 0, 'will_dead_zombies')).toBe('0');
        expect(cellText(table, 5, 'nb_killed_zombies')).toBe('5');
        expect(cellText(table, 5, 'will_dead_zombies')).toBe('2');
    });

    it('caps the overflow targeted-citizen count at 40', (): void => {
        createComponent();
        const table: DebugElement = cards()[2];

        expect(cellText(table, 0, 'day')).toBe('1');
        expect(cellText(table, 0, 'citizen')).toBe('10');
        expect(cellText(table, 49, 'day')).toBe('50');
        expect(cellText(table, 49, 'citizen')).toBe('40');
    });

    it('computes survivalist manual odds thresholds, with a 20-point penalty in a devastated town (floored at 10%)', (): void => {
        createComponent();
        const table: DebugElement = cards()[3];

        expect(cellText(table, 0, 'success')).toBe('100%');
        expect(cellText(table, 0, 'success_devastated')).toBe('80%');
        expect(cellText(table, 19, 'day')).toBe('20');
        expect(cellText(table, 19, 'success')).toBe('50%');
        expect(cellText(table, 19, 'success_devastated')).toBe('30%');
    });

    it('reads the active town from localStorage at construction, and defaults to null when there is none', (): void => {
        createComponent();
        expect(component['my_town']).toBeNull();

        setTown(Object.assign(new TownDetails(), { day: 7, town_type: 'RE' }));
        createComponent();

        expect((component['my_town'] as TownDetails).day).toBe(7);
    });

    it('highlights the row matching the active town\'s day, only in tables that opted into highlight_day', (): void => {
        setTown(Object.assign(new TownDetails(), { day: 7, town_type: 'RE' }));
        createComponent();

        const attack_table: DebugElement = cards()[1];
        const attack_rows: DebugElement[] = attack_table.queryAll(By.css('tr.mat-mdc-row'));
        expect(attack_rows[6].nativeElement.classList.contains('today')).toBeTrue();
        expect(attack_rows[0].nativeElement.classList.contains('today')).toBeFalse();

        const despair_table: DebugElement = cards()[0];
        const despair_rows: DebugElement[] = despair_table.queryAll(By.css('tr.mat-mdc-row'));
        expect(despair_rows.some((row: DebugElement) => row.nativeElement.classList.contains('today'))).toBeFalse();
    });

    it('highlights no row in any table when there is no active town', (): void => {
        createComponent();

        const attack_table: DebugElement = cards()[1];
        const attack_rows: DebugElement[] = attack_table.queryAll(By.css('tr.mat-mdc-row'));

        expect(attack_rows.some((row: DebugElement) => row.nativeElement.classList.contains('today'))).toBeFalse();
    });
});
