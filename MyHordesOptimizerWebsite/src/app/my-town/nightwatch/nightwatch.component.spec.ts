import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NightwatchComponent } from './nightwatch.component';

describe('NightwatchComponent', (): void => {
    let fixture: ComponentFixture<NightwatchComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [NightwatchComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(NightwatchComponent);
        fixture.detectChanges();
    });

    it('shows the "Veilles" title', (): void => {
        const title: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-title');
        expect(title?.textContent?.trim()).toBe('Veilles');
    });

    it('renders an empty content area', (): void => {
        const content: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-content.mho-nightwatch');
        expect(content).not.toBeNull();
        expect(content?.textContent?.trim()).toBe('');
    });
});
