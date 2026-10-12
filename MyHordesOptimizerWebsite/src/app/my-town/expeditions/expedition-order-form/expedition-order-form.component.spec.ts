import { ANIMATION_MODULE_TYPE, Signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';

import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { Property } from '../../../_abstract_model/enum/property.enum';
import { ExpeditionOrderKind, ExpeditionOrderType } from '../../../_abstract_model/types/_types';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { ExpeditionOrderFormComponent, ExpeditionOrderFormData, ExpeditionOrderFormKind, ExpeditionOrderFormResult } from './expedition-order-form.component';

interface KindOption {
    readonly kind: ExpeditionOrderFormKind;
}

/** Accès aux membres protégés du formulaire. */
interface TestableForm {
    readonly kinds: Signal<readonly KindOption[]>;
    readonly heroics: readonly HeroicActionEnum[];
    readonly consumables: Item[];
    readonly valid: Signal<boolean>;
    readonly kind: WritableSignal<ExpeditionOrderFormKind>;
    readonly type: WritableSignal<ExpeditionOrderType>;
    readonly text: WritableSignal<string>;
    readonly item_id: WritableSignal<number | null>;
    readonly quantity: WritableSignal<number>;
    readonly hero_skill: WritableSignal<string | null>;
    readonly target_user_id: WritableSignal<number | null>;
    readonly owner_id: WritableSignal<number | null>;
    readonly cell_key: WritableSignal<string>;
    changeKind(change: { value: ExpeditionOrderFormKind }): void;
    changeOwner(owner_id: number | null): void;
    changeQuantity(value: number | string | null): void;
    save(): void;
    remove(): void;
}

const WATER: Item = Object.assign(new Item(), { id: 1, img: 'water.gif', label: { [moment.locale()]: 'Eau' }, properties: [Property.IS_WATER], actions: [] });
const PLANK: Item = Object.assign(new Item(), { id: 2, img: 'plank.gif', label: { [moment.locale()]: 'Planche' }, properties: [], actions: [] });

function data(overrides: Partial<ExpeditionOrderFormData> = {}): ExpeditionOrderFormData {
    return {
        cell: { x: 5, y: 6 },
        cell_label: '[1 ; 1]',
        can_clear: false,
        can_explore: false,
        can_excavate: false,
        move_targets: [],
        members: [
            { id: 10, user_id: 42, label: 'Alice', is_scavenger: false },
            { id: 11, user_id: null, label: 'Place 2', is_scavenger: false },
            { id: 12, user_id: 43, label: 'Fouine', is_scavenger: true }
        ],
        items: [WATER, PLANK],
        order: null,
        owner_id: null,
        ...overrides
    };
}

function typedOrder(kind: ExpeditionOrderKind, extra: Partial<ExpeditionOrder> = {}): ExpeditionOrder {
    return Object.assign(new ExpeditionOrder({ id: 3, type: 'checkbox', text: '', isDone: true, position: 4, x: 5, y: 6, kind }), extra);
}

describe('ExpeditionOrderFormComponent', (): void => {
    let fixture: ComponentFixture<ExpeditionOrderFormComponent>;
    let form: TestableForm;
    let close: ReturnType<typeof vi.fn>;

    function create(value: ExpeditionOrderFormData): void {
        close = vi.fn();
        TestBed.configureTestingModule({
            imports: [ExpeditionOrderFormComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: value },
                { provide: MatDialogRef, useValue: { close } }
            ]
        });
        fixture = TestBed.createComponent(ExpeditionOrderFormComponent);
        form = fixture.componentInstance as unknown as TestableForm;
    }

    function result(): ExpeditionOrderFormResult {
        expect(close).toHaveBeenCalledTimes(1);
        return close.mock.calls[0][0];
    }

    function savedOrder(): ExpeditionOrder {
        const closed: ExpeditionOrderFormResult = result();
        if (closed.action !== 'save') throw new Error('save attendu');
        return closed.order;
    }

    it('offers clearing and exploring only where the cell allows it, after text', (): void => {
        create(data());
        expect(form.kinds().map((option: KindOption): string => option.kind)).toEqual(['text', 'pick', 'drop', 'use', 'camp', 'hero', 'wait']);

        TestBed.resetTestingModule();
        create(data({ can_clear: true, can_explore: true }));
        expect(form.kinds().map((option: KindOption): string => option.kind)).toEqual(['text', 'pick', 'drop', 'use', 'clear', 'explore', 'camp', 'hero', 'wait']);
    });

    it('offers excavating only to a scavenger place on a cell not yet excavated, before camping', (): void => {
        create(data({ can_excavate: true }));
        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'excavate')).toBe(false);

        form.changeOwner(10);
        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'excavate')).toBe(false);

        form.changeOwner(12);
        expect(form.kinds().map((option: KindOption): string => option.kind)).toEqual(['text', 'pick', 'drop', 'use', 'excavate', 'camp', 'hero', 'wait']);

        form.changeOwner(null);
        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'excavate')).toBe(false);
    });

    it('hides excavating on an excavated cell, even for a scavenger', (): void => {
        create(data({ can_excavate: false, owner_id: 12 }));

        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'excavate')).toBe(false);
    });

    it('keeps excavating on an existing excavate order whatever the place or the cell', (): void => {
        create(data({ can_excavate: false, order: typedOrder('excavate'), owner_id: 10 }));

        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'excavate')).toBe(true);
        expect(form.kind()).toBe('excavate');
    });

    it('falls back to text when the place changes to one that cannot excavate', (): void => {
        create(data({ can_excavate: true, owner_id: 12 }));
        form.changeKind({ value: 'excavate' });

        form.changeOwner(10);

        expect(form.kind()).toBe('text');
    });

    it('keeps the selected kind when the place changes to another that allows it', (): void => {
        create(data({ can_excavate: true, owner_id: 12 }));
        form.changeKind({ value: 'excavate' });

        form.changeOwner(12);

        expect(form.kind()).toBe('excavate');
    });

    it('returns an excavate order without parameters', (): void => {
        create(data({ can_excavate: true, owner_id: 12 }));
        form.changeKind({ value: 'excavate' });
        expect(form.valid()).toBe(true);

        form.save();

        expect(result()).toEqual(expect.objectContaining({ action: 'save', owner_id: 12 }));
        expect(savedOrder()).toEqual(expect.objectContaining({ kind: 'excavate', item_id: null, quantity: null, hero_skill: null, target_user_id: null }));
    });

    it('asks for the place before the kind, with no hint about building actions', (): void => {
        create(data({ order: typedOrder('wait') }));
        fixture.detectChanges();

        const owner: HTMLElement = fixture.nativeElement.querySelector('.owner');
        const kinds: HTMLElement = fixture.nativeElement.querySelector('.kinds');
        expect(owner.compareDocumentPosition(kinds) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.hint')).toBeNull();
    });

    it('keeps the kind of an existing order even when the cell no longer allows it', (): void => {
        create(data({ order: typedOrder('clear', { quantity: 2 }) }));

        expect(form.kinds().some((option: KindOption): boolean => option.kind === 'clear')).toBe(true);
        expect(form.kind()).toBe('clear');
        expect(form.quantity()).toBe(2);
    });

    it('proposes only consumables to use, and drops a non consumable item when switching to it', (): void => {
        create(data());
        expect(form.consumables.map((item: Item): number => item.id)).toEqual([WATER.id]);

        form.changeKind({ value: 'pick' });
        form.item_id.set(PLANK.id);
        form.changeKind({ value: 'use' });

        expect(form.item_id()).toBeNull();
    });

    it('only offers heroic actions counted in the daily ones and bound to an action', (): void => {
        create(data());

        expect(form.heroics.length).toBeGreaterThan(0);
        expect(form.heroics.every((heroic: HeroicActionEnum): boolean => heroic.value.count_in_daily && heroic.value.action !== '')).toBe(true);
    });

    it('validates the parameters each kind needs', (): void => {
        create(data());
        expect(form.valid()).toBe(false);
        form.text.set('<p> </p>');
        expect(form.valid()).toBe(false);
        form.text.set('<p>Prendre la clé</p>');
        expect(form.valid()).toBe(true);

        form.changeKind({ value: 'drop' });
        expect(form.valid()).toBe(false);
        form.item_id.set(PLANK.id);
        expect(form.valid()).toBe(true);
        form.changeQuantity('0');
        expect(form.valid()).toBe(false);
        form.changeQuantity('100');
        expect(form.valid()).toBe(false);
        form.changeQuantity('abc');
        expect(form.quantity()).toBe(0);
        form.changeQuantity('3.7');
        expect(form.quantity()).toBe(3);
        expect(form.valid()).toBe(true);

        form.changeKind({ value: 'hero' });
        expect(form.valid()).toBe(false);
        form.hero_skill.set(HeroicActionEnum.HAS_RESCUE.value.action);
        expect(form.valid()).toBe(true);

        form.changeKind({ value: 'camp' });
        expect(form.valid()).toBe(true);
    });

    it('does not close while invalid', (): void => {
        create(data());

        form.save();

        expect(close).not.toHaveBeenCalled();
    });

    it('returns a new typed order on the cell, without the parameters of other kinds', (): void => {
        create(data());
        form.text.set('ignoré');
        form.target_user_id.set(42);
        form.hero_skill.set('ignoré');
        form.changeKind({ value: 'pick' });
        form.item_id.set(PLANK.id);
        form.changeQuantity(2);
        form.owner_id.set(10);

        form.save();

        const closed: ExpeditionOrderFormResult = result();
        expect(closed).toEqual(expect.objectContaining({ action: 'save', owner_id: 10 }));
        const order: ExpeditionOrder = savedOrder();
        expect(order.id).toBeUndefined();
        expect(order).toEqual(expect.objectContaining({
            type: 'checkbox', text: '', is_done: false, position: 0, x: 5, y: 6,
            kind: 'pick', item_id: PLANK.id, quantity: 2, hero_skill: null, target_user_id: null
        }));
    });

    it('returns a free text order with its form', (): void => {
        create(data());
        form.text.set('<p>Info</p>');
        form.type.set('text');

        form.save();

        expect(savedOrder()).toEqual(expect.objectContaining({ type: 'text', text: '<p>Info</p>', kind: null, item_id: null, quantity: null }));
    });

    it('edits a copy of the order, keeping its identity, state and position', (): void => {
        const original: ExpeditionOrder = typedOrder('wait', { target_user_id: 42 });
        create(data({ order: original, owner_id: 10 }));
        expect(form.target_user_id()).toBe(42);
        expect(form.owner_id()).toBe(10);

        form.target_user_id.set(null);
        form.save();

        const order: ExpeditionOrder = savedOrder();
        expect(order).not.toBe(original);
        expect(order).toEqual(expect.objectContaining({ id: 3, is_done: true, position: 4, kind: 'wait', target_user_id: null }));
        expect(original.target_user_id).toBe(42);
    });

    it('moves the order to another cell of the route', (): void => {
        create(data({
            order: typedOrder('camp'),
            move_targets: [{ cell: { x: 6, y: 6 }, label: '[2 ; 1]' }, { cell: { x: 7, y: 6 }, label: '[3 ; 1]' }]
        }));
        expect(form.cell_key()).toBe('5,6');

        form.cell_key.set('7,6');
        form.save();

        expect(savedOrder()).toEqual(expect.objectContaining({ x: 7, y: 6 }));
    });

    it('closes with a deletion request', (): void => {
        create(data({ order: typedOrder('camp') }));

        form.remove();

        expect(result()).toEqual({ action: 'delete' });
    });

    it('renders the kinds and the delete button of an existing order', (): void => {
        create(data({ order: typedOrder('camp') }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('mat-button-toggle').length).toBe(form.kinds().length);
        expect(fixture.nativeElement.querySelector('button.delete')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('h2').textContent).toContain('[1 ; 1]');
    });
});
