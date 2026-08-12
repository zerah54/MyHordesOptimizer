import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UserPictoDTO } from '../../_abstract_model/dto/user-picto.dto';
import { UserPicto } from '../../_abstract_model/types/user-picto.class';
import { PictosListComponent } from './pictos-list.component';

function makePicto(overrides: Partial<UserPictoDTO>): UserPicto {
    const dto: UserPictoDTO = {
        id: 1,
        rare: false,
        count: 0,
        ...overrides
    };
    return new UserPicto(dto);
}

function tooltipMessage(fixture: ComponentFixture<PictosListComponent>): string {
    return fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip).message;
}

function tooltipClass(fixture: ComponentFixture<PictosListComponent>): string | string[] | Set<string> | { [key: string]: unknown } {
    return fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip).tooltipClass ?? '';
}

describe('PictosListComponent', (): void => {
    let fixture: ComponentFixture<PictosListComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [PictosListComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(PictosListComponent);
    });

    it('shows only the icon and the citizen count in town context, keeping totals in the tooltip', (): void => {
        fixture.componentRef.setInput('pictos', [makePicto({ count: 12, countInTown: 3, townTotalCount: 8 })]);
        fixture.componentRef.setInput('showTotal', true);
        fixture.detectChanges();

        const text: string = fixture.nativeElement.textContent;
        expect(text).toContain('×3');
        expect(text).not.toContain('Citoyen');
        expect(text).not.toContain('Total ville');

        const tooltip: string = tooltipMessage(fixture);
        expect(tooltip).toContain('Citoyen : 3');
        expect(tooltip).toContain('Total ville : 8');
        expect(tooltip).toContain('Total utilisateur : 12');
        expect(tooltipClass(fixture)).toBe('mho-multiline-tooltip');
    });

    it('shows the user total as not-imported instead of a misleading 0 when never imported', (): void => {
        fixture.componentRef.setInput('pictos', [makePicto({ count: null, countInTown: 3, townTotalCount: 8 })]);
        fixture.componentRef.setInput('showTotal', true);
        fixture.detectChanges();

        const tooltip: string = tooltipMessage(fixture);
        expect(tooltip).toContain('Citoyen : 3');
        expect(tooltip).toContain('Total ville : 8');
        expect(tooltip).not.toContain('Total utilisateur : 0');
        expect(tooltip).not.toContain('0 au total');
    });

    it('still shows the citizen count when zero, not just when truthy', (): void => {
        fixture.componentRef.setInput('pictos', [makePicto({ count: 12, countInTown: 0, townTotalCount: 0 })]);
        fixture.componentRef.setInput('showTotal', true);
        fixture.detectChanges();

        const text: string = fixture.nativeElement.textContent;
        expect(text).toContain('×0');

        const tooltip: string = tooltipMessage(fixture);
        expect(tooltip).toContain('Citoyen : 0');
        expect(tooltip).toContain('Total ville : 0');
    });

    it('falls back to the plain count when no town context is given', (): void => {
        fixture.componentRef.setInput('pictos', [makePicto({ count: 8, countInTown: null, townTotalCount: null })]);
        fixture.componentRef.setInput('showTotal', false);
        fixture.detectChanges();

        const text: string = fixture.nativeElement.textContent;
        expect(text).toContain('×8');
        expect(text).not.toContain('Citoyen');
        expect(text).not.toContain('Total ville');
        expect(text).not.toContain('Total utilisateur');
    });
});
