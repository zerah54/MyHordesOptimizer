import { ANIMATION_MODULE_TYPE, ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, UntypedFormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';

import { SelectComponent } from './select.component';

/** Hôte minimal : `[class]` posé sur la balise cohabite avec le binding de classe hôte du composant. */
@Component({
    imports: [SelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<mho-select [class]="panel_class" [options]="options"></mho-select>'
})
class SelectHostComponent {
    public panel_class: string = 'job-select';
    public options: string[] = ['Alpha', 'Beta'];
}

/** Hôte `ngModel` : relève ce que le select notifie au parent, sans aucune action de l'utilisateur tant qu'un test n'en fait pas. */
@Component({
    imports: [FormsModule, SelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<mho-select clearable [options]="options" [ngModel]="value()" (ngModelChange)="changes.push($event)" (filterChange)="filter_changes.push($event)"></mho-select>'
})
class SelectModelHostComponent {
    public readonly options: string[] = ['Alpha', 'Beta'];
    public readonly value: WritableSignal<string | undefined> = signal('Alpha');
    public readonly changes: (string | undefined)[] = [];
    public readonly filter_changes: (string | string[] | undefined)[] = [];
}

/** Valeurs limites acceptées par `coerceBooleanProperty` : `value != null && `${value}` !== 'false'`. */
const BOOLEAN_COERCION_CASES: [
    unknown,
    boolean
][] = [
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
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
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

        BOOLEAN_COERCION_CASES.forEach(([raw_value, expected]: [
            unknown,
            boolean
        ]): void => {
            fixture.componentRef.setInput('required', raw_value);

            expect(fixture.componentInstance.required, `required = ${JSON.stringify(raw_value)}`).toBe(expected);
        });
    });

    it('coerce les valeurs limites de `disabled` via coerceBooleanProperty', (): void => {
        const control: UntypedFormControl = new UntypedFormControl();
        fixture.componentRef.setInput('form_control', control);
        fixture.detectChanges();

        BOOLEAN_COERCION_CASES.forEach(([raw_value, expected]: [
            unknown,
            boolean
        ]): void => {
            fixture.componentRef.setInput('disabled', raw_value);

            expect(fixture.componentInstance.disabled, `disabled = ${JSON.stringify(raw_value)}`).toBe(expected);
            expect(control.disabled, `form_control désactivé pour disabled = ${JSON.stringify(raw_value)}`).toBe(expected);
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
        expect(emissions, 'après placeholder').toBe(1);

        fixture.componentRef.setInput('required', true);
        expect(emissions, 'après required').toBe(2);

        fixture.componentRef.setInput('disabled', true);
        expect(emissions, 'après disabled').toBe(3);
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

    describe('avec ngModel', (): void => {
        let host_fixture: ComponentFixture<SelectModelHostComponent>;

        /** Texte affiché par le déclencheur du `mat-select`, sans l'icône d'effacement. */
        function displayedValue(): string {
            return host_fixture.debugElement.query(By.css('mat-select-trigger span')).nativeElement.textContent.trim();
        }

        /** Laisse `ngModel` écrire sa valeur (de façon asynchrone) puis rafraîchit la vue. */
        async function settle(): Promise<void> {
            host_fixture.detectChanges();
            await host_fixture.whenStable();
            host_fixture.detectChanges();
        }

        beforeEach(async (): Promise<void> => {
            host_fixture = TestBed.createComponent(SelectModelHostComponent);
            await settle();
        });

        afterEach((): void => {
            host_fixture.destroy();
        });

        it('affiche la valeur du modèle sans notifier le parent', (): void => {
            expect(displayedValue()).toBe('Alpha');
            expect(host_fixture.componentInstance.changes).toEqual([]);
        });

        it('affiche une nouvelle valeur du modèle sans notifier le parent', async (): Promise<void> => {
            host_fixture.componentInstance.value.set('Beta');
            await settle();

            expect(displayedValue()).toBe('Beta');
            expect(host_fixture.componentInstance.changes).toEqual([]);
        });

        it('notifie le parent du choix de l\'utilisateur', async (): Promise<void> => {
            host_fixture.debugElement.query(By.css('.mat-mdc-select-trigger')).nativeElement.click();
            host_fixture.detectChanges();

            Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find((option: HTMLElement): boolean => option.textContent?.trim() === 'Beta')?.click();
            await settle();

            expect(host_fixture.componentInstance.changes).toEqual(['Beta']);
            expect(host_fixture.componentInstance.filter_changes.at(-1)).toBe('Beta');
            expect(displayedValue()).toBe('Beta');
        });

        it('notifie le parent de l\'effacement par l\'utilisateur', async (): Promise<void> => {
            host_fixture.debugElement.query(By.css('.mat-mdc-select-trigger mat-icon')).nativeElement.click();
            await settle();

            expect(host_fixture.componentInstance.changes).toEqual([undefined]);
        });

        it('garde `filterChange` à l\'écriture du modèle', async (): Promise<void> => {
            host_fixture.componentInstance.value.set('Beta');
            await settle();

            expect(host_fixture.componentInstance.filter_changes.at(-1)).toBe('Beta');
        });
    });
});
