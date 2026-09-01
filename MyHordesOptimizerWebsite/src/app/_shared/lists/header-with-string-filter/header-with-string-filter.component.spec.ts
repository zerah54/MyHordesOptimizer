import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

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
        // Pas de detectChanges() ici : certains tests doivent appeler displayFilter() AVANT le tout
        // premier rendu — le seul moment où un composant OnPush se réévalue inconditionnellement,
        // contrairement à `displayFilter()` invoqué après coup depuis un test (aucun événement réel
        // du template ne peut le déclencher ici, cf. bug caractérisé plus bas — donc pas de marquage
        // automatique OnPush possible pour un appel a posteriori).
    });

    it('caractérise un bug hérité : à l\'état initial (masqué), ni l\'icône ni le champ ne sont affichés — le template conditionne l\'icône sur `visible` au lieu de `!visible` (contrairement aux 3 composants jumeaux), la rendant inaccessible au clic depuis l\'état masqué', () => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();
        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('affiche le champ de saisie une fois displayFilter() déclenché, avec la valeur du filtre, et lui donne le focus', fakeAsync(() => {
        fixture.componentRef.setInput('filterValue', 'Bob');
        (component as unknown as { displayFilter(): void }).displayFilter();
        fixture.detectChanges();

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input).toBeTruthy();
        // Une fois visible, l'icône réapparaît aussi (même condition bugguée) : caractérisé tel quel.
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();

        tick(); // vidange le setTimeout qui donne le focus au champ ET la microtâche NgModel
        fixture.detectChanges();
        expect(input.value).toBe('Bob');
        expect(document.activeElement).toBe(input);
    }));

    it('émet filterValueChange à la saisie', fakeAsync(() => {
        (component as unknown as { displayFilter(): void }).displayFilter();
        fixture.detectChanges();
        tick();

        const emitted: string[] = [];
        component.filterValueChange.subscribe((v: string) => emitted.push(v));

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = 'Alice';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(emitted).toEqual(['Alice']);
    }));

    it('focusout (événement réel du template) masque le champ si filterValue est vide', fakeAsync(() => {
        (component as unknown as { displayFilter(): void }).displayFilter();
        fixture.detectChanges();
        tick();

        fixture.componentRef.setInput('filterValue', '');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    }));

    it('focusout garde le champ affiché si filterValue est renseigné', fakeAsync(() => {
        (component as unknown as { displayFilter(): void }).displayFilter();
        fixture.detectChanges();
        tick();

        fixture.componentRef.setInput('filterValue', 'Bob');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('input').dispatchEvent(new Event('focusout'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    }));
});
