import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { buildCellOrderIndex, buildCellOrdersView, CellOrderEntry, CellOrderIndex, cellOrdersAt, CellOrdersView, routeOrderCounts } from './map-cell-orders';

const ME: number = 7;
const CITIZENS: Citizen[] = [Object.assign(new Citizen(), { id: ME, name: 'Zerah' }), Object.assign(new Citizen(), { id: 8, name: 'Brindille' })];
const NORTH: ExpeditionPartRoute = { id: 5, label: 'Nord-Est', color: 'blue', cells: [], length: 0, version: 0 };

function order(id: number, text: string): ExpeditionOrder {
    return new ExpeditionOrder({ id, type: 'checkbox', text, isDone: false, position: 0, x: 3, y: 4 });
}

function member(id: number, citizen_id: number | undefined, orders: ExpeditionOrder[] = []): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { id, citizen_id, orders });
}

function part(id: number, orders: ExpeditionOrder[], citizens: CitizenExpedition[], route: ExpeditionPartRoute | null = null): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { id, position: 0, orders, citizens, map_route_id: route?.id ?? null, map_route: route });
}

function expedition(id: number, label: string, position: number, parts: ExpeditionPart[]): Expedition {
    return Object.assign(new Expedition(), { id, label, position, parts });
}

/**
 * Expé 1 « Nord-Est » (la mienne) : consigne pour tous, consigne pour moi, consigne pour Brindille, consigne générale.
 * Expé 2 (deux parties, sans tracé) : consigne pour tous dans la partie 2.
 */
function day(): Expedition[] {
    const general: ExpeditionOrder = new ExpeditionOrder({ id: 2, type: 'text', text: 'Générale', isDone: false, position: 1 });
    const mine: ExpeditionPart = part(10, [order(1, 'Tous'), general], [
        member(20, ME, [order(3, 'Moi')]),
        member(21, 8, [order(4, 'Brindille')])
    ], NORTH);
    const second: Expedition = expedition(2, 'Camping', 0, [part(30, [], []), part(31, [order(5, 'Autre')], [])]);
    return [expedition(1, 'Expé 1', 1, [mine]), second];
}

describe('map-cell-orders', (): void => {
    let index: CellOrderIndex;

    beforeEach((): void => {
        index = buildCellOrderIndex(day());
    });

    it('indexes the cell orders by cell, in the order of the expeditions, of the parts then of the lists', (): void => {
        const entries: readonly CellOrderEntry[] = cellOrdersAt(index, { x: 3, y: 4 });

        expect(entries.map((entry: CellOrderEntry): string => entry.order.text)).toEqual(['Autre', 'Tous', 'Moi', 'Brindille']);
        expect(new Set(entries.map((entry: CellOrderEntry): string => entry.key)).size).toBe(4);
        expect(cellOrdersAt(index, { x: 0, y: 0 })).toEqual([]);
        expect([...index.keys()]).toEqual(['3,4']);
    });

    it('splits what is addressed to the user from the others', (): void => {
        const view: CellOrdersView = buildCellOrdersView(cellOrdersAt(index, { x: 3, y: 4 }), { user_id: ME, citizens: CITIZENS, items: [], locale: 'fr' });

        expect(view.count).toBe(4);
        expect(view.mine.length).toBe(1);
        expect(view.mine[0].label).toBe('Expé 1 « Nord-Est »');
        expect(view.mine[0].color).toBe('var(--mho-route-blue)');
        expect(view.mine[0].lines.map((line: { entry: CellOrderEntry; scope: string | null }): string => `${line.entry.order.text}:${line.scope}`))
            .toEqual(['Tous:null', 'Moi:Moi']);
        expect(view.others.map((other: { who: string; text: string }): string => `${other.who} — ${other.text}`))
            .toEqual(['Camping · partie 2 — Autre', 'Brindille (même expé) — Brindille']);
        expect(view.others_names).toEqual(['Camping · partie 2', 'Brindille']);
    });

    it('treats every order as another one without user, or outside his parts', (): void => {
        const view: CellOrdersView = buildCellOrdersView(cellOrdersAt(index, { x: 3, y: 4 }), { user_id: null, citizens: CITIZENS, items: [], locale: 'fr' });

        expect(view.mine).toEqual([]);
        expect(view.others.map((other: { who: string }): string => other.who))
            .toEqual(['Camping · partie 2', 'Expé 1 « Nord-Est »', 'Expé 1 « Nord-Est » · Zerah', 'Expé 1 « Nord-Est » · Brindille']);
        expect(view.others[2].short).toBe('Expé 1 « Nord-Est »');
    });

    it('counts the cell orders of the parts that follow each route', (): void => {
        expect([...routeOrderCounts(index)]).toEqual([[5, { orders: 3, cells: 1 }]]);
    });
});
