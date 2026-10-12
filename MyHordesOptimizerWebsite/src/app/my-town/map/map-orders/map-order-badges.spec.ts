import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { MapRouteDrawing } from '../map-routes/map-route-views';
import { buildCellOrderIndex, CellOrderIndex } from './map-cell-orders';
import { buildOrderBadges, MapOrderBadge } from './map-order-badges';

function part(id: number, route_id: number | null, cells: [number, number][]): ExpeditionPart {
    const orders: ExpeditionOrder[] = cells.map(([x, y]: [number, number], position: number): ExpeditionOrder => {
        return new ExpeditionOrder({ id: id * 10 + position, type: 'checkbox', text: '', isDone: false, position, x, y });
    });
    return Object.assign(new ExpeditionPart(), { id, position: 0, orders, citizens: [], map_route_id: route_id, map_route: null });
}

function drawing(key: MapRouteDrawing['key'], lane: number, dimmed: boolean = false): MapRouteDrawing {
    return { key, color: 'teal', cells: [], lane, dashed: false, emphasized: false, dimmed, label: null };
}

describe('buildOrderBadges', (): void => {
    let index: CellOrderIndex;

    beforeEach((): void => {
        const expedition: Expedition = Object.assign(new Expedition(), {
            id: 1, position: 0, parts: [part(1, 5, [[3, 4], [3, 4]]), part(2, 6, [[3, 4]]), part(3, null, [[3, 4], [8, 8]])]
        });
        index = buildCellOrderIndex([expedition]);
    });

    it('puts one badge per drawn route on the lane of the route, and a neutral one for parts without route', (): void => {
        const badges: MapOrderBadge[] = buildOrderBadges(index, [drawing('mho-5', -0.2), drawing('mho-6', 0.2, true)], null);

        expect(badges).toEqual([
            { key: '3,4:5', cell: { x: 3, y: 4 }, lane: -0.2, color: 'teal', count: 2, dimmed: false },
            { key: '3,4:6', cell: { x: 3, y: 4 }, lane: 0.2, color: 'teal', count: 1, dimmed: true },
            { key: '3,4:none', cell: { x: 3, y: 4 }, lane: 0, color: null, count: 1, dimmed: false },
            { key: '8,8:none', cell: { x: 8, y: 8 }, lane: 0, color: null, count: 1, dimmed: false }
        ]);
    });

    it('hides the badges of a route that is not drawn', (): void => {
        const badges: MapOrderBadge[] = buildOrderBadges(index, [drawing('mho-6', 0)], null);

        expect(badges.map((badge: MapOrderBadge): string => badge.key)).toEqual(['3,4:6', '3,4:none', '8,8:none']);
    });

    it('follows the draft of the route being edited', (): void => {
        const badges: MapOrderBadge[] = buildOrderBadges(index, [drawing('draft', 0.2)], 5);

        expect(badges[0]).toEqual(expect.objectContaining({ key: '3,4:5', lane: 0.2 }));
    });

    it('returns nothing without orders', (): void => {
        expect(buildOrderBadges(new Map(), [drawing('mho-5', 0)], null)).toEqual([]);
    });
});
