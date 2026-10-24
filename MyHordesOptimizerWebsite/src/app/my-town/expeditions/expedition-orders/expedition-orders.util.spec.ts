import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { canExcavate, cellOrdersOf, cloneOrder, generalOrders, isScavengerPlace, OwnedExpeditionOrder, ruinVisitAp, ruinVisitsOf, sortOrdersByRoute, withCellOrders } from './expedition-orders.util';

function order(text: string, position: number, cell?: [number, number]): ExpeditionOrder {
    return new ExpeditionOrder({ id: position + 1, type: 'text', text, isDone: false, position, x: cell?.[0] ?? null, y: cell?.[1] ?? null });
}

describe('expedition-orders.util', (): void => {
    it('reads the cell of an order only when both coordinates are set', (): void => {
        expect(order('a', 0, [3, 4]).hasCell()).toBe(true);
        expect(new ExpeditionOrder({ type: 'text', text: '', isDone: false, position: 0, x: 3 }).hasCell()).toBe(false);
    });

    it('copies the note and the expedition to wait for', (): void => {
        const copy: ExpeditionOrder = cloneOrder(new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'wait', targetExpeditionId: 4, note: 'ensemble' }));

        expect(copy.modelToDto()).toEqual(expect.objectContaining({ targetExpeditionId: 4, note: 'ensemble' }));
    });

    it('collects the cell orders of the part and of its citizens', (): void => {
        const part: ExpeditionPart = new ExpeditionPart();
        part.orders = [order('général', 0), order('case', 1, [3, 4])];
        const citizen: CitizenExpedition = new CitizenExpedition();
        citizen.orders = [order('perso', 0, [5, 6])];
        part.citizens = [citizen];

        const owned: OwnedExpeditionOrder[] = cellOrdersOf(part);

        expect(owned.map((item: OwnedExpeditionOrder): string => `${item.order.text}:${item.owner.kind}`)).toEqual(['case:part', 'perso:citizen']);
    });

    it('keeps the cell orders after the general ones, renumbered, without touching the originals', (): void => {
        const all: ExpeditionOrder[] = [order('case', 0, [3, 4]), order('ancien', 1)];
        const edited: ExpeditionOrder[] = [order('nouveau', 0)];

        const saved: ExpeditionOrder[] = withCellOrders(edited, all);

        expect(generalOrders(all).map((item: ExpeditionOrder): string => item.text)).toEqual(['ancien']);
        expect(saved.map((item: ExpeditionOrder): string => `${item.text}@${item.position}`)).toEqual(['nouveau@0', 'case@1']);
        expect(saved[1].x).toBe(3);
        expect(all[0].position).toBe(0);
    });

    describe('isScavengerPlace', (): void => {
        const citizens: Citizen[] = [
            Object.assign(new Citizen(), { id: 1, job: JobEnum.SCAVENGER }),
            Object.assign(new Citizen(), { id: 2, job: JobEnum.GUARDIAN }),
            Object.assign(new Citizen(), { id: 3 })
        ];

        function place(extra: Partial<CitizenExpedition>): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), extra);
        }

        it('follows the job of the citizen placed', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 1 }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ citizen_id: 2 }), citizens)).toBe(false);
        });

        it('lets the job of the citizen win over the pre-registered one', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 2, preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(false);
        });

        it('falls back to the pre-registered job when the citizen job is unknown or nobody is placed', (): void => {
            expect(isScavengerPlace(place({ citizen_id: 3, preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ preinscrit_job: JobEnum.SCAVENGER.key }), citizens)).toBe(true);
            expect(isScavengerPlace(place({ preinscrit_job: JobEnum.GUARDIAN.key }), citizens)).toBe(false);
            expect(isScavengerPlace(place({}), citizens)).toBe(false);
        });
    });

    describe('ruinVisitAp', (): void => {
        function explore(): ExpeditionOrder {
            return new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'explore', x: 3, y: 4 });
        }

        function partWith(part_orders: ExpeditionOrder[], ...citizen_orders: ExpeditionOrder[][]): ExpeditionPart {
            const part: ExpeditionPart = new ExpeditionPart();
            part.orders = part_orders;
            part.citizens = citizen_orders.map((orders: ExpeditionOrder[]): CitizenExpedition => Object.assign(new CitizenExpedition(), { orders }));
            return part;
        }

        it('costs nothing without a ruin visit', (): void => {
            expect(ruinVisitAp(partWith([order('général', 0)], [], []))).toBe(0);
        });

        it('costs the most any single member spends, not the sum of the visits', (): void => {
            expect(ruinVisitAp(partWith([], [explore()], []))).toBe(1);
            expect(ruinVisitAp(partWith([], [explore()], [explore()]))).toBe(1);
            expect(ruinVisitAp(partWith([], [explore(), explore()], [explore()]))).toBe(2);
        });

        it('adds a visit addressed to anyone to every member', (): void => {
            expect(ruinVisitAp(partWith([explore()], [explore()], []))).toBe(2);
            expect(ruinVisitAp(partWith([explore()]))).toBe(1);
        });
    });

    describe('ruinVisitsOf', (): void => {
        function explore(): ExpeditionOrder {
            return new ExpeditionOrder({ type: 'checkbox', text: '', isDone: false, position: 0, kind: 'explore', x: 3, y: 4 });
        }

        function placeWith(orders: ExpeditionOrder[]): CitizenExpedition {
            return Object.assign(new CitizenExpedition(), { orders });
        }

        it('counts the visits addressed to the whole part and those of the place', (): void => {
            const place: CitizenExpedition = placeWith([explore()]);
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { orders: [explore()], citizens: [place] });

            expect(ruinVisitsOf(part, place)).toBe(2);
        });

        it('does not count the visits of another place', (): void => {
            const place: CitizenExpedition = placeWith([explore()]);
            const other: CitizenExpedition = placeWith([explore(), explore()]);
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { orders: [], citizens: [place, other] });

            expect(ruinVisitsOf(part, place)).toBe(1);
        });

        it('ignores the orders that are not a ruin visit', (): void => {
            const place: CitizenExpedition = placeWith([order('perso', 0)]);
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { orders: [order('général', 0)], citizens: [place] });

            expect(ruinVisitsOf(part, place)).toBe(0);
        });
    });

    describe('canExcavate', (): void => {
        it('refuses only a cell known as already excavated', (): void => {
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: true }))).toBe(false);
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: false }))).toBe(true);
            expect(canExcavate(Object.assign(new Cell(), { is_excavated: null }))).toBe(true);
            expect(canExcavate(undefined)).toBe(true);
        });
    });

    describe('sortOrdersByRoute', (): void => {
        const route: MapRoutePoint[] = [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -5, y: 0 }];

        it('puts the cell orders in the order their cell is first reached on the route', (): void => {
            const far: ExpeditionOrder = order('loin', 0, [-5, 0]);
            const near: ExpeditionOrder = order('proche', 1, [-1, 0]);

            expect(sortOrdersByRoute([far, near], route).map((item: ExpeditionOrder): string => item.text)).toEqual(['proche', 'loin']);
        });

        it('puts the general orders first, and the off-route ones last, keeping their relative position on ties', (): void => {
            const general: ExpeditionOrder = order('général', 0);
            const on_route: ExpeditionOrder = order('case', 1, [-1, 0]);
            const off_route: ExpeditionOrder = order('hors tracé', 2, [10, 10]);

            expect(sortOrdersByRoute([off_route, on_route, general], route).map((item: ExpeditionOrder): string => item.text))
                .toEqual(['général', 'case', 'hors tracé']);
        });

        it('leaves the original order untouched without a route', (): void => {
            const a: ExpeditionOrder = order('a', 0, [-1, 0]);
            const b: ExpeditionOrder = order('b', 1);

            expect(sortOrdersByRoute([a, b], null)).toEqual([a, b]);
            expect(sortOrdersByRoute([a, b], [])).toEqual([a, b]);
        });
    });
});
