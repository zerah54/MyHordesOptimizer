import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { PlanningCopyDayDialogComponent, PlanningCopyDayDialogData } from './planning-copy-day-dialog.component';

describe('PlanningCopyDayDialogComponent', (): void => {
    let fixture: ComponentFixture<PlanningCopyDayDialogComponent>;
    let close: Mock<(result?: unknown) => void>;

    const data: PlanningCopyDayDialogData = { title: 'Copier vers le jour', name: 'Plan A (copie)', day: 10, days: [10, 11, 12], today: 10, askParts: false };

    async function render(value: PlanningCopyDayDialogData): Promise<void> {
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [PlanningCopyDayDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: value },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningCopyDayDialogComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function input(): HTMLInputElement {
        return root().querySelector<HTMLInputElement>('input[data-field="name"]') as HTMLInputElement;
    }

    function submit(): HTMLButtonElement {
        return root().querySelector<HTMLButtonElement>('button[data-action="confirm"]') as HTMLButtonElement;
    }

    it('affiche le titre, le nom proposé et le jour proposé', async (): Promise<void> => {
        await render(data);

        expect(root().querySelector('[mat-dialog-title]')?.textContent).toContain('Copier vers le jour');
        expect(input().value).toBe('Plan A (copie)');
        expect(root().querySelector('mho-day-selector .day')?.textContent).toContain('10');
    });

    it('valide avec le jour choisi et le nom rogné', async (): Promise<void> => {
        await render(data);
        root().querySelector<HTMLButtonElement>('button[data-action="next-day"]')?.click();
        input().value = '  Copie  ';
        input().dispatchEvent(new Event('input'));
        fixture.detectChanges();

        submit().click();

        expect(close).toHaveBeenCalledWith({ day: 11, name: 'Copie', parts: { budget: true, programs: true } });
    });

    it('le sélecteur de jour a un nom accessible', async (): Promise<void> => {
        await render(data);

        expect(root().querySelector('mho-day-selector')?.getAttribute('aria-label')).toBeTruthy();
    });

    it('sans nom ni parties : seulement le jour', async (): Promise<void> => {
        await render({ ...data, name: '', askName: false });

        expect(input()).toBeNull();
        expect(submit().disabled).toBe(false);
        submit().click();
        expect(close).toHaveBeenCalledWith(expect.objectContaining({ day: 10 }));
    });

    it('un nom vide désactive la validation', async (): Promise<void> => {
        await render({ ...data, name: '' });

        expect(submit().disabled).toBe(true);
    });

    describe('choix des parties', (): void => {
        function part(name: string): HTMLInputElement {
            return root().querySelector<HTMLInputElement>(`[data-field="${name}"] input`) as HTMLInputElement;
        }

        it('sans nom, budget et programmes cochés par défaut ; valide avec les parties choisies', async (): Promise<void> => {
            await render({ ...data, name: '', askParts: true });

            expect(input()).toBeNull();
            expect(part('budget').checked).toBe(true);
            expect(part('programs').checked).toBe(true);

            part('budget').click();
            fixture.detectChanges();
            submit().click();

            expect(close).toHaveBeenCalledWith({ day: 10, name: '', parts: { budget: false, programs: true } });
        });

        it('aucune partie cochée désactive la validation', async (): Promise<void> => {
            await render({ ...data, name: '', askParts: true });

            part('budget').click();
            part('programs').click();
            fixture.detectChanges();

            expect(submit().disabled).toBe(true);
        });
    });
});
