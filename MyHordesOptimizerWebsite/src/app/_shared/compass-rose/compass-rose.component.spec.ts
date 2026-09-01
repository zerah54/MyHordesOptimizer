import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Dictionary } from '../../_abstract_model/types/_types';
import { CompassRoseComponent } from './compass-rose.component';

const ALL_DIRECTIONS: string[] = [
    'Norden', 'Süden', 'Osten', 'Westen',
    'Nordosten', 'Nordwesten', 'Südosten', 'Südwesten'
];

function zone(selected: string[]): Dictionary<boolean> {
    const dict: Dictionary<boolean> = {};
    ALL_DIRECTIONS.forEach((direction: string): void => { dict[direction] = selected.includes(direction); });
    return dict;
}

function pointer(fixture: ComponentFixture<CompassRoseComponent>, cssClass: string): HTMLElement {
    return fixture.debugElement.query(By.css(`.${cssClass}`)).nativeElement;
}

function captureEmission(fixture: ComponentFixture<CompassRoseComponent>): { value: Dictionary<boolean> | undefined } {
    const captured: { value: Dictionary<boolean> | undefined } = { value: undefined };
    fixture.componentInstance.selectedScrutZoneChange.subscribe((value: Dictionary<boolean>): void => { captured.value = value; });
    return captured;
}

describe('CompassRoseComponent', (): void => {
    let fixture: ComponentFixture<CompassRoseComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CompassRoseComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(CompassRoseComponent);
    });

    it('does not show the N/E/O/S legend by default', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.north-label')).toBeNull();
    });

    it('shows the N/E/O/S legend when withLegend is true', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.componentRef.setInput('withLegend', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.north-label').textContent.trim()).toBe('N');
        expect(fixture.nativeElement.querySelector('.east-label').textContent.trim()).toBe('E');
        expect(fixture.nativeElement.querySelector('.west-label').textContent.trim()).toBe('O');
        expect(fixture.nativeElement.querySelector('.south-label').textContent.trim()).toBe('S');
    });

    it('applies the selected class to a cardinal pointer whose direction is selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(['Norden']));
        fixture.detectChanges();

        expect(pointer(fixture, 'north-pointer').classList.contains('selected')).toBe(true);
        expect(pointer(fixture, 'south-pointer').classList.contains('selected')).toBe(false);
    });

    it('applies the selected class to an ordinal pointer whose direction is selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(['Nordosten']));
        fixture.detectChanges();

        expect(pointer(fixture, 'northeast-pointer').classList.contains('selected')).toBe(true);
        expect(pointer(fixture, 'northwest-pointer').classList.contains('selected')).toBe(false);
    });

    it('applies the all-selected class to the center button when every direction is selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(ALL_DIRECTIONS));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.bt-center').classList.contains('all-selected')).toBe(true);
    });

    it('does not apply the all-selected class when at least one direction is not selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(ALL_DIRECTIONS.slice(1)));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.bt-center').classList.contains('all-selected')).toBe(false);
    });

    it('single-select mode: clicking a cardinal pointer emits only that direction as selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(['Süden']));
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'north-pointer').click();

        expect(captured.value).toEqual({ Norden: true });
    });

    it('multiple mode: clicking an unselected cardinal pointer toggles it on while keeping the others', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(['Süden']));
        fixture.componentRef.setInput('multiple', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'north-pointer').click();

        expect(captured.value?.['Norden']).toBe(true);
        expect(captured.value?.['Süden']).toBe(true);
    });

    it('multiple mode: clicking a selected cardinal pointer toggles it off', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(['Norden', 'Süden']));
        fixture.componentRef.setInput('multiple', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'north-pointer').click();

        expect(captured.value?.['Norden']).toBe(false);
        expect(captured.value?.['Süden']).toBe(true);
    });

    it('readonly mode: clicking a cardinal pointer emits nothing', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.componentRef.setInput('readonly', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'north-pointer').click();

        expect(captured.value).toBeUndefined();
    });

    it('without withDiags, clicking an ordinal pointer emits nothing', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.componentRef.setInput('multiple', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'northeast-pointer').click();

        expect(captured.value).toBeUndefined();
    });

    it('with withDiags, clicking an ordinal pointer emits its toggled direction', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.componentRef.setInput('withDiags', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        pointer(fixture, 'northeast-pointer').click();

        expect(captured.value).toEqual({ Nordosten: true });
    });

    it('clicking the center button without multiple+withDiags emits nothing', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        fixture.nativeElement.querySelector('.bt-center').click();

        expect(captured.value).toBeUndefined();
    });

    it('clicking the center button with multiple+withDiags selects every direction when not all are selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone([]));
        fixture.componentRef.setInput('multiple', true);
        fixture.componentRef.setInput('withDiags', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        fixture.nativeElement.querySelector('.bt-center').click();

        ALL_DIRECTIONS.forEach((direction: string): void => { expect(captured.value?.[direction]).toBe(true); });
    });

    it('clicking the center button with multiple+withDiags deselects every direction when all are selected', (): void => {
        fixture.componentRef.setInput('selectedScrutZone', zone(ALL_DIRECTIONS));
        fixture.componentRef.setInput('multiple', true);
        fixture.componentRef.setInput('withDiags', true);
        fixture.detectChanges();
        const captured = captureEmission(fixture);

        fixture.nativeElement.querySelector('.bt-center').click();

        ALL_DIRECTIONS.forEach((direction: string): void => { expect(captured.value?.[direction]).toBe(false); });
    });
});
