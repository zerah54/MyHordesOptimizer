import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CompactStepperComponent } from './compact-stepper.component';

describe('CompactStepperComponent', (): void => {
    let fixture: ComponentFixture<CompactStepperComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CompactStepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CompactStepperComponent);
    });

    it('renders the icon image when one is provided', (): void => {
        fixture.componentRef.setInput('icon', 'item/item_bplan_c.gif');
        fixture.componentRef.setInput('label', 'Plan');
        fixture.componentRef.setInput('value', 0);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img.stepper-icon'))).not.toBeNull();
    });

    it('omits the icon image when none is provided', (): void => {
        fixture.componentRef.setInput('label', 'Plan');
        fixture.componentRef.setInput('value', 0);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img.stepper-icon'))).toBeNull();
    });
});
