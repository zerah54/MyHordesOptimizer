import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriStateCheckboxComponent } from './tri-state-checkbox.component';

@Component({
    selector: 'mho-tri-state-host',
    imports: [TriStateCheckboxComponent],
    template: '<mho-tri-state-checkbox [value]="value" (valueChange)="value = $event"/>'
})
class HostComponent {
    public value?: boolean | null = undefined;
}

describe('TriStateCheckboxComponent', (): void => {
    let fixture: ComponentFixture<HostComponent>;

    function input(): HTMLInputElement {
        return <HTMLInputElement>fixture.nativeElement.querySelector('input');
    }

    async function click(): Promise<void> {
        input().click();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    /** État visible de la case : ce que le style Material lit sur l'input natif. */
    function shown(): string {
        if (input().indeterminate) return 'indeterminate';
        return input().checked ? 'checked' : 'unchecked';
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    it('starts indeterminate when the value is unknown', (): void => {
        expect(shown()).toBe('indeterminate');
    });

    it('cycles indeterminate → unchecked → checked → indeterminate and shows each state', async (): Promise<void> => {
        const states: string[] = [];
        const values: (boolean | null | undefined)[] = [];
        for (let i: number = 0; i < 6; i++) {
            await click();
            values.push(fixture.componentInstance.value);
            states.push(shown());
        }

        expect(values).toEqual([false, true, undefined, false, true, undefined]);
        expect(states).toEqual(['unchecked', 'checked', 'indeterminate', 'unchecked', 'checked', 'indeterminate']);
    });

    it('treats null like an unknown value', async (): Promise<void> => {
        fixture.componentInstance.value = null;
        fixture.detectChanges();

        expect(shown()).toBe('indeterminate');
        await click();
        expect(fixture.componentInstance.value).toBe(false);
    });
});
