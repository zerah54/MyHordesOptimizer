import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PreTownDuplicateDialogComponent } from './pre-town-duplicate-dialog.component';

describe('PreTownDuplicateDialogComponent', (): void => {
    let close: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<PreTownDuplicateDialogComponent>;

    beforeEach(async (): Promise<void> => {
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [PreTownDuplicateDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { alias: 'PV (copie)' } },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PreTownDuplicateDialogComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    function type(value: string): void {
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    it('valide l\'alias rogné', (): void => {
        type('  Copie  ');
        (fixture.nativeElement.querySelector('mat-dialog-actions button:last-child') as HTMLButtonElement).click();

        expect(close).toHaveBeenCalledWith('Copie');
    });

    it('un alias de plus de 64 caractères ne ferme pas la boîte et le champ est limité', (): void => {
        expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).maxLength).toBe(64);
        type('A'.repeat(65));
        (fixture.nativeElement.querySelector('mat-dialog-actions button:last-child') as HTMLButtonElement).click();

        expect(close).not.toHaveBeenCalled();
    });

    it('un alias vide ne ferme pas la boîte', (): void => {
        type('   ');
        (fixture.nativeElement.querySelector('mat-dialog-actions button:last-child') as HTMLButtonElement).click();

        expect(close).not.toHaveBeenCalled();
    });
});
