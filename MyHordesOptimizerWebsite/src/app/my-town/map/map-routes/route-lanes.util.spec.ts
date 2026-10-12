import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { assignLanes, LaneRoute } from './route-lanes.util';

function line(...cells: [number, number][]): MapRoutePoint[] {
    return cells.map(([x, y]: [number, number]): MapRoutePoint => ({ x, y }));
}

describe('assignLanes', (): void => {
    it('keeps every route centred when no step is shared', (): void => {
        const lanes: Map<string, number> = assignLanes([
            { key: 'a', cells: line([0, 0], [1, 0]) },
            { key: 'b', cells: line([0, 1], [1, 1]) }
        ]);

        expect(lanes.get('a')).toBe(0);
        expect(lanes.get('b')).toBe(0);
    });

    it('does not count a crossing (shared cell, no shared step) as a conflict', (): void => {
        const lanes: Map<string, number> = assignLanes([
            { key: 'a', cells: line([0, 1], [1, 1], [2, 1]) },
            { key: 'b', cells: line([1, 0], [1, 1], [1, 2]) }
        ]);

        expect(lanes.get('b')).toBe(0);
    });

    it('spreads routes sharing a step over the centre, then each side, whatever the walking direction', (): void => {
        const routes: LaneRoute[] = [
            { key: 'a', cells: line([0, 0], [1, 0], [2, 0]) },
            { key: 'b', cells: line([2, 0], [1, 0]) },
            { key: 'c', cells: line([1, 0], [2, 0], [2, 1]) }
        ];

        const lanes: Map<string, number> = assignLanes(routes);

        expect([lanes.get('a'), lanes.get('b'), lanes.get('c')]).toEqual([0, -0.2, 0.2]);
    });

    it('reuses the least used lane once all three are taken', (): void => {
        const lanes: Map<string, number> = assignLanes([
            { key: 'a', cells: line([0, 0], [1, 0]) },
            { key: 'b', cells: line([0, 0], [1, 0], [2, 0]) },
            { key: 'c', cells: line([1, 0], [2, 0]) },
            { key: 'd', cells: line([0, 0], [1, 0]) }
        ]);

        // a=0, b=-0.2 ; c partage avec b seulement → 0 ; d partage avec a et b (0 et -0.2) → 0.2.
        expect([lanes.get('a'), lanes.get('b'), lanes.get('c'), lanes.get('d')]).toEqual([0, -0.2, 0, 0.2]);
    });
});
