import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { ExpeditionOrderFormData, ExpeditionOrderFormResult } from '../expedition-order-form/expedition-order-form.component';
import { ExpeditionOrderEditorService, ExpeditionOrderMapContext } from './expedition-order-editor.service';
import { OwnedExpeditionOrder } from './expedition-orders.util';

function part(overrides: Partial<ExpeditionPart> = {}): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { id: 1, orders: [], citizens: [], map_route: null, ...overrides });
}

function citizen(id: number, orders: ExpeditionOrder[] = []): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { id, citizen_id: id * 10, orders });
}

function order(overrides: Partial<ExpeditionOrder> = {}): ExpeditionOrder {
    return Object.assign(new ExpeditionOrder(), {
        id: undefined, type: 'checkbox', text: '', is_done: false, position: 0, x: 5, y: 6,
        kind: null, item_id: null, quantity: null, hero_skill: null, target_user_id: null,
        ...overrides
    });
}

const CONTEXT: ExpeditionOrderMapContext = { map: undefined, cells: new Map(), ruins: [], citizens: [], items: [], expeditions: [] };

describe('ExpeditionOrderEditorService', (): void => {
    let service: ExpeditionOrderEditorService;
    let dialogOpen: ReturnType<typeof vi.fn>;
    let updatePartOrders: ReturnType<typeof vi.fn>;
    let updateCitizenOrders: ReturnType<typeof vi.fn>;
    let errorSnackbar: ReturnType<typeof vi.fn>;
    let dialogResult: ExpeditionOrderFormResult | undefined;

    function open(expedition_part: ExpeditionPart, existing: OwnedExpeditionOrder | null = null): Promise<void> {
        return service.edit(expedition_part, { x: 5, y: 6 }, existing, CONTEXT);
    }

    beforeEach((): void => {
        updatePartOrders = vi.fn().mockResolvedValue(undefined);
        updateCitizenOrders = vi.fn().mockResolvedValue(undefined);
        errorSnackbar = vi.fn();
        dialogResult = undefined;
        dialogOpen = vi.fn().mockReturnValue({ afterClosed: (): unknown => of(dialogResult) });
        TestBed.configureTestingModule({
            providers: [
                ExpeditionOrderEditorService,
                { provide: MatDialog, useValue: { open: dialogOpen } },
                { provide: RealtimeExpeditionsService, useValue: { updateExpeditionPartOrders: updatePartOrders, updateExpeditionCitizenOrders: updateCitizenOrders } },
                { provide: SnackbarService, useValue: { errorSnackbar } }
            ]
        });
        service = TestBed.inject(ExpeditionOrderEditorService);
    });

    it('offers the other expeditions of the day to wait for, named by their label or their rank', async (): Promise<void> => {
        const expeditions: Expedition[] = [
            Object.assign(new Expedition(), { id: 1, label: 'Nord' }),
            Object.assign(new Expedition(), { id: 2, label: '' }),
            Object.assign(new Expedition(), { id: 3, label: 'Sud' })
        ];

        await service.edit(part({ expedition_id: 1 }), { x: 5, y: 6 }, null, { ...CONTEXT, expeditions });

        const data: ExpeditionOrderFormData = dialogOpen.mock.calls[0][1].data;
        expect(data.expeditions).toEqual([{ id: 2, label: 'Expédition 2' }, { id: 3, label: 'Sud' }]);
    });

    it('adds a new order to the whole expedition when no owner is selected', async (): Promise<void> => {
        const existing_order: ExpeditionOrder = order({ id: 1 });
        const expedition_part: ExpeditionPart = part({ orders: [existing_order] });
        dialogResult = { action: 'save', order: order({ text: 'Nouvelle' }), owner_ids: [] };

        await open(expedition_part);

        expect(updatePartOrders).toHaveBeenCalledTimes(1);
        const [called_part, orders] = <[ExpeditionPart, ExpeditionOrder[]]>updatePartOrders.mock.calls[0];
        expect(called_part).toBe(expedition_part);
        expect(orders.map((o: ExpeditionOrder): string => o.text)).toEqual(['', 'Nouvelle']);
        expect(orders[1].id).toBeUndefined();
    });

    it('adds the new order once per selected citizen, each as its own copy', async (): Promise<void> => {
        const alice: CitizenExpedition = citizen(10, [order({ id: 5, text: 'Existante' })]);
        const bob: CitizenExpedition = citizen(12);
        const expedition_part: ExpeditionPart = part({ citizens: [alice, bob] });
        dialogResult = { action: 'save', order: order({ text: 'Ramasser' }), owner_ids: [10, 12] };

        await open(expedition_part);

        expect(updateCitizenOrders).toHaveBeenCalledTimes(2);
        const calls: [CitizenExpedition, ExpeditionOrder[]][] = <[CitizenExpedition, ExpeditionOrder[]][]>updateCitizenOrders.mock.calls;
        const alice_orders: ExpeditionOrder[] = calls.find(([c]): boolean => c === alice)![1];
        const bob_orders: ExpeditionOrder[] = calls.find(([c]): boolean => c === bob)![1];
        expect(alice_orders.map((o: ExpeditionOrder): string => o.text)).toEqual(['Existante', 'Ramasser']);
        expect(bob_orders.map((o: ExpeditionOrder): string => o.text)).toEqual(['Ramasser']);
        expect(alice_orders[1]).not.toBe(bob_orders[0]);
    });

    it('replaces the edited order in place when the owner does not change', async (): Promise<void> => {
        const existing_order: ExpeditionOrder = order({ id: 5, text: 'Avant' });
        const alice: CitizenExpedition = citizen(10, [existing_order]);
        const expedition_part: ExpeditionPart = part({ citizens: [alice] });
        const existing: OwnedExpeditionOrder = { order: existing_order, owner: { kind: 'citizen', citizen: alice } };
        dialogResult = { action: 'save', order: order({ id: 5, text: 'Après' }), owner_ids: [10] };

        await open(expedition_part, existing);

        expect(updateCitizenOrders).toHaveBeenCalledTimes(1);
        const [, orders] = <[CitizenExpedition, ExpeditionOrder[]]>updateCitizenOrders.mock.calls[0];
        expect(orders.map((o: ExpeditionOrder): string => o.text)).toEqual(['Après']);
    });

    it('moves an edited order from one owner to another', async (): Promise<void> => {
        const existing_order: ExpeditionOrder = order({ id: 5, text: 'Avant' });
        const alice: CitizenExpedition = citizen(10, [existing_order]);
        const bob: CitizenExpedition = citizen(12);
        const expedition_part: ExpeditionPart = part({ citizens: [alice, bob] });
        const existing: OwnedExpeditionOrder = { order: existing_order, owner: { kind: 'citizen', citizen: alice } };
        dialogResult = { action: 'save', order: order({ id: 5, text: 'Après' }), owner_ids: [12] };

        await open(expedition_part, existing);

        expect(updateCitizenOrders).toHaveBeenCalledTimes(2);
        const calls: [CitizenExpedition, ExpeditionOrder[]][] = <[CitizenExpedition, ExpeditionOrder[]][]>updateCitizenOrders.mock.calls;
        expect(calls.find(([c]): boolean => c === alice)![1]).toEqual([]);
        expect(calls.find(([c]): boolean => c === bob)![1].map((o: ExpeditionOrder): string => o.text)).toEqual(['Après']);
    });

    it('deletes an existing order from its owner', async (): Promise<void> => {
        const existing_order: ExpeditionOrder = order({ id: 5 });
        const alice: CitizenExpedition = citizen(10, [existing_order]);
        const expedition_part: ExpeditionPart = part({ citizens: [alice] });
        const existing: OwnedExpeditionOrder = { order: existing_order, owner: { kind: 'citizen', citizen: alice } };
        dialogResult = { action: 'delete' };

        await open(expedition_part, existing);

        expect(updateCitizenOrders).toHaveBeenCalledTimes(1);
        expect(updateCitizenOrders.mock.calls[0][1]).toEqual([]);
    });

    it('shows an error snackbar when saving fails', async (): Promise<void> => {
        updatePartOrders.mockRejectedValueOnce(new Error('boom'));
        const expedition_part: ExpeditionPart = part();
        dialogResult = { action: 'save', order: order(), owner_ids: [] };

        await open(expedition_part);

        expect(errorSnackbar).toHaveBeenCalledTimes(1);
    });
});
