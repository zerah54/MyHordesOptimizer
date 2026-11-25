import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { NightwatchSimulationDialogComponent, NightwatchSimulationDialogData } from './nightwatch-simulation-dialog.component';

describe('NightwatchSimulationDialogComponent', (): void => {
    let fixture: ComponentFixture<NightwatchSimulationDialogComponent>;
    let close: Mock;

    /** Rend la boîte avec ses paramètres. */
    async function render(data: NightwatchSimulationDialogData): Promise<void> {
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [NightwatchSimulationDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchSimulationDialogComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** Saisit une valeur dans un champ. */
    function input(field: string, value: string): void {
        const element: HTMLInputElement = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`input[data-field="${field}"]`) as HTMLInputElement;
        element.value = value;
        element.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    /** Bouton de validation. */
    function confirmButton(): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="confirm"]') as HTMLButtonElement;
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('valide nom rogné et dernier jour', async (): Promise<void> => {
        await render({ title: 'Nouvelle', name: '', last_day: 10, min_day: 10 });
        input('name', '  J36 ');
        input('last-day', '36');

        confirmButton().click();

        expect(close).toHaveBeenCalledWith({ name: 'J36', last_day: 36 });
    });

    it('refuse un nom vide ou un jour avant le jour courant', async (): Promise<void> => {
        await render({ title: 'Nouvelle', name: 'J36', last_day: 10, min_day: 10 });
        input('last-day', '9');
        expect(confirmButton().disabled).toBe(true);

        input('last-day', '12');
        input('name', '  ');
        expect(confirmButton().disabled).toBe(true);
    });

    it('sans dernier jour demandé : seul le nom est saisi', async (): Promise<void> => {
        await render({ title: 'Renommer', name: 'J36', last_day: null, min_day: 10 });

        expect((fixture.nativeElement as HTMLElement).querySelector('input[data-field="last-day"]')).toBeNull();
        confirmButton().click();

        expect(close).toHaveBeenCalledWith({ name: 'J36', last_day: null });
    });

    it('sans nom demandé : seul le dernier jour est saisi', async (): Promise<void> => {
        await render({ title: 'Dernier jour', name: null, last_day: 12, min_day: 10 });

        expect((fixture.nativeElement as HTMLElement).querySelector('input[data-field="name"]')).toBeNull();
        confirmButton().click();

        expect(close).toHaveBeenCalledWith({ name: null, last_day: 12 });
    });
});
