import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckbox } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { ExpeditionOrderDTO } from '../../../_abstract_model/dto/expedition-order.dto';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { ExpeditionOrderComponent } from './expedition-order.component';

const PLANK: Item = Object.assign(new Item(), { id: 7, img: 'item/plank.gif', label: { [moment.locale()]: 'Planche tordue' } });
const ALICE: Citizen = Object.assign(new Citizen(), { id: 42, name: 'Alice' });

function order(dto: Partial<ExpeditionOrderDTO>): ExpeditionOrder {
    return new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, ...dto });
}

function text(fixture: ComponentFixture<ExpeditionOrderComponent>, selector: string): string {
    const element: HTMLElement | null = fixture.nativeElement.querySelector(selector);
    return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('ExpeditionOrderComponent', (): void => {
    let fixture: ComponentFixture<ExpeditionOrderComponent>;

    function render(value: ExpeditionOrder, inputs: Record<string, unknown> = {}): void {
        fixture = TestBed.createComponent(ExpeditionOrderComponent);
        fixture.componentRef.setInput('order', value);
        fixture.componentRef.setInput('items', [PLANK]);
        fixture.componentRef.setInput('citizens', [ALICE]);
        Object.entries(inputs).forEach(([name, input]: [string, unknown]): void => fixture.componentRef.setInput(name, input));
        fixture.detectChanges();
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({ imports: [ExpeditionOrderComponent] }).compileComponents();
    });

    it('shows a typed order as its verb, its quantity and the item, with the item picture', (): void => {
        render(order({ kind: 'pick', itemId: PLANK.id, quantity: 2 }));

        expect(text(fixture, '.verb')).toBe('Ramasser');
        expect(text(fixture, '.text')).toBe('Ramasser ×2 Planche tordue');
        expect(fixture.nativeElement.querySelector('img.icon').getAttribute('src')).toBe(HORDES_IMG_REPO + PLANK.img);
        expect(fixture.nativeElement.querySelector('mat-icon.icon')).toBeNull();
    });

    it('names the citizen to wait for, or the group without a target', (): void => {
        render(order({ kind: 'wait', targetUserId: ALICE.id }));
        expect(text(fixture, '.text')).toContain('Alice');

        render(order({ kind: 'wait' }));
        expect(text(fixture, '.text')).toContain('le groupe');
    });

    it('shows the heroic action picture and label', (): void => {
        const heroic: HeroicActionEnum = HeroicActionEnum.HAS_RESCUE;
        render(order({ kind: 'hero', heroSkill: heroic.value.action }));

        expect(text(fixture, '.text')).toContain(heroic.getLabel());
        expect(fixture.nativeElement.querySelector('img.icon').getAttribute('src')).toBe(HORDES_IMG_REPO + heroic.value.img);
    });

    it('falls back to a pictogram for a kind without picture', (): void => {
        render(order({ kind: 'explore' }));

        expect(fixture.nativeElement.querySelector('mat-icon.icon')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('img.icon')).toBeNull();
    });

    it('renders a free text order as formatted text, without verb', (): void => {
        render(order({ type: 'text', text: '<b>Attention</b> aux zombies' }));

        expect(fixture.nativeElement.querySelector('.verb')).toBeNull();
        expect(fixture.nativeElement.querySelector('.text b').textContent).toBe('Attention');
        expect(fixture.nativeElement.querySelector('.bullet')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();
    });

    it('shows the cell relative to the town only when the town is known', (): void => {
        render(order({ kind: 'explore', x: 9, y: 4 }));
        expect(fixture.nativeElement.querySelector('.cell')).toBeNull();

        render(order({ kind: 'explore', x: 9, y: 4 }), { town: { x: 7, y: 7 } });
        expect(text(fixture, '.cell')).toBe('[2 ; 3]');
    });

    it('labels the checkbox with the order, and emits the new state only when checkable', (): void => {
        const emitted: boolean[] = [];
        render(order({ kind: 'pick', itemId: PLANK.id, quantity: 1 }), { checkable: true });
        fixture.componentInstance.doneChange.subscribe((done: boolean): void => {
            emitted.push(done);
        });
        const checkbox: MatCheckbox = fixture.debugElement.query(By.directive(MatCheckbox)).componentInstance;

        expect(checkbox.ariaLabel).toBe('Ramasser ×1 Planche tordue');
        expect(checkbox.disabled).toBe(false);
        fixture.nativeElement.querySelector('mat-checkbox input').click();
        expect(emitted).toEqual([true]);

        render(order({ kind: 'pick', itemId: PLANK.id, quantity: 1 }));
        expect(fixture.debugElement.query(By.directive(MatCheckbox)).componentInstance.disabled).toBe(true);
    });

    it('marks a done order and highlights the scope addressed to the user', (): void => {
        render(order({ kind: 'camp', isDone: true }), { scope: 'Moi', scopeIsMe: true });

        expect(fixture.nativeElement.querySelector('.order').classList).toContain('done');
        expect(fixture.nativeElement.querySelector('.scope').classList).toContain('me');
        expect(text(fixture, '.scope')).toBe('Moi');
    });
});
