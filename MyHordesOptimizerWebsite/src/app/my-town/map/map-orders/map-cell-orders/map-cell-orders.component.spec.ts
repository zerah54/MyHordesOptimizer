import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../../_abstract_model/types/expedition-part.class';
import { Me } from '../../../../_abstract_model/types/me.class';
import { setUser } from '../../../../_core/utilities/localstorage.util';
import { ExpeditionOrderEditorService } from '../../../expeditions/expedition-orders/expedition-order-editor.service';
import { CellOrderEntry } from '../map-cell-orders';
import { DayExpeditionsStoreStub, provideMapOrdersTesting } from '../map-orders.testing';
import { MapCellOrdersComponent } from './map-cell-orders.component';

const ME: number = 7;
const CITIZENS: Citizen[] = [Object.assign(new Citizen(), { id: ME, name: 'Zerah' }), Object.assign(new Citizen(), { id: 8, name: 'Brindille' })];
/** Le tracé de la partie 10 passe par (3, 4) ; celui de la partie 31 non. */
const NORTH: ExpeditionPartRoute = { id: 5, label: 'Nord', color: 'blue', cells: [{ x: 3, y: 3 }, { x: 3, y: 4 }], length: 1, version: 0 };
const WEST: ExpeditionPartRoute = { id: 6, label: 'Ouest', color: 'teal', cells: [{ x: 3, y: 3 }, { x: 2, y: 3 }], length: 1, version: 0 };

function order(id: number, text: string, x: number = 3, y: number = 4): ExpeditionOrder {
    return new ExpeditionOrder({ id, type: 'checkbox', text, isDone: false, position: 0, x, y });
}

function part(id: number, orders: ExpeditionOrder[], citizens: CitizenExpedition[], route: ExpeditionPartRoute | null): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { id, position: 0, orders, citizens, map_route_id: route?.id ?? null, map_route: route });
}

/** Expédition 1 (la mienne, tracé Ouest qui ne passe pas par la case) ; expédition 2 (tracé Nord, qui y passe). */
function day(): Expedition[] {
    const mine: ExpeditionPart = part(31, [order(1, 'Tous')], [
        Object.assign(new CitizenExpedition(), { id: 20, citizen_id: ME, orders: [order(2, 'Moi')] }),
        Object.assign(new CitizenExpedition(), { id: 21, citizen_id: 8, orders: [order(3, 'Pour Brindille')] })
    ], WEST);
    const other: ExpeditionPart = part(10, [order(4, 'Autre')], [], NORTH);
    return [
        Object.assign(new Expedition(), { id: 1, label: 'Expé 1', position: 0, parts: [mine] }),
        Object.assign(new Expedition(), { id: 2, label: 'Camping', position: 1, parts: [other] })
    ];
}

function text(element: Element | null): string {
    return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('MapCellOrdersComponent', (): void => {
    let fixture: ComponentFixture<MapCellOrdersComponent>;
    let store: DayExpeditionsStoreStub;
    let editor: { edit: ReturnType<typeof vi.fn>; toggleDone: ReturnType<typeof vi.fn> };

    beforeEach((): void => {
        setUser(Object.assign(new Me(), { id: ME }));
        store = new DayExpeditionsStoreStub();
        store.set(day());
        editor = { edit: vi.fn().mockResolvedValue(undefined), toggleDone: vi.fn().mockResolvedValue(undefined) };
        TestBed.configureTestingModule({
            imports: [MapCellOrdersComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                ...provideMapOrdersTesting(store),
                { provide: ExpeditionOrderEditorService, useValue: editor }
            ]
        });
    });

    afterEach((): void => {
        setUser(null);
    });

    function render(inputs: Record<string, unknown>): void {
        fixture = TestBed.createComponent(MapCellOrdersComponent);
        fixture.componentRef.setInput('citizens', CITIZENS);
        Object.entries(inputs).forEach(([name, value]: [string, unknown]): void => fixture.componentRef.setInput(name, value));
        fixture.detectChanges();
    }

    describe('in the tooltip', (): void => {
        it('shows the orders addressed to the user, then sums up the others', (): void => {
            render({ cell: { x: 3, y: 4 } });

            expect(text(fixture.nativeElement.querySelector('.group-head .label'))).toBe('Expé 1 « Ouest »');
            expect(text(fixture.nativeElement.querySelector('.group-head .count'))).toBe('2');
            const orders: string[] = Array.from<Element>(fixture.nativeElement.querySelectorAll('mho-expedition-order .text')).map(text);
            expect(orders).toEqual(['Tous', 'Moi']);
            expect(text(fixture.nativeElement.querySelector('mho-expedition-order .scope.me'))).toBe('Moi');
            expect(text(fixture.nativeElement.querySelector('.others-summary span'))).toBe('+ 2 autres : Brindille, Camping « Nord »');
            // Infobulle : l'état des cases à cocher, sans action.
            expect((fixture.nativeElement.querySelector('mat-checkbox input') as HTMLInputElement).disabled).toBe(true);
        });

        it('sums up all the orders when none is addressed to the user', (): void => {
            setUser(Object.assign(new Me(), { id: 99 }));
            render({ cell: { x: 3, y: 4 } });

            expect(fixture.nativeElement.querySelector('.group')).toBeNull();
            expect(text(fixture.nativeElement.querySelector('.others-summary span'))).toBe('4 consignes : Expé 1 « Ouest », Camping « Nord »');
        });

        it('shows nothing on a cell without orders', (): void => {
            render({ cell: { x: 0, y: 0 } });

            expect(fixture.nativeElement.querySelector('.cell-orders')).toBeNull();
        });
    });

    describe('in the zone detail', (): void => {
        it('lists the orders of the user, checkable, and the others with who carries them', (): void => {
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: true });

            expect(Array.from<Element>(fixture.nativeElement.querySelectorAll('.section-title')).map(text)).toEqual(['Mes consignes', 'Autres consignes ici']);
            expect(Array.from<Element>(fixture.nativeElement.querySelectorAll('.other-text')).map(text))
                .toEqual(['Brindille (même expé) — Pour Brindille', 'Camping « Nord » — Autre']);

            (fixture.nativeElement.querySelectorAll('mat-checkbox input')[1] as HTMLInputElement).click();

            expect(editor.toggleDone).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), true);
        });

        it('edits an order from its line', (): void => {
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: true });

            (fixture.nativeElement.querySelectorAll('.others .line-action')[1] as HTMLButtonElement).click();

            const [edited_part, cell, existing]: [ExpeditionPart, unknown, CellOrderEntry] = <[ExpeditionPart, unknown, CellOrderEntry]>editor.edit.mock.calls[0];
            expect(edited_part.id).toBe(10);
            expect(cell).toEqual({ x: 3, y: 4 });
            expect(existing.order.id).toBe(4);
        });

        it('adds an order through the menu of the parts, those whose route goes through the cell first', (): void => {
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: true });

            (fixture.nativeElement.querySelector('button.add') as HTMLButtonElement).click();
            fixture.detectChanges();
            const items: HTMLButtonElement[] = Array.from(document.querySelectorAll('.mat-mdc-menu-content button'));
            expect(items.map(text)).toEqual(['Camping « Nord »', 'Expé 1 « Ouest »']);

            items[1].click();

            expect(editor.edit).toHaveBeenCalledWith(expect.objectContaining({ id: 31 }), { x: 3, y: 4 }, null, expect.anything());
        });

        it('adds directly when there is a single part', (): void => {
            store.set([day()[1]]);
            render({ cell: { x: 0, y: 0 }, mode: 'detail', editable: true });

            (fixture.nativeElement.querySelector('button.add') as HTMLButtonElement).click();

            expect(editor.edit).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }), { x: 0, y: 0 }, null, expect.anything());
        });

        it('only reads without the right to edit', (): void => {
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: false });

            expect(fixture.nativeElement.querySelector('button.add')).toBeNull();
            expect(fixture.nativeElement.querySelector('.line-action')).toBeNull();
            expect((fixture.nativeElement.querySelector('mat-checkbox input') as HTMLInputElement).disabled).toBe(true);
        });

        it('names the expedition an order waits for, and gives the expeditions of the day to the form', (): void => {
            const expeditions: Expedition[] = day();
            const wait: (id: number, target: number) => ExpeditionOrder = (id: number, target: number): ExpeditionOrder =>
                new ExpeditionOrder({ id, type: 'checkbox', text: '', isDone: false, position: 0, x: 3, y: 4, kind: 'wait', targetExpeditionId: target });
            expeditions[0].parts[0].orders = [wait(1, 2)];
            expeditions[1].parts[0].orders = [wait(4, 1)];
            store.set(expeditions);
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: true });

            expect(Array.from<Element>(fixture.nativeElement.querySelectorAll('mho-expedition-order .text')).map(text)).toContain('Attendre Camping');
            expect(Array.from<Element>(fixture.nativeElement.querySelectorAll('.other-text')).map(text)).toContain('Camping « Nord » — Attendre Expé 1');

            (fixture.nativeElement.querySelector('.line-action') as HTMLButtonElement).click();
            expect(editor.edit.mock.calls[0][3].expeditions.map((expedition: Expedition): number | undefined => expedition.id)).toEqual([1, 2]);
        });

        it('shows nothing without orders nor expeditions', (): void => {
            store.set([]);
            render({ cell: { x: 3, y: 4 }, mode: 'detail', editable: true });

            expect(fixture.nativeElement.querySelector('.cell-orders')).toBeNull();
        });
    });
});
