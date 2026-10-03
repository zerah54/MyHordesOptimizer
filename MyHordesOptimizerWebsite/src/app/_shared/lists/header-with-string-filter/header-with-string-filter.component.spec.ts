import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderWithStringFilterComponent } from './header-with-string-filter.component';

describe('HeaderWithStringFilterComponent', () => {
    let fixture: ComponentFixture<HeaderWithStringFilterComponent>;
    let component: HeaderWithStringFilterComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithStringFilterComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderWithStringFilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('header', 'Nom');
        fixture.componentRef.setInput('filterValue', '');
        // Pas de detectChanges() ici : certains tests appellent displayFilter() AVANT le premier
        // rendu, seul moment où un composant OnPush se réévalue sans événement du template.
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('à l\'état initial, affiche l\'icône de filtre et masque le champ', () => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('un clic sur l\'icône affiche le champ à sa place', () => {
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.open-menu-icon').click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();
    });

    it('affiche le champ de saisie une fois displayFilter() déclenché, avec la valeur du filtre, et lui donne le focus', async () => {
        fixture.componentRef.setInput('filterValue', 'Bob');
        (component as unknown as {
            displayFilter(): void;
        }).displayFilter();
        fixture.detectChanges();

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();

        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout qui donne le focus au champ ET la microtâche NgModel
        fixture.detectChanges();
        expect(input.value).toBe('Bob');
        expect(document.activeElement).toBe(input);
    });

    it('émet filterValueChange à la saisie', async () => {
        (component as unknown as {
            displayFilter(): void;
        }).displayFilter();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        const emitted: string[] = [];
        component.filterValueChange.subscribe((v: string) => emitted.push(v));

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = 'Alice';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(emitted).toEqual(['Alice']);
    });

    it('focusout (événement réel du template) masque le champ si filterValue est vide', async () => {
        (component as unknown as {
            displayFilter(): void;
        }).displayFilter();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        fixture.componentRef.setInput('filterValue', '');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('focusout garde le champ affiché si filterValue est renseigné', async () => {
        (component as unknown as {
            displayFilter(): void;
        }).displayFilter();
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        fixture.componentRef.setInput('filterValue', 'Bob');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    });
});
