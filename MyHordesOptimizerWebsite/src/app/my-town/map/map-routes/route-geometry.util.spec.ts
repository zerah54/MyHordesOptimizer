import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { distanceInAp, expandStops, isLoop, routeChevronsPath, routeLinePath, routeLoopMarkPath } from './route-geometry.util';

describe('route-geometry.util', (): void => {
    describe('expandStops', (): void => {
        it('fills the cells between aligned stops', (): void => {
            expect(expandStops([{ x: 2, y: 2 }, { x: 2, y: 0 }, { x: 4, y: 0 }])).toEqual([
                { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }
            ]);
        });

        it('draws an L (horizontal then vertical) between misaligned stops, one cell per step', (): void => {
            expect(expandStops([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]);
        });

        it('returns no cell without stops and the single stop otherwise', (): void => {
            expect(expandStops([])).toEqual([]);
            expect(expandStops([{ x: 3, y: 4 }])).toEqual([{ x: 3, y: 4 }]);
        });
    });

    it('isLoop: back to the first cell', (): void => {
        expect(isLoop([{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 1 }])).toBe(true);
        expect(isLoop([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBe(false);
        expect(isLoop([{ x: 1, y: 1 }])).toBe(false);
    });

    it('distanceInAp is the Manhattan distance', (): void => {
        expect(distanceInAp({ x: 1, y: 5 }, { x: 4, y: 3 })).toBe(5);
    });

    describe('routeLinePath', (): void => {
        it('joins cell centres, shifted by the lane on both axes', (): void => {
            const cells: MapRoutePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 2 }];

            expect(routeLinePath(cells, 0)).toBe('M0.5 0.5L1.5 0.5L1.5 2.5');
            expect(routeLinePath(cells, -0.2)).toBe('M0.3 0.3L1.3 0.3L1.3 2.3');
        });

        it('draws a lone cell as a zero-length segment, which the round caps turn into a dot', (): void => {
            expect(routeLinePath([{ x: 0, y: 0 }], 0)).toBe('M0.5 0.5h0');
            expect(routeLinePath([{ x: 0, y: 0 }], -0.2)).toBe('M0.3 0.3h0');
        });

        it('is empty without cells', (): void => {
            expect(routeLinePath([], 0)).toBe('');
        });
    });

    describe('routeChevronsPath', (): void => {
        it('draws one chevron per step, centered on the departure cell, its tip pointing in the walking direction', (): void => {
            // Pas vers l'est, de (0,0) à (1,0) : centre de la case de départ (0,5 ; 0,5), pointe à sa droite.
            expect(routeChevronsPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], 0)).toBe('M0.415 0.585L0.577 0.5L0.415 0.415');
        });

        it('draws no chevron on the last cell', (): void => {
            const path: string = routeChevronsPath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], 0);

            expect(path.split('M').length - 1).toBe(2);
        });

        it('puts a chevron before and one after a right-angle corner, clear of the bend', (): void => {
            // Case (1,0) : arrivée par l'ouest, départ vers le sud ; chevrons à 0,2 de son centre (1,5 ; 0,5),
            // l'un sur le tronçon entrant (pointé à l'est), l'autre sur le tronçon sortant (pointé au sud).
            expect(routeChevronsPath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], 0))
                .toBe('M0.415 0.585L0.577 0.5L0.415 0.415'
                    + 'M1.215 0.585L1.377 0.5L1.215 0.415'
                    + 'M1.415 0.615L1.5 0.777L1.585 0.615');
        });

        it('keeps a single chevron on a U-turn, where the two stretches share the same line', (): void => {
            const path: string = routeChevronsPath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 0 }], 0);

            expect(path.split('M').length - 1).toBe(3);
        });

        it('leaves the start cell of a loop to its marker', (): void => {
            const loop: MapRoutePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }];

            // Carré : les trois cases autres que le départ sont des angles droits, deux chevrons chacune.
            expect(routeChevronsPath(loop, 0).split('M').length - 1).toBe(6);
        });

        it('skips a repeated cell', (): void => {
            expect(routeChevronsPath([{ x: 0, y: 0 }, { x: 0, y: 0 }], 0)).toBe('');
        });
    });

    describe('routeLoopMarkPath', (): void => {
        it('draws a circle on the start cell of a loop, shifted by the lane', (): void => {
            const loop: MapRoutePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }];

            expect(routeLoopMarkPath(loop, 0)).toBe('M0.34 0.5a0.16 0.16 0 1 0 0.32 0a0.16 0.16 0 1 0 -0.32 0');
            expect(routeLoopMarkPath(loop, -0.2)).toBe('M0.14 0.3a0.16 0.16 0 1 0 0.32 0a0.16 0.16 0 1 0 -0.32 0');
        });

        it('is empty for a one-way route', (): void => {
            expect(routeLoopMarkPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], 0)).toBe('');
        });
    });
});
