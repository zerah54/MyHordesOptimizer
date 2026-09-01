import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { StatisticsComponent } from './statistics.component';

describe('StatisticsComponent', (): void => {
    let fixture: ComponentFixture<StatisticsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [StatisticsComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(StatisticsComponent);
        fixture.detectChanges();
    });

    it('shows the "Statistiques" title', (): void => {
        expect(fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim()).toBe('Statistiques');
    });

    it('renders one tab link per entry in the links list, in order, pointing to their route', (): void => {
        const links: HTMLAnchorElement[] = fixture.debugElement.queryAll(By.css('a[mat-tab-link]')).map((debugEl: DebugElement) => debugEl.nativeElement);

        expect(links.length).toBe(3);
        expect(links[0].textContent?.trim()).toBe('Estimations');
        expect(links[1].textContent?.trim()).toBe('Scrutateur');
        expect(links[2].textContent?.trim()).toBe('Registre');
    });

    it('renders a router outlet inside a tab nav panel', (): void => {
        expect(fixture.debugElement.query(By.css('mat-tab-nav-panel router-outlet'))).not.toBeNull();
    });
});
