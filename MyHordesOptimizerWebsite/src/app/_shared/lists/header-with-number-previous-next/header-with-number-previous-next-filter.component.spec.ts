import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { HeaderWithNumberPreviousNextFilterComponent } from './header-with-number-previous-next-filter.component';

describe('HeaderWithNumberPreviousNextFilterComponent', () => {
    let fixture: ComponentFixture<HeaderWithNumberPreviousNextFilterComponent>;
    let component: HeaderWithNumberPreviousNextFilterComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithNumberPreviousNextFilterComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderWithNumberPreviousNextFilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('header', 'Jour');
        fixture.componentRef.setInput('min', 1);
        fixture.componentRef.setInput('max', 5);
    });

    it('ngOnInit masque le filtre (icône visible) si filterValue est null/undefined', () => {
        fixture.componentRef.setInput('filterValue', null);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('ngOnInit affiche directement le filtre avec la valeur si filterValue est renseigné', fakeAsync(() => {
        fixture.componentRef.setInput('filterValue', 3);
        fixture.detectChanges();
        tick(); // vidange la microtâche interne de NgModel qui pousse la valeur vers le DOM

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(input).toBeTruthy();
        expect(input.value).toBe('3');
    }));

    it('caractérise un bug hérité : #filter est absent du template (seul cet input matInput n\'a pas de référence #filter, contrairement aux 3 composants jumeaux) — le setTimeout de focus lève NG0951 dès qu\'on ouvre le filtre', fakeAsync(() => {
        fixture.componentRef.setInput('filterValue', null);
        fixture.detectChanges();

        const icon: HTMLElement = fixture.nativeElement.querySelector('.open-menu-icon');
        icon.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
        expect(() => tick()).toThrow(); // NG0951 : `viewChild.required('filter')` ne résout jamais
    }));

    it('les boutons précédent/suivant émettent filterValueChange et se désactivent aux bornes', () => {
        fixture.componentRef.setInput('filterValue', 1);
        fixture.detectChanges();

        const emitted: number[] = [];
        component.filterValueChange.subscribe((v: number) => emitted.push(v));

        const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
        expect(buttons[0].disabled).toBeTrue(); // "précédent" désactivé à min
        expect(buttons[1].disabled).toBeFalse();

        buttons[1].click();
        expect(emitted).toEqual([2]);
    });

    it('les boutons premier/dernier n\'apparaissent que si displayFirstLast est actif et émettent min()/max()', () => {
        fixture.componentRef.setInput('filterValue', 3);
        fixture.componentRef.setInput('displayFirstLast', true);
        fixture.detectChanges();

        const emitted: number[] = [];
        component.filterValueChange.subscribe((v: number) => emitted.push(v));

        const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
        expect(buttons.length).toBe(4);

        buttons[0].click(); // first_page
        buttons[3].click(); // last_page
        expect(emitted).toEqual([1, 5]);
    });

    it('la saisie directe dans le champ émet filterValueChange', () => {
        fixture.componentRef.setInput('filterValue', 3);
        fixture.detectChanges();

        const emitted: number[] = [];
        component.filterValueChange.subscribe((v: number) => emitted.push(v));

        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.value = '4';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(emitted).toEqual([4]);
    });
});
