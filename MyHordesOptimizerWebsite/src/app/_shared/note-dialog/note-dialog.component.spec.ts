import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { NoteDialogComponent, NoteDialogData } from './note-dialog.component';

describe('NoteDialogComponent', (): void => {
    let fixture: ComponentFixture<NoteDialogComponent>;

    async function setup(data: NoteDialogData): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [NoteDialogComponent],
            providers: [
                provideHttpClient(), provideHttpClientTesting(),
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: { close: (): void => undefined } },
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(NoteDialogComponent);
        fixture.detectChanges();
    }

    it('initializes the editor content from dialog data', async (): Promise<void> => {
        await setup({ initialContent: '<p>existing</p>' });

        expect((fixture.componentInstance as unknown as { content: string }).content).toBe('<p>existing</p>');
    });

    it('defaults to an empty string when there is no existing note', async (): Promise<void> => {
        await setup({ initialContent: null });

        expect((fixture.componentInstance as unknown as { content: string }).content).toBe('');
    });
});
