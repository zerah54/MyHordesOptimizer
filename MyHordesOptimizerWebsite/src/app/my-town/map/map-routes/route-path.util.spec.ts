import { Cell } from '../../../_abstract_model/types/cell.class';
import { MapRoutePoint, MapRouteStop } from '../../../_abstract_model/types/map-route.class';
import {
    bestPath,
    buildSegments,
    CellIndex,
    cellScore,
    countFresh,
    isFreshCell,
    lPath,
    PathScore,
    pointKey,
    pointKeys,
    routeCells,
    RouteSegment,
    segmentPath,
    splitSegments
} from './route-path.util';

function cell(x: number, y: number, digs: number, never_visited: boolean = false, is_town: boolean = false, km: number = 0): Cell {
    const result: Cell = new Cell();
    result.x = x;
    result.y = y;
    result.max_potential_remaining_dig = digs;
    result.is_never_visited = never_visited;
    result.is_town = is_town;
    result.nb_km = km;
    return result;
}

/** Score à un seul critère, pour éprouver `bestPath` seul. */
function single(score: number): PathScore {
    return [score];
}

function index(cells: Cell[]): CellIndex {
    return new Map<string, Cell>(cells.map((known: Cell): [string, Cell] => [pointKey(known), known]));
}

function points(path: readonly MapRoutePoint[]): string {
    return path.map(pointKey).join(' ');
}

/** Tous les plus courts chemins de `from` à `to`, sans la case de départ. */
function allShortestPaths(from: MapRoutePoint, to: MapRoutePoint): MapRoutePoint[][] {
    if (from.x === to.x && from.y === to.y) return [[]];
    const paths: MapRoutePoint[][] = [];
    if (from.x !== to.x) {
        const next: MapRoutePoint = { x: from.x + Math.sign(to.x - from.x), y: from.y };
        allShortestPaths(next, to).forEach((rest: MapRoutePoint[]): void => {
            paths.push([next, ...rest]);
        });
    }
    if (from.y !== to.y) {
        const next: MapRoutePoint = { x: from.x, y: from.y + Math.sign(to.y - from.y) };
        allShortestPaths(next, to).forEach((rest: MapRoutePoint[]): void => {
            paths.push([next, ...rest]);
        });
    }
    return paths;
}

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number): () => number {
    let state: number = seed >>> 0;
    return (): number => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

describe('cellScore', (): void => {
    it('ranks off the route, then never visited, then remaining digs, then distance in km', (): void => {
        expect(cellScore(cell(0, 0, 0, true, false, 3))).toEqual([1, 1, 0, 3]);
        expect(cellScore(cell(0, 0, 4, false, false, 7))).toEqual([1, 0, 4, 7]);
    });

    it('keeps only the distance of a cell already on the route', (): void => {
        expect(cellScore(cell(0, 0, 4, true, false, 7), true)).toEqual([0, 0, 0, 7]);
    });

    it('gives no potential nor distance to the town, an unknown cell or invalid values', (): void => {
        expect(cellScore(cell(0, 0, 4, true, true, 2))).toEqual([1, 0, 0, 0]);
        expect(cellScore(cell(0, 0, 4, true, true, 2), true)).toEqual([0, 0, 0, 0]);
        expect(cellScore(undefined)).toEqual([1, 0, 0, 0]);
        expect(cellScore(cell(0, 0, -1, false, false, Number.NaN))).toEqual([1, 0, 0, 0]);
    });

    it('treats a cell with digs or never visited as fresh', (): void => {
        expect(isFreshCell(cell(0, 0, 1))).toBe(true);
        expect(isFreshCell(cell(0, 0, 0, true))).toBe(true);
        expect(isFreshCell(cell(0, 0, 0))).toBe(false);
    });
});

describe('lPath', (): void => {
    it('goes horizontally then vertically, without the start cell', (): void => {
        expect(points(lPath({ x: 2, y: 2 }, { x: 4, y: 0 }))).toBe('3,2 4,2 4,1 4,0');
        expect(lPath({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([]);
    });
});

describe('bestPath', (): void => {
    it('is the plain L path when every cell is worth the same', (): void => {
        expect(points(bestPath({ x: 0, y: 0 }, { x: 3, y: -2 }, (): PathScore => single(0), 1))).toBe(points(lPath({ x: 0, y: 0 }, { x: 3, y: -2 })));
        expect(points(bestPath({ x: 5, y: 5 }, { x: 2, y: 7 }, (): PathScore => single(1), 1))).toBe(points(lPath({ x: 5, y: 5 }, { x: 2, y: 7 })));
    });

    it('follows a straight line when start and end are aligned', (): void => {
        expect(points(bestPath({ x: 0, y: 0 }, { x: 0, y: 3 }, (): PathScore => single(1), 1))).toBe('0,1 0,2 0,3');
        expect(points(bestPath({ x: 4, y: 0 }, { x: 1, y: 0 }, (): PathScore => single(1), 1))).toBe('3,0 2,0 1,0');
    });

    it('detours through the cells with the most potential, never adding steps', (): void => {
        const scores: Map<string, number> = new Map<string, number>([['0,1', 5], ['0,2', 5]]);
        const path: MapRoutePoint[] = bestPath({ x: 0, y: 0 }, { x: 2, y: 2 }, (point: MapRoutePoint): PathScore => single(scores.get(pointKey(point)) ?? 0), 1);

        expect(points(path)).toBe('0,1 0,2 1,2 2,2');
    });

    it('lets a later criterion only break the ties of the earlier ones', (): void => {
        // Le premier critère préfère passer par (1,0) ; le second, à lui seul, préférerait (0,1).
        const scores: Map<string, PathScore> = new Map<string, PathScore>([['1,0', [1, 0]], ['0,1', [0, 9]]]);
        const score = (point: MapRoutePoint): PathScore => scores.get(pointKey(point)) ?? [0, 0];

        expect(points(bestPath({ x: 0, y: 0 }, { x: 1, y: 1 }, score, 2))).toBe('1,0 1,1');

        scores.set('1,0', [0, 0]);
        expect(points(bestPath({ x: 0, y: 0 }, { x: 1, y: 1 }, score, 2))).toBe('0,1 1,1');
    });

    it('finds the optimum of every shortest path on random grids, criterion by criterion', (): void => {
        const random: () => number = seeded(20261005);
        for (let trial: number = 0; trial < 200; trial++) {
            const from: MapRoutePoint = { x: Math.floor(random() * 6), y: Math.floor(random() * 6) };
            const to: MapRoutePoint = { x: Math.floor(random() * 6), y: Math.floor(random() * 6) };
            const scores: Map<string, PathScore> = new Map<string, PathScore>();
            for (let x: number = 0; x < 6; x++) {
                for (let y: number = 0; y < 6; y++) {
                    scores.set(`${x},${y}`, [Math.floor(random() * 2), Math.floor(random() * 3), Math.floor(random() * 4)]);
                }
            }
            const score = (point: MapRoutePoint): PathScore => scores.get(pointKey(point)) ?? [0, 0, 0];
            // Sommes des trois critères ramenées à un nombre comparable : chaque somme reste sous 100 sur une grille 6 × 6.
            const total = (path: readonly MapRoutePoint[]): number => path.reduce((sum: number, point: MapRoutePoint): number => {
                const [first, second, third]: PathScore = score(point);
                return sum + first * 10_000 + second * 100 + third;
            }, 0);

            const path: MapRoutePoint[] = bestPath(from, to, score, 3);
            const optimum: number = Math.max(...allShortestPaths(from, to).map(total));

            expect(path.length).toBe(Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
            expect(total(path)).toBe(optimum);
            path.forEach((point: MapRoutePoint, position: number): void => {
                const previous: MapRoutePoint = position === 0 ? from : path[position - 1];
                expect(Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y)).toBe(1);
            });
        }
    });
});

describe('segmentPath', (): void => {
    const cells: CellIndex = index([cell(1, 0, 0), cell(0, 1, 0, true), cell(1, 1, 9), cell(2, 0, 8), cell(2, 1, 0)]);

    it('prefers a never visited cell to remaining digs', (): void => {
        expect(points(segmentPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 'best', new Set<string>(), cells))).toBe('0,1 1,1');
    });

    it('does not count twice a cell already on the route', (): void => {
        expect(points(segmentPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 'best', new Set<string>(['0,1']), cells))).toBe('1,0 1,1');
    });

    it('avoids the route even through an exhausted cell, and crosses it as little as possible otherwise', (): void => {
        // (0,1) jamais visitée mais déjà sur le tracé, (1,0) épuisée : on passe par (1,0).
        const route: CellIndex = index([cell(1, 0, 0, false, false, 1), cell(0, 1, 9, true, false, 9), cell(1, 1, 0)]);
        expect(points(segmentPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 'best', new Set<string>(['0,1']), route))).toBe('1,0 1,1');

        // Vers (2,1), tout plus court chemin croise le tracé vertical (1,0)–(1,1) : une fois au moins, jamais deux ;
        // entre les deux chemins qui ne le croisent qu'une fois, le potentiel décide.
        const crossing: CellIndex = index([cell(0, 1, 0, true), cell(2, 0, 0)]);
        expect(points(segmentPath({ x: 0, y: 0 }, { x: 2, y: 1 }, 'best', new Set<string>(['1,0', '1,1']), crossing))).toBe('0,1 1,1 2,1');
    });

    it('goes through the cells farthest from the town when the potential is equal', (): void => {
        const far: CellIndex = index([cell(1, 0, 2, false, false, 4), cell(0, 1, 2, false, false, 6), cell(1, 1, 0, false, false, 7)]);

        expect(points(segmentPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 'best', new Set<string>(), far))).toBe('0,1 1,1');
    });

    it('ignores the potential in L mode', (): void => {
        expect(points(segmentPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 'l', new Set<string>(), cells))).toBe('1,0 1,1');
    });
});

describe('segments', (): void => {
    const cells: CellIndex = index([cell(1, 0, 3), cell(0, 1, 0), cell(1, 1, 0), cell(2, 1, 0), cell(2, 0, 0)]);
    const start: MapRoutePoint = { x: 0, y: 0 };
    const stops: MapRouteStop[] = [{ x: 1, y: 1, mode: 'best' }, { x: 2, y: 0, mode: 'l' }, { x: 0, y: 0, mode: 'best' }];

    it('builds one segment per destination and skips a repeated destination', (): void => {
        const segments: RouteSegment[] = buildSegments(start, [stops[0], stops[0], stops[1]], cells);

        expect(segments.map((segment: RouteSegment): string => points(segment.cells))).toEqual(['1,0 1,1', '2,1 2,0']);
    });

    it('does not count the cells of the previous segments', (): void => {
        // Au retour, la case (1,0) déjà parcourue ne vaut plus rien : égalité, donc l'horizontale d'abord.
        const segments: RouteSegment[] = buildSegments(start, [{ x: 1, y: 1, mode: 'best' }, { x: 0, y: 0, mode: 'best' }], cells);

        expect(points(routeCells(start, segments))).toBe('0,0 1,0 1,1 0,1 0,0');
    });

    it('splits a saved route back into its segments', (): void => {
        const segments: RouteSegment[] = buildSegments(start, stops, cells);
        const split: RouteSegment[] | null = splitSegments(routeCells(start, segments), stops);

        expect(split).toEqual(segments);
    });

    it('refuses a route whose cells and destinations disagree', (): void => {
        expect(splitSegments([{ x: 0, y: 0 }, { x: 1, y: 0 }], [{ x: 5, y: 5, mode: 'best' }])).toBeNull();
        expect(splitSegments([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], [{ x: 1, y: 0, mode: 'best' }])).toBeNull();
        expect(splitSegments([{ x: 0, y: 0 }], [])).toBeNull();
    });

    it('turns a route without destinations into one L segment', (): void => {
        const split: RouteSegment[] | null = splitSegments([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], []);

        expect(split).toEqual([{ stop: { x: 1, y: 1, mode: 'l' }, cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }] }]);
    });
});

describe('countFresh', (): void => {
    it('counts distinct fresh cells, minus the excluded ones', (): void => {
        const cells: CellIndex = index([cell(1, 0, 3), cell(2, 0, 0, true), cell(3, 0, 0)]);
        const path: MapRoutePoint[] = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 1, y: 0 }];

        expect(countFresh(path, cells)).toBe(2);
        expect(countFresh(path, cells, pointKeys([{ x: 2, y: 0 }]))).toBe(1);
    });
});
