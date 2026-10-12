import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { OwnedExpeditionOrder } from './expedition-orders.util';
import { buildRoadbook, miniMapBox, Roadbook, RoadbookStep } from './roadbook.util';

const TOWN: MapRoutePoint = { x: 10, y: 10 };

function points(...cells: [number, number][]): MapRoutePoint[] {
    return cells.map(([x, y]: [number, number]): MapRoutePoint => ({ x, y }));
}

function owned(x: number, y: number, text: string = ''): OwnedExpeditionOrder {
    const order: ExpeditionOrder = new ExpeditionOrder({ type: 'text', text, isDone: false, position: 0, x, y });
    return { order, owner: { kind: 'part', part: new ExpeditionPart() } };
}

function summary(roadbook: Roadbook): string {
    return roadbook.steps.map((step: RoadbookStep): string => `${step.label}:${step.cell.x},${step.cell.y}:${step.ap ?? '-'}:${step.orders.length}`).join(' ');
}

describe('roadbook.util', (): void => {
    describe('buildRoadbook', (): void => {
        // Boucle depuis la ville : nord, est, puis retour par le sud.
        const loop: MapRoutePoint[] = points([10, 10], [10, 9], [10, 8], [11, 8], [11, 9], [11, 10], [10, 10]);

        it('lists the start, the cells with orders in route order, the arrival, then the off-route cells', (): void => {
            const roadbook: Roadbook = buildRoadbook(loop, [owned(11, 9), owned(5, 5), owned(10, 8), owned(10, 10), owned(12, 12), owned(10, 8)], TOWN);

            expect(summary(roadbook)).toBe('D:10,10:0:1 1:10,8:2:2 2:11,9:4:1 A:10,10:6:0 !:12,12:-:1 !:5,5:-:1');
            expect(roadbook.order_count).toBe(6);
            expect(roadbook.cell_count).toBe(5);
            expect(roadbook.off_route_count).toBe(2);
        });

        it('keeps the town orders on the start of a loop and makes its arrival read-only', (): void => {
            const roadbook: Roadbook = buildRoadbook(loop, [owned(10, 10)], TOWN);
            const arrival: RoadbookStep = roadbook.steps[roadbook.steps.length - 1];

            expect(roadbook.steps[0].orders.length).toBe(1);
            expect(arrival.node).toBe('end');
            expect(arrival.addable).toBe(false);
        });

        it('puts the arrival orders of a one-way route on the arrival', (): void => {
            const roadbook: Roadbook = buildRoadbook(points([10, 10], [10, 9], [10, 8]), [owned(10, 8)], TOWN);

            expect(summary(roadbook)).toBe('D:10,10:0:0 A:10,8:2:1');
            expect(roadbook.steps[1].addable).toBe(true);
        });

        it('counts the action points at the first passage on a cell crossed twice', (): void => {
            const back_and_forth: MapRoutePoint[] = points([10, 10], [10, 9], [10, 8], [10, 9], [10, 10]);

            expect(summary(buildRoadbook(back_and_forth, [owned(10, 9)], TOWN))).toBe('D:10,10:0:0 1:10,9:1:1 A:10,10:4:0');
        });

        it('orders the cells by distance from the town without a route', (): void => {
            const roadbook: Roadbook = buildRoadbook(null, [owned(14, 10), owned(10, 9), owned(9, 12)], TOWN);

            expect(summary(roadbook)).toBe('1:10,9:1:1 2:9,12:3:1 3:14,10:4:1');
            expect(roadbook.off_route_count).toBe(0);
        });

        it('ignores the orders without a cell', (): void => {
            const general: OwnedExpeditionOrder = { order: new ExpeditionOrder({ type: 'text', text: 'groupés', isDone: false, position: 0 }), owner: owned(0, 0).owner };

            expect(buildRoadbook(null, [general], TOWN).steps).toEqual([]);
        });
    });

    describe('miniMapBox', (): void => {
        it('wraps the points with a margin', (): void => {
            expect(miniMapBox(points([10, 10], [12, 8]), 25, 25)).toEqual({ min_x: 9, min_y: 7, width: 5, height: 5 });
        });

        it('stays inside the map', (): void => {
            expect(miniMapBox(points([0, 0], [24, 1]), 25, 25, 2)).toEqual({ min_x: 0, min_y: 0, width: 25, height: 4 });
        });

        it('is empty without a point', (): void => {
            expect(miniMapBox([], 25, 25)).toEqual({ min_x: 0, min_y: 0, width: 0, height: 0 });
        });
    });
});
