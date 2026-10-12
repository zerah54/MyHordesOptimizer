import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { Observable, of } from 'rxjs';

import { BURIED_RUIN_ID } from '../../../_abstract_model/const';
import { ExpeditionOrderDTO } from '../../../_abstract_model/dto/expedition-order.dto';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { ExpeditionOrderFormComponent, ExpeditionOrderFormData, ExpeditionOrderFormResult } from '../expedition-order-form/expedition-order-form.component';
import { ExpeditionRoadbookComponent } from './expedition-roadbook.component';

interface DialogStub {
    open: ReturnType<typeof vi.fn>;
}

interface RealtimeStub {
    updateExpeditionPartOrders: ReturnType<typeof vi.fn>;
    updateExpeditionCitizenOrders: ReturnType<typeof vi.fn>;
    updateExpeditionOrder: ReturnType<typeof vi.fn>;
}

const HOSPITAL: Ruin = Object.assign(new Ruin(), { id: 3, explorable: true, label: { [moment.locale()]: 'Hôpital' } });
const ALICE: Citizen = Object.assign(new Citizen(), { id: 42, name: 'Alice' });
const BOB: Citizen = Object.assign(new Citizen(), { id: 43, name: 'Bob', job: JobEnum.SCAVENGER });

/** Ville en (7, 7) ; route vers l'est puis le nord : bâtiment enseveli en (8, 7), hôpital en (9, 7). */
function town(): Town {
    const cell: (x: number, y: number, extra?: Partial<Cell>) => Cell = (x: number, y: number, extra: Partial<Cell> = {}): Cell => Object.assign(new Cell(), {
        x, y, is_town: false, is_never_visited: false, is_dryed: false, max_potential_remaining_dig: 5, ruin_id: 0, nb_ruin_dig: 0, ...extra
    });
    return Object.assign(new Town(), {
        town_x: 7, town_y: 7, map_width: 15, map_height: 15,
        cells: [
            cell(7, 7, { is_town: true }),
            cell(8, 7, { ruin_id: BURIED_RUIN_ID, nb_ruin_dig: 2 }),
            cell(9, 7, { ruin_id: HOSPITAL.id }),
            cell(9, 6, { is_dryed: true })
        ]
    });
}

const ROUTE: ExpeditionPartRoute = { id: 5, label: 'Nord', color: 'blue', cells: [{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 9, y: 6 }], length: 3, version: 1 };

function order(id: number, position: number, dto: Partial<ExpeditionOrderDTO>): ExpeditionOrder {
    return new ExpeditionOrder({ id, type: 'checkbox', text: '', isDone: false, position, ...dto });
}

function member(id: number, citizen_id: number | undefined, orders: ExpeditionOrder[]): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { id, citizen_id, orders });
}

/** Partie : campement à l'hôpital et consigne générale pour tous, ramassage pour Alice, exploration hors tracé pour Bob. */
function part(route: ExpeditionPartRoute | null = ROUTE): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), {
        id: 1,
        position: 0,
        map_route_id: route?.id ?? null,
        map_route: route,
        orders: [order(1, 0, { kind: 'camp', x: 9, y: 7 }), order(2, 1, { type: 'text', text: 'Rentrer avant 20h' })],
        citizens: [
            member(10, ALICE.id, [order(3, 0, { kind: 'pick', itemId: 1, quantity: 2, x: 8, y: 7 })]),
            member(11, BOB.id, [order(4, 0, { kind: 'explore', x: 12, y: 12 })]),
            member(12, undefined, [])
        ]
    });
}

function text(element: Element | null): string {
    return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Laisse s'exécuter l'enregistrement lancé à la fermeture du formulaire. */
async function settle(): Promise<void> {
    await new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
    });
}

describe('ExpeditionRoadbookComponent', (): void => {
    let fixture: ComponentFixture<ExpeditionRoadbookComponent>;
    let dialog: DialogStub;
    let realtime: RealtimeStub;
    let snackbar: { errorSnackbar: ReturnType<typeof vi.fn> };
    let form_result: ExpeditionOrderFormResult | undefined;

    beforeEach((): void => {
        form_result = undefined;
        dialog = { open: vi.fn((): { afterClosed: () => Observable<ExpeditionOrderFormResult | undefined> } => ({ afterClosed: () => of(form_result) })) };
        realtime = {
            updateExpeditionPartOrders: vi.fn().mockResolvedValue(undefined),
            updateExpeditionCitizenOrders: vi.fn().mockResolvedValue(undefined),
            updateExpeditionOrder: vi.fn().mockResolvedValue(undefined)
        };
        snackbar = { errorSnackbar: vi.fn() };
        TestBed.configureTestingModule({
            imports: [ExpeditionRoadbookComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MatDialog, useValue: dialog },
                { provide: RealtimeExpeditionsService, useValue: realtime },
                { provide: SnackbarService, useValue: snackbar }
            ]
        });
    });

    function render(value: ExpeditionPart, inputs: Record<string, unknown> = {}): void {
        fixture = TestBed.createComponent(ExpeditionRoadbookComponent);
        fixture.componentRef.setInput('part', value);
        fixture.componentRef.setInput('map', town());
        fixture.componentRef.setInput('ruins', [HOSPITAL]);
        fixture.componentRef.setInput('citizens', [ALICE, BOB]);
        fixture.componentRef.setInput('me', ALICE.id);
        Object.entries(inputs).forEach(([name, input]: [string, unknown]): void => fixture.componentRef.setInput(name, input));
        fixture.detectChanges();
    }

    function steps(): string[] {
        return Array.from<Element>(fixture.nativeElement.querySelectorAll('li.step'))
            .map((step: Element): string => ['.node', '.coordinates', '.place', '.off-pill', '.ap']
                .map((selector: string): string => text(step.querySelector(selector)))
                .filter((part: string): boolean => part !== '')
                .join(' '));
    }

    function formData(): ExpeditionOrderFormData {
        expect(dialog.open).toHaveBeenCalledTimes(1);
        expect(dialog.open.mock.calls[0][0]).toBe(ExpeditionOrderFormComponent);
        return dialog.open.mock.calls[0][1].data;
    }

    function saved(mock: ReturnType<typeof vi.fn>, call: number = 0): string[] {
        return (<ExpeditionOrder[]>mock.mock.calls[call][1]).map((saved_order: ExpeditionOrder): string => `${saved_order.id ?? 'new'}@${saved_order.position}`);
    }

    it('lists the cells with orders in the order of the linked route, then those off the route', (): void => {
        render(part());

        expect(steps()).toEqual([
            'D [0 ; 0] Ville 0PA',
            '1 [1 ; 0] Bâtiment enseveli 1PA',
            '2 [2 ; 0] Hôpital 2PA',
            'A [2 ; 1] Désert 3PA',
            '! [5 ; -5] Hors tracé'
        ]);
        expect(text(fixture.nativeElement.querySelector('.summary'))).toBe('3 PA · 3 consigne(s) sur 3 case(s)');
        expect(text(fixture.nativeElement.querySelector('.off-route-alert'))).toContain('1 consigne n\'est plus sur le tracé.');
    });

    it('says to whom each order is addressed', (): void => {
        render(part());

        const scopes: string[] = Array.from<Element>(fixture.nativeElement.querySelectorAll('.scope')).map(text);
        expect(scopes).toEqual(['Moi', 'Tous', 'Bob']);
        expect(fixture.nativeElement.querySelector('.scope.me')).not.toBeNull();
    });

    it('without route, ranks the cells by distance to the town', (): void => {
        render(part(null));

        expect(steps()).toEqual(['1 [1 ; 0] Bâtiment enseveli 1PA', '2 [2 ; 0] Hôpital 2PA', '3 [5 ; -5] 10PA']);
        expect(text(fixture.nativeElement.querySelector('.summary'))).toBe('3 consigne(s) sur 3 case(s)');
        expect(fixture.nativeElement.querySelector('.off-route-alert')).toBeNull();
    });

    it('says when there is neither route nor cell order', (): void => {
        const empty: ExpeditionPart = Object.assign(part(null), { citizens: [] });
        empty.orders = [order(2, 0, { type: 'text', text: 'Général' })];
        render(empty);

        expect(text(fixture.nativeElement.querySelector('.summary'))).toBe('aucune consigne sur une case');
        expect(text(fixture.nativeElement.querySelector('.empty'))).toBe('Aucune consigne sur une case.');
        // La mini-carte reste, autour de la ville, pour poser une consigne en mode édition.
        expect(fixture.nativeElement.querySelectorAll('.mini-map [data-cell]').length).toBe(9);
    });

    it('draws a mini map around the route and the orders, with the count of orders per cell', (): void => {
        render(part());

        const cells: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.mini-map [data-cell]');
        // x de 6 à 13, y de 5 à 13 : la ville, le tracé et la consigne hors tracé, plus une case de marge.
        expect(cells.length).toBe(8 * 9);
        const cell: (key: string) => HTMLElement = (key: string): HTMLElement => fixture.nativeElement.querySelector(`[data-cell="${key}"]`);
        expect(cell('7,7').classList).toContain('town');
        expect(cell('8,7').classList).toContain('buried');
        expect(cell('9,7').classList).toContain('building');
        expect(cell('9,6').classList).toContain('depleted');
        expect(cell('12,12').classList).toContain('off');
        expect(cell('12,12').classList).toContain('unknown');
        expect(text(cell('9,7').querySelector('.count'))).toBe('1');
        expect(cell('7,7').querySelector('.count')).toBeNull();
        expect(fixture.nativeElement.querySelector('mho-map-routes-layer')).not.toBeNull();
    });

    it('offers no edition outside the edition mode', (): void => {
        render(part());

        expect(fixture.nativeElement.querySelector('button.add')).toBeNull();
        expect(fixture.nativeElement.querySelector('button.line-action')).toBeNull();
        (<HTMLElement>fixture.nativeElement.querySelector('[data-cell="9,6"]')).click();
        expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the form for a new order on a step, with what the cell allows and the members of the part', (): void => {
        render(part(), { editable: true });

        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.add'));
        // Départ, deux étapes, arrivée : pas de bouton sur une case hors tracé.
        expect(buttons.length).toBe(4);
        buttons[1].click();

        const data: ExpeditionOrderFormData = formData();
        expect(data.cell).toEqual({ x: 8, y: 7 });
        expect(data.cell_label).toBe('[1 ; 0] · Bâtiment enseveli');
        expect(data.can_clear).toBe(true);
        expect(data.can_explore).toBe(false);
        expect(data.can_excavate).toBe(true);
        expect(data.order).toBeNull();
        expect(data.owner_id).toBeNull();
        expect(data.move_targets).toEqual([]);
        expect(data.members).toEqual([
            { id: 10, user_id: ALICE.id, label: 'Alice', is_scavenger: false },
            { id: 11, user_id: BOB.id, label: 'Bob', is_scavenger: true },
            { id: 12, user_id: null, label: 'Place 3', is_scavenger: false }
        ]);
    });

    it('opens the form on the cell clicked on the mini map', (): void => {
        render(part(), { editable: true });

        (<HTMLElement>fixture.nativeElement.querySelector('[data-cell="9,7"]')).click();

        const data: ExpeditionOrderFormData = formData();
        expect(data.cell).toEqual({ x: 9, y: 7 });
        expect(data.can_explore).toBe(true);
        expect(data.can_clear).toBe(false);
    });

    it('saves a new order for the whole expedition at the end of the part list', async (): Promise<void> => {
        render(part(), { editable: true });
        form_result = { action: 'save', order: order(0, 0, { kind: 'camp', x: 9, y: 6 }), owner_id: null };
        (<HTMLButtonElement[]>Array.from(fixture.nativeElement.querySelectorAll('button.add')))[3].click();
        await settle();

        expect(realtime.updateExpeditionPartOrders).toHaveBeenCalledTimes(1);
        expect(realtime.updateExpeditionPartOrders.mock.calls[0][0].id).toBe(1);
        expect(saved(realtime.updateExpeditionPartOrders)).toEqual(['1@0', '2@1', 'new@2']);
        expect(realtime.updateExpeditionCitizenOrders).not.toHaveBeenCalled();
    });

    it('edits an order in the list of its owner', async (): Promise<void> => {
        const value: ExpeditionPart = part();
        render(value, { editable: true });
        const edited: ExpeditionOrder = order(3, 0, { kind: 'pick', itemId: 1, quantity: 5, x: 8, y: 7 });
        form_result = { action: 'save', order: edited, owner_id: 10 };
        (<HTMLButtonElement>fixture.nativeElement.querySelector('button.line-action')).click();
        expect(formData().owner_id).toBe(10);
        await settle();

        expect(realtime.updateExpeditionCitizenOrders).toHaveBeenCalledTimes(1);
        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][0]).toBe(value.citizens[0]);
        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][1][0].quantity).toBe(5);
        expect(realtime.updateExpeditionPartOrders).not.toHaveBeenCalled();
    });

    it('moves an order to another owner: removed from one list, added as new to the other', async (): Promise<void> => {
        const value: ExpeditionPart = part();
        render(value, { editable: true });
        form_result = { action: 'save', order: order(3, 0, { kind: 'pick', itemId: 1, quantity: 2, x: 8, y: 7 }), owner_id: null };
        (<HTMLButtonElement>fixture.nativeElement.querySelector('button.line-action')).click();
        await settle();

        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][0]).toBe(value.citizens[0]);
        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][1]).toEqual([]);
        expect(saved(realtime.updateExpeditionPartOrders)).toEqual(['1@0', '2@1', 'new@2']);
    });

    it('offers the cells of the route to move an order that left it, and deletes it', async (): Promise<void> => {
        const value: ExpeditionPart = part();
        render(value, { editable: true });
        form_result = { action: 'delete' };
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button.line-action'));
        expect(text(buttons[2])).toBe('open_with');
        buttons[2].click();

        const data: ExpeditionOrderFormData = formData();
        expect(data.owner_id).toBe(11);
        expect(data.move_targets.map((target: { label: string }): string => target.label)).toEqual([
            '[0 ; 0] · Ville · 0 PA',
            '[1 ; 0] · Bâtiment enseveli · 1 PA',
            '[2 ; 0] · Hôpital · 2 PA',
            '[2 ; 1] · Désert · 3 PA'
        ]);
        await settle();

        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][0]).toBe(value.citizens[1]);
        expect(realtime.updateExpeditionCitizenOrders.mock.calls[0][1]).toEqual([]);
    });

    it('warns when the order cannot be saved', async (): Promise<void> => {
        render(part(), { editable: true });
        realtime.updateExpeditionPartOrders.mockRejectedValue(new Error('hub'));
        form_result = { action: 'save', order: order(0, 0, { kind: 'camp', x: 7, y: 7 }), owner_id: null };
        (<HTMLButtonElement>fixture.nativeElement.querySelector('button.add')).click();
        await settle();

        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the form is cancelled', async (): Promise<void> => {
        render(part(), { editable: true });
        (<HTMLButtonElement>fixture.nativeElement.querySelector('button.add')).click();
        await settle();

        expect(realtime.updateExpeditionPartOrders).not.toHaveBeenCalled();
        expect(realtime.updateExpeditionCitizenOrders).not.toHaveBeenCalled();
    });

    it('checks an order on a copy, and warns when it fails', async (): Promise<void> => {
        const value: ExpeditionPart = part();
        render(value, { checkable: true });
        (<HTMLElement>fixture.nativeElement.querySelectorAll('mat-checkbox input')[1]).click();
        await settle();

        const checked: ExpeditionOrder = realtime.updateExpeditionOrder.mock.calls[0][0];
        expect(checked.id).toBe(1);
        expect(checked.is_done).toBe(true);
        expect(value.orders[0].is_done).toBe(false);

        realtime.updateExpeditionOrder.mockRejectedValue(new Error('hub'));
        (<HTMLElement>fixture.nativeElement.querySelectorAll('mat-checkbox input')[0]).click();
        await settle();
        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(1);
    });
});
