import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderWithNumberFilterComponent } from './header-with-number-filter.component';

describe('HeaderWithNumberFilterComponent', () => {
    let fixture: ComponentFixture<HeaderWithNumberFilterComponent>;
    let component: HeaderWithNumberFilterComponent;

    /** Ouvre le filtre en cliquant sur l'icône du template (déclenche le marquage OnPush, contrairement à un appel direct de méthode). */
    function openFilter(): void {
        const icon: HTMLElement = fixture.nativeElement.querySelector('.open-menu-icon');
        icon.click();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithNumberFilterComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderWithNumberFilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('header', 'Jour');
        fixture.componentRef.setInput('filterValue', '');
        fixture.detectChanges();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('affiche l\'en-tête et l\'icône pour ouvrir le filtre, le champ masqué', () => {
        expect(fixture.nativeElement.textContent).toContain('Jour');
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('affiche le champ de saisie et lui donne le focus après clic sur l\'icône', async () => {
        openFilter();

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();

        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout qui donne le focus au champ
        expect(document.activeElement).toBe(input);
    });

    it('émet filterValueChange à la saisie', async () => {
        fixture.componentRef.setInput('filterValue', 5);
        openFilter();
        await vi.advanceTimersByTimeAsync(0);

        const emitted: (number | string)[] = [];
        component.filterValueChange.subscribe((v: number | string) => emitted.push(v));

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = '7';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(emitted).toEqual(['7']);
    });

    it('focusout masque à nouveau le champ si filterValue est vide', async () => {
        openFilter();
        await vi.advanceTimersByTimeAsync(0);

        fixture.componentRef.setInput('filterValue', '');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('focusout garde le champ affiché si filterValue est renseigné', async () => {
        openFilter();
        await vi.advanceTimersByTimeAsync(0);

        fixture.componentRef.setInput('filterValue', 3);
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    });
});
