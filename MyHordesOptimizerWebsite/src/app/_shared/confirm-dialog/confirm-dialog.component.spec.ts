import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', (): void => {
    let fixture: ComponentFixture<ConfirmDialogComponent>;
    let dialogRef: { close: jasmine.Spy };

    async function setup(data: ConfirmDialogData): Promise<void> {
        dialogRef = { close: jasmine.createSpy('close') };
        await TestBed.configureTestingModule({
            imports: [ConfirmDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: dialogRef },
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(ConfirmDialogComponent);
        fixture.detectChanges();
    }

    it('shows the title when data.title is set', async (): Promise<void> => {
        await setup({ title: 'Confirmation', text: 'Êtes-vous sûr ?' });

        const title = fixture.debugElement.query(By.css('h1'));
        expect(title.nativeElement.textContent.trim()).toBe('Confirmation');
    });

    it('does not show a title element when data.title is empty', async (): Promise<void> => {
        await setup({ title: '', text: 'Êtes-vous sûr ?' });

        expect(fixture.debugElement.query(By.css('h1'))).toBeNull();
    });

    it('shows the dialog text', async (): Promise<void> => {
        await setup({ title: '', text: 'Êtes-vous sûr ?' });

        expect(fixture.debugElement.query(By.css('[mat-dialog-content]')).nativeElement.textContent.trim()).toBe('Êtes-vous sûr ?');
    });

    it('renders a cancel button and a confirm button', async (): Promise<void> => {
        await setup({ title: '', text: 'text' });

        const buttons: HTMLElement[] = fixture.debugElement.queryAll(By.css('button')).map((el): HTMLElement => el.nativeElement);
        expect(buttons.length).toBe(2);
        expect(buttons[0].textContent?.trim()).toBe('Annuler');
        expect(buttons[1].textContent?.trim()).toBe('Valider');
    });

    it('closes the dialog with false when the cancel button is clicked', async (): Promise<void> => {
        await setup({ title: '', text: 'text' });

        fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();

        expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('closes the dialog with true when the confirm button is clicked', async (): Promise<void> => {
        await setup({ title: '', text: 'text' });

        fixture.debugElement.queryAll(By.css('button'))[1].nativeElement.click();

        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
});
