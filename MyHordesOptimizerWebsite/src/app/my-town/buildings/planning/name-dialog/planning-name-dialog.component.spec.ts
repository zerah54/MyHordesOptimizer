import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { PlanningNameDialogComponent, PlanningNameDialogData } from './planning-name-dialog.component';

describe('PlanningNameDialogComponent', (): void => {
    let fixture: ComponentFixture<PlanningNameDialogComponent>;
    let close: Mock<(result?: unknown) => void>;

    async function render(data: PlanningNameDialogData): Promise<void> {
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [PlanningNameDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningNameDialogComponent);
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

    it('affiche le titre et le nom proposé', async (): Promise<void> => {
        await render({ title: 'Renommer', name: 'Plan A', offerCopy: false });

        expect(root().querySelector('[mat-dialog-title]')?.textContent).toContain('Renommer');
        expect(input().value).toBe('Plan A');
        expect(root().querySelector('mat-checkbox')).toBeNull();
    });

    it('valide avec le nom rogné', async (): Promise<void> => {
        await render({ title: 'Renommer', name: 'Plan A', offerCopy: false });
        input().value = '  Plan B  ';
        input().dispatchEvent(new Event('input'));
        fixture.detectChanges();

        submit().click();

        expect(close).toHaveBeenCalledWith({ name: 'Plan B', copy: false });
    });

    it('un nom vide désactive la validation', async (): Promise<void> => {
        await render({ title: 'Nouvelle proposition', name: '', offerCopy: true });

        expect(submit().disabled).toBe(true);
    });

    it('propose de partir d\'une copie de la proposition affichée', async (): Promise<void> => {
        await render({ title: 'Nouvelle proposition', name: 'Plan', offerCopy: true });
        root().querySelector<HTMLInputElement>('mat-checkbox input')?.click();
        fixture.detectChanges();

        submit().click();

        expect(close).toHaveBeenCalledWith({ name: 'Plan', copy: true });
    });
});
