import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingsComponent } from './buildings.component';

describe('BuildingsComponent', (): void => {
    let fixture: ComponentFixture<BuildingsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [BuildingsComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(BuildingsComponent);
        fixture.detectChanges();
    });

    it('shows the "Chantiers" title', (): void => {
        const title: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-title');
        expect(title?.textContent?.trim()).toBe('Chantiers');
    });

    it('renders an empty content area', (): void => {
        const content: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-content.mho-buildings');
        expect(content).not.toBeNull();
        expect(content?.textContent?.trim()).toBe('');
    });
});
