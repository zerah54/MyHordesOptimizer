import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SelectComponent } from './select.component';

/** Hôte minimal : `[class]` posé sur la balise cohabite avec le binding de classe hôte du composant. */
@Component({
    imports: [SelectComponent],
    template: '<mho-select [class]="panel_class" [options]="options"></mho-select>'
})
class SelectHostComponent {
    public panel_class: string = 'job-select';
    public options: string[] = ['Alpha', 'Beta'];
}

/** Valeurs limites acceptées par `coerceBooleanProperty` : `value != null && `${value}` !== 'false'`. */
const BOOLEAN_COERCION_CASES: [unknown, boolean][] = [
    [true, true],
    [false, false],
    ['', true],
    ['false', false],
    ['true', true],
    [null, false],
    [undefined, false]
];

/** Ouvre le panneau du `mat-select` en cliquant sur son déclencheur. */
function openPanel(fixture: ComponentFixture<SelectComponent<string>>): void {
    fixture.debugElement.query(By.css('.mat-mdc-select-trigger')).nativeElement.click();
    fixture.detectChanges();
}

/** Libellés des options réellement rendues dans l'overlay du panneau. */
function renderedOptions(): string[] {
    return Array.from(document.querySelectorAll('mat-option'))
        .map((option: Element) => (<HTMLElement>option).textContent?.trim() ?? '');
}

/** Saisit une recherche dans le champ de filtre du panneau. */
function typeSearch(fixture: ComponentFixture<SelectComponent<string>>, text: string): void {
    const search: HTMLInputElement = <HTMLInputElement>document.querySelector('.mho-search');
    search.value = text;
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
}

describe('SelectComponent', (): void => {
    let fixture: ComponentFixture<SelectComponent<string>>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [SelectComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();
        fixture = TestBed.createComponent<SelectComponent<string>>(SelectComponent);
    });

    afterEach((): void => {
        fixture.destroy();
    });

    it('rend une option par élément de `options`', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta', 'Gamma']);
        fixture.detectChanges();

        openPanel(fixture);

        expect(renderedOptions()).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('ne rend aucune option quand `options` n\'est pas fourni', (): void => {
        fixture.detectChanges();

        openPanel(fixture);

        expect(renderedOptions()).toEqual([]);
    });

    it('ajoute l\'option vide `--` quand `emptyOption` est actif', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta']);
        fixture.componentRef.setInput('emptyOption', true);
        fixture.detectChanges();

        openPanel(fixture);

        expect(renderedOptions()).toEqual(['--', 'Alpha', 'Beta']);
    });

    it('n\'affiche le champ de recherche que si `searchable` est actif', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta']);
        fixture.detectChanges();
        openPanel(fixture);

        expect(document.querySelector('.mho-search')).toBeNull();
    });

    it('restreint les options affichées à la saisie de recherche', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta', 'Gamma']);
        fixture.componentRef.setInput('searchable', true);
        fixture.detectChanges();
        openPanel(fixture);

        typeSearch(fixture, 'be');

        expect(renderedOptions()).toEqual(['Beta']);
    });

    it('réinitialise les options affichées quand `options` change après un filtrage', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta', 'Gamma']);
        fixture.componentRef.setInput('searchable', true);
        fixture.detectChanges();
        openPanel(fixture);
        typeSearch(fixture, 'be');

        fixture.componentRef.setInput('options', ['Delta', 'Epsilon']);
        fixture.detectChanges();

        expect(renderedOptions()).toEqual(['Delta', 'Epsilon']);
    });

    it('transmet `placeholder` au `mat-select` sous-jacent', (): void => {
        fixture.componentRef.setInput('placeholder', 'Choisir un élément');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MatSelect)).componentInstance.placeholder).toBe('Choisir un élément');
    });

    it('désactive le `form_control` fourni quand `disabled` est vrai', (): void => {
        const control: UntypedFormControl = new UntypedFormControl();
        fixture.componentRef.setInput('form_control', control);
        fixture.detectChanges();

        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();

        expect(control.disabled).toBe(true);
    });

    it('réactive le `form_control` fourni quand `disabled` repasse à faux', (): void => {
        const control: UntypedFormControl = new UntypedFormControl();
        fixture.componentRef.setInput('form_control', control);
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();

        fixture.componentRef.setInput('disabled', false);
        fixture.detectChanges();

        expect(control.disabled).toBe(false);
    });

    it('`required` vaut false tant que l\'entrée n\'est pas fournie', (): void => {
        fixture.detectChanges();

        expect(fixture.componentInstance.required).toBe(false);
    });

    it('coerce les valeurs limites de `required` via coerceBooleanProperty', (): void => {
        fixture.detectChanges();

        BOOLEAN_COERCION_CASES.forEach(([raw_value, expected]: [unknown, boolean]): void => {
            fixture.componentRef.setInput('required', raw_value);

            expect(fixture.componentInstance.required)
                .withContext(`required = ${JSON.stringify(raw_value)}`).toBe(expected);
        });
    });

    it('coerce les valeurs limites de `disabled` via coerceBooleanProperty', (): void => {
        const control: UntypedFormControl = new UntypedFormControl();
        fixture.componentRef.setInput('form_control', control);
        fixture.detectChanges();

        BOOLEAN_COERCION_CASES.forEach(([raw_value, expected]: [unknown, boolean]): void => {
            fixture.componentRef.setInput('disabled', raw_value);

            expect(fixture.componentInstance.disabled)
                .withContext(`disabled = ${JSON.stringify(raw_value)}`).toBe(expected);
            expect(control.disabled)
                .withContext(`form_control désactivé pour disabled = ${JSON.stringify(raw_value)}`).toBe(expected);
        });
    });

    it('expose `userAriaDescribedBy` : indéfini par défaut, reflété quand il est fourni', (): void => {
        fixture.detectChanges();
        expect(fixture.componentInstance.userAriaDescribedBy).toBeUndefined();

        fixture.componentRef.setInput('userAriaDescribedBy', 'hint-1 hint-2');
        fixture.detectChanges();

        expect(fixture.componentInstance.userAriaDescribedBy).toBe('hint-1 hint-2');
    });

    it('émet sur `stateChanges` à chaque changement de `placeholder`, `required` ou `disabled`', (): void => {
        let emissions: number = 0;
        fixture.componentInstance.stateChanges.subscribe((): void => {
            emissions++;
        });

        fixture.componentRef.setInput('placeholder', 'Choisir');
        expect(emissions).withContext('après placeholder').toBe(1);

        fixture.componentRef.setInput('required', true);
        expect(emissions).withContext('après required').toBe(2);

        fixture.componentRef.setInput('disabled', true);
        expect(emissions).withContext('après disabled').toBe(3);
    });

    it('n\'émet pas sur `stateChanges` pour `userAriaDescribedBy`, qui n\'a pas de setter', (): void => {
        let emissions: number = 0;
        fixture.componentInstance.stateChanges.subscribe((): void => {
            emissions++;
        });

        fixture.componentRef.setInput('userAriaDescribedBy', 'hint-1');

        expect(emissions).toBe(0);
    });

    it('n\'applique jamais la classe hôte `floating`, même quand une valeur est sélectionnée', (): void => {
        fixture.componentRef.setInput('options', ['Alpha', 'Beta']);
        fixture.detectChanges();
        expect(fixture.nativeElement.classList.contains('floating')).toBe(false);

        fixture.componentInstance.writeValue('Alpha');
        fixture.detectChanges();

        expect(fixture.componentInstance.shouldLabelFloat).toBe(true);
        expect(fixture.nativeElement.classList.contains('floating')).toBe(false);
    });

    it('transmet `[class]` posé sur la balise au `panelClass` sans polluer les classes de l\'hôte', (): void => {
        const host_fixture: ComponentFixture<SelectHostComponent> = TestBed.createComponent(SelectHostComponent);
        host_fixture.detectChanges();

        const select_host: HTMLElement = host_fixture.debugElement.query(By.directive(SelectComponent)).nativeElement;
        expect(host_fixture.debugElement.query(By.directive(MatSelect)).componentInstance.panelClass).toBe('job-select');
        expect(select_host.classList.contains('floating')).toBe(false);

        host_fixture.destroy();
    });
});
