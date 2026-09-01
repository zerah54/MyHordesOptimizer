import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampingsComponent } from './campings.component';

describe('CampingsComponent', (): void => {
    let fixture: ComponentFixture<CampingsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CampingsComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(CampingsComponent);
        fixture.detectChanges();
    });

    it('shows the "Campings" title', (): void => {
        const title: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-title');
        expect(title?.textContent?.trim()).toBe('Campings');
    });

    it('renders an empty content area', (): void => {
        const content: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-content.mho-camping');
        expect(content).not.toBeNull();
        expect(content?.textContent?.trim()).toBe('');
    });
});
