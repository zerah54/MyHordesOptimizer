import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ThanksComponent } from './thanks.component';

describe('ThanksComponent', (): void => {
    let fixture: ComponentFixture<ThanksComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [ThanksComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ThanksComponent);
        fixture.detectChanges();
    });

    it('shows the "Remerciements" title', (): void => {
        expect(fixture.debugElement.query(By.css('h2')).nativeElement.textContent.trim()).toBe('Remerciements');
    });

    it('thanks each named contributor', (): void => {
        const content: string = fixture.nativeElement.textContent;

        ['Renack', 'Bigonoud', 'CrazyUnicorn', 'Argo', 'Katt', 'aracime'].forEach((name: string): void => {
            expect(content).toContain(name);
        });
    });

    it('has a close button wired to mat-dialog-close', (): void => {
        const closeButton: HTMLButtonElement = fixture.debugElement.query(By.css('.close-button')).nativeElement;

        expect(closeButton.hasAttribute('mat-dialog-close')).toBeTrue();
    });
});
