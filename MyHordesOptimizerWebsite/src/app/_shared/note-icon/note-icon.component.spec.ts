import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NoteIconComponent } from './note-icon.component';

function tooltip(fixture: ComponentFixture<NoteIconComponent>): MatTooltip {
    return fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
}

describe('NoteIconComponent', (): void => {
    let fixture: ComponentFixture<NoteIconComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [NoteIconComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent(NoteIconComponent);
    });

    it('shows the filled icon when a note is present', (): void => {
        fixture.componentRef.setInput('note', 'ligne 1\nligne 2');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-icon')).nativeElement.textContent.trim()).toBe('sticky_note_2');
    });

    it('shows the note as a multiline tooltip', (): void => {
        fixture.componentRef.setInput('note', 'ligne 1\nligne 2');
        fixture.detectChanges();

        expect(tooltip(fixture).message).toBe('ligne 1\nligne 2');
        expect(tooltip(fixture).tooltipClass).toBe('mho-multiline-tooltip');
    });

    it('shows the empty icon when no note is present', (): void => {
        fixture.componentRef.setInput('note', null);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-icon')).nativeElement.textContent.trim()).toBe('note_add');
    });

    it('emits clicked on button click', (): void => {
        fixture.detectChanges();
        let emitted = false;
        fixture.componentInstance.clicked.subscribe((): void => { emitted = true; });

        fixture.debugElement.query(By.css('button')).nativeElement.click();

        expect(emitted).toBe(true);
    });
});
