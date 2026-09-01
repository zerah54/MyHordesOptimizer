import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CitizensComponent } from './citizens.component';

describe('CitizensComponent', (): void => {
    let fixture: ComponentFixture<CitizensComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizensComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(CitizensComponent);
        fixture.detectChanges();
    });

    function linkLabels(): string[] {
        const links: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('a[mat-tab-link]'));
        return links.map((link: HTMLElement): string => link.textContent?.trim() ?? '');
    }

    it('shows the "Citoyens" title', (): void => {
        const title: HTMLElement | null = fixture.nativeElement.querySelector('mat-card-title');
        expect(title?.textContent?.trim()).toBe('Citoyens');
    });

    it('renders one tab link per visible entry of the links list, in order', (): void => {
        expect(linkLabels()).toEqual(['Citoyens', 'Fouilles', 'Actions quotidiennes', 'Disponibilités']);
    });

    it('points each tab link to its route path', (): void => {
        const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a[mat-tab-link]'));
        expect(links.map((link: HTMLAnchorElement): string | null => link.getAttribute('href'))).toEqual(['/list', '/digs', '/daily-actions', '/dispo']);
    });

    it('renders a router outlet inside a tab-nav-panel', (): void => {
        const panel: HTMLElement | null = fixture.nativeElement.querySelector('mat-tab-nav-panel');
        expect(panel?.querySelector('router-outlet')).not.toBeNull();
    });
});
