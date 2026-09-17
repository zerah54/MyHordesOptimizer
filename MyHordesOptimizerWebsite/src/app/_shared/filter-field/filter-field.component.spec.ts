import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { FilterFieldComponent } from './filter-field.component';

function typeInFilter(fixture: ComponentFixture<FilterFieldComponent>, text: string): void {
    const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
}

describe('FilterFieldComponent', (): void => {
    let fixture: ComponentFixture<FilterFieldComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [FilterFieldComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(FilterFieldComponent);
    });

    it('shows the "Filtrer" label', (): void => {
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('mat-label')).nativeElement.textContent.trim()).toBe('Filtrer');
    });

    it('starts with an empty input', (): void => {
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.value).toBe('');
    });

    it('emits filterChange with the typed value', (): void => {
        fixture.detectChanges();
        let emitted: string | undefined;
        fixture.componentInstance.filterChange.subscribe((value: string): void => { emitted = value; });

        typeInFilter(fixture, 'abc');

        expect(emitted).toBe('abc');
    });

    // NgModel._updateValue() écrit la valeur DOM dans une micro-tâche (resolvedPromise.then()),
    // pas synchrone à l'intérieur de detectChanges() : sans la vidanger ici, elle reste en
    // attente et s'exécute pendant l'événement de frappe suivant, écrasant la saisie avec
    // l'ancienne valeur (vue au moment de ce premier detectChanges).
    it('keeps the typed text visible after the change detection pass that follows the keystroke', async (): Promise<void> => {
        fixture.detectChanges();
        await Promise.resolve();

        typeInFilter(fixture, 'abc');

        expect(fixture.debugElement.query(By.css('input')).nativeElement.value).toBe('abc');
    });

    it('emits again on each subsequent keystroke, without debounce', (): void => {
        fixture.detectChanges();
        const emissions: string[] = [];
        fixture.componentInstance.filterChange.subscribe((value: string): void => { emissions.push(value); });

        typeInFilter(fixture, 'a');
        typeInFilter(fixture, 'ab');

        expect(emissions).toEqual(['a', 'ab']);
    });
});
