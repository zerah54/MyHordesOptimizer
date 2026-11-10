import { describe, expect, it } from 'vitest';

import type { ApiExpedition, ApiExpeditionOrder, ApiExpeditionPart } from '../types';
import {
    type CellOrder,
    type GridPoint,
    type MyExpeditionPart,
    myExpeditionParts,
    myOrderIndexes,
    nextOrdersCell,
    ordersByPassage,
    parsePosition,
    type PassageOrders,
    resolvedOrderIndex,
    type RouteCellOrders,
    routeCellOrders,
    routeGuidance,
    sortOrdersByRoute,
    stepDirection,
    toRelative
} from './expedition-route';

/** Ville en coordonnées absolues : relative (x, y) = absolue (10 + x, 10 - y) */
const TOWN: GridPoint = { x: 10, y: 10 };

function points(...coordinates: [number, number][]): GridPoint[] {
    return coordinates.map(([x, y]: [number, number]): GridPoint => ({ x, y }));
}

/** Case relative → absolue, pour écrire les données de l'API */
function absolute(x: number, y: number): { x: number; y: number } {
    return { x: TOWN.x + x, y: TOWN.y - y };
}

function order(overrides: Partial<ApiExpeditionOrder>): ApiExpeditionOrder {
    return { type: 'checkbox', text: '', isDone: false, position: 0, x: null, y: null, kind: null, ...overrides };
}

describe('parsePosition', (): void => {
    it('lit les coordonnées affichées par le jeu, quelle que soit la langue', (): void => {
        expect(parsePosition('Position : 3 / -2')).toEqual({ x: 3, y: -2 });
        expect(parsePosition('Posición -4/0')).toEqual({ x: -4, y: 0 });
    });

    it('renvoie null sans coordonnées', (): void => {
        expect(parsePosition('--')).toBeNull();
        expect(parsePosition(null)).toBeNull();
    });
});

describe('toRelative / stepDirection', (): void => {
    it('convertit une case absolue en coordonnées du jeu (nord vers les y croissants)', (): void => {
        expect(toRelative({ x: 12, y: 7 }, TOWN)).toEqual({ x: 2, y: 3 });
    });

    it('donne la direction d\'un pas entre cases voisines seulement', (): void => {
        expect(stepDirection({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe('north');
        expect(stepDirection({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe('south');
        expect(stepDirection({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe('east');
        expect(stepDirection({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe('west');
        expect(stepDirection({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull();
    });
});

describe('routeGuidance', (): void => {
    const north_line: GridPoint[] = points([0, 0], [0, 1], [0, 2], [0, 3]);

    it('sur le tracé : la direction de la case suivante', (): void => {
        expect(routeGuidance(north_line, { x: 0, y: 1 })).toEqual({ mode: 'on_route', directions: ['north'], distance: 0 });
    });

    it('sur la dernière case : fin du tracé, sans direction', (): void => {
        expect(routeGuidance(north_line, { x: 0, y: 3 })).toEqual({ mode: 'arrived', directions: [], distance: 0 });
    });

    it('boucle : en ville, la direction du départ (la dernière case, la ville, n\'a pas de suite)', (): void => {
        const loop: GridPoint[] = points([0, 0], [0, 1], [1, 1], [1, 0], [0, 0]);
        expect(routeGuidance(loop, { x: 0, y: 0 })?.directions).toEqual(['north']);
    });

    it('case parcourue deux fois avec deux suites différentes : les deux directions', (): void => {
        const twice: GridPoint[] = points([0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [0, 1], [-1, 1]);
        expect(routeGuidance(twice, { x: 0, y: 1 })).toEqual({ mode: 'on_route', directions: ['north', 'west'], distance: 0 });
    });

    it('hors du tracé : la direction de sa case la plus proche, sur l\'axe le plus long', (): void => {
        expect(routeGuidance(north_line, { x: 2, y: 1 })).toEqual({ mode: 'back', directions: ['west'], distance: 2 });
        expect(routeGuidance(north_line, { x: 0, y: 6 })).toEqual({ mode: 'back', directions: ['south'], distance: 3 });
    });

    it('hors du tracé, à égale distance sur les deux axes : les deux directions', (): void => {
        expect(routeGuidance(points([0, 0], [0, 1]), { x: 1, y: 2 })).toEqual({ mode: 'back', directions: ['south', 'west'], distance: 2 });
    });

    it('hors du tracé, plusieurs cases à égale distance : la dernière du tracé, comme le jeu', (): void => {
        const u_turn: GridPoint[] = points([0, 0], [0, 1], [1, 1], [2, 1], [2, 0]);
        expect(routeGuidance(u_turn, { x: 1, y: 0 })?.directions).toEqual(['east']);
    });

    it('tracé de moins de deux cases : rien', (): void => {
        expect(routeGuidance(points([0, 0]), { x: 0, y: 0 })).toBeNull();
    });
});

describe('myExpeditionParts', (): void => {
    const expedition: ApiExpedition = {
        id: 1,
        label: 'Nord',
        parts: [
            { id: 11, citizens: [{ idUser: 7 }], mapRoute: null },
            {
                id: 12,
                citizens: [{ idUser: 42 }, { idUser: null }],
                mapRoute: { id: 3, label: 'Boucle', color: 'teal', cells: [absolute(0, 0), absolute(0, 1), absolute(1, 1)], length: 2, version: 1 }
            }
        ]
    };

    it('garde les parties où je suis inscrit, tracé en coordonnées du jeu', (): void => {
        const parts: MyExpeditionPart[] = myExpeditionParts([expedition], 42, TOWN);
        expect(parts.map((part: MyExpeditionPart): number => part.part.id)).toEqual([12]);
        expect(parts[0].part_rank).toBe(2);
        expect(parts[0].cells).toEqual(points([0, 0], [0, 1], [1, 1]));
    });
});

describe('ordersByPassage / myOrderIndexes / nextOrdersCell', (): void => {
    const here: { x: number; y: number } = absolute(0, 2);
    const part: ApiExpeditionPart = {
        id: 5,
        orders: [
            order({ id: 1, position: 2, ...here, kind: 'pick', itemId: 3, quantity: 2 }),
            order({ id: 2, position: 1, ...here, text: 'Tous' }),
            order({ id: 3, text: 'Générale' })
        ],
        citizens: [
            { idUser: 42, orders: [order({ id: 4, ...absolute(1, 2), kind: 'camp' })] },
            { idUser: 7, orders: [order({ id: 5, ...here, kind: 'wait', targetUserId: 42 }), order({ id: 6, ...absolute(0, 3), text: 'Lui' })] }
        ]
    };
    const line: GridPoint[] = points([0, 0], [0, 1], [0, 2], [1, 2], [1, 3]);

    it('consignes d\'une case : celles de toute la partie (dans l\'ordre), puis celles des citoyens', (): void => {
        const groups: PassageOrders[] = ordersByPassage(part, { x: 0, y: 2 }, TOWN, line);
        expect(groups.map((group: PassageOrders): (number | null)[] => [group.passage, group.ap])).toEqual([[null, null]]);
        const orders: CellOrder[] = groups[0].orders;
        expect(orders.map((cell_order: CellOrder): number => cell_order.order.id)).toEqual([2, 1, 5]);
        expect(orders.map((cell_order: CellOrder): number | null => cell_order.citizen_user_id)).toEqual([null, null, 7]);
    });

    it('indexes de mes consignes : celles de toute la partie et les miennes, pas celles des autres', (): void => {
        expect([...myOrderIndexes(part, 42, TOWN, line)].sort()).toEqual([2, 3]);
    });

    it('prochaine case à consignes le long du tracé', (): void => {
        const indexes: Set<number> = myOrderIndexes(part, 42, TOWN, line);
        expect(nextOrdersCell(line, { x: 0, y: 0 }, indexes)).toEqual({ point: { x: 0, y: 2 }, distance: 2 });
        expect(nextOrdersCell(line, { x: 0, y: 2 }, indexes)).toEqual({ point: { x: 1, y: 2 }, distance: 1 });
        expect(nextOrdersCell(line, { x: 1, y: 3 }, indexes)).toBeNull();
    });

    it('hors du tracé : à partir de sa case la plus proche, PA pour la rejoindre compris', (): void => {
        const cells: GridPoint[] = points([0, 0], [0, 1], [0, 2], [1, 2]);
        expect(nextOrdersCell(cells, { x: -2, y: 1 }, new Set<number>([3]))).toEqual({ point: { x: 1, y: 2 }, distance: 4 });
    });

    describe('case traversée plusieurs fois', (): void => {
        const cells: GridPoint[] = points([0, 0], [0, 1], [0, 2], [0, 1], [0, 0]);
        const at = (x: number, y: number, passage: number | null, extra: Partial<ApiExpeditionOrder> = {}): ApiExpeditionOrder =>
            order({ ...absolute(x, y), passage, ...extra });
        const twice: ApiExpeditionPart = { id: 6, orders: [at(0, 1, 2, { id: 1 }), at(0, 1, null, { id: 2 })], citizens: [] };

        it('groupes dans l\'ordre du tracé, étiquetés par passage et PA',(): void => {
            const groups: PassageOrders[] = ordersByPassage(twice, { x: 0, y: 1 }, TOWN, cells);
            expect(groups.map((group: PassageOrders): (number | null)[] => [group.passage, group.ap, group.orders.length])).toEqual([[1, 1, 1], [2, 3, 1]]);
            expect(groups.map((group: PassageOrders): number => group.orders[0].order.id)).toEqual([2, 1]);
        });

        it('case traversée une fois : un seul groupe sans étiquette', (): void => {
            expect(ordersByPassage(twice, { x: 0, y: 2 }, TOWN, cells).map((group: PassageOrders): number | null => group.passage)).toEqual([null]);
        });

        it('tracé absent : un seul groupe sans étiquette', (): void => {
            const groups: PassageOrders[] = ordersByPassage(twice, { x: 0, y: 1 }, TOWN, []);
            expect(groups.map((group: PassageOrders): number | null => group.passage)).toEqual([null]);
            expect(groups[0].orders.length).toBe(2);
        });

        it('repli sur le dernier passage', (): void => {
            expect(resolvedOrderIndex(at(0, 1, 5), cells, TOWN)).toBe(3);
            expect(resolvedOrderIndex(at(0, 1, null), cells, TOWN)).toBe(1);
        });

        it('ligne « prochaine case » masquée sur une case retraversée', (): void => {
            expect(nextOrdersCell(cells, { x: 0, y: 1 }, new Set<number>([2]))).toBeNull();
        });

        it('hors du tracé, sans réponse si la case la plus proche est traversée plusieurs fois', (): void => {
            expect(nextOrdersCell(cells, { x: 1, y: 1 }, new Set<number>([4]))).toBeNull();
        });

        it('ailleurs, raisonne sur les index : un passage sans consigne ne compte pas', (): void => {
            expect(nextOrdersCell(cells, { x: 0, y: 2 }, new Set<number>([1]))).toBeNull();
            expect(nextOrdersCell(cells, { x: 0, y: 2 }, new Set<number>([3]))).toEqual({ point: { x: 0, y: 1 }, distance: 1 });
        });
    });
});

describe('routeCellOrders', (): void => {
    /** A, B, C, B : B traversée deux fois */
    const cells: GridPoint[] = points([0, 0], [0, 1], [0, 2], [0, 1]);
    const on_c: ApiExpeditionOrder = order({ id: 1, ...absolute(0, 2) });
    const on_b_twice: ApiExpeditionOrder = order({ id: 2, ...absolute(0, 1), passage: 2 });
    const general: ApiExpeditionOrder = order({ id: 3 });
    const citizen_general: ApiExpeditionOrder = order({ id: 4 });

    const summary = (entries: RouteCellOrders[]): unknown[] => entries.map((entry: RouteCellOrders): unknown => ({
        point: entry.point,
        groups: entry.groups.map((group: PassageOrders): unknown[] => [group.passage, group.ap, group.orders.map((cell_order: CellOrder): number => cell_order.order.id)])
    }));

    it('cases dans l\'ordre de première apparition sur le tracé, puis les consignes sans case (partie, puis citoyens)', (): void => {
        const part: ApiExpeditionPart = { id: 1, orders: [on_c, on_b_twice, general], citizens: [{ idUser: 7, orders: [citizen_general] }] };
        expect(summary(routeCellOrders(part, TOWN, cells))).toEqual([
            { point: { x: 0, y: 1 }, groups: [[2, 3, [2]]] },
            { point: { x: 0, y: 2 }, groups: [[null, null, [1]]] },
            { point: null, groups: [[null, null, [3, 4]]] }
        ]);
    });

    it('case hors tracé : après celles du tracé, avant les consignes sans case', (): void => {
        const off_route: ApiExpeditionOrder = order({ id: 5, ...absolute(5, 5) });
        const part: ApiExpeditionPart = { id: 1, orders: [on_c, general], citizens: [{ idUser: 7, orders: [off_route] }] };
        expect(routeCellOrders(part, TOWN, cells).map((entry: RouteCellOrders): GridPoint | null => entry.point)).toEqual([{ x: 0, y: 2 }, { x: 5, y: 5 }, null]);
    });

    it('partie sans consigne : rien', (): void => {
        expect(routeCellOrders({ id: 1, orders: [], citizens: [{ idUser: 7, orders: [] }] }, TOWN, cells)).toEqual([]);
    });
});

describe('sortOrdersByRoute', (): void => {
    const loop: GridPoint[] = points([0, 0], [0, 1], [0, 2], [0, 1], [0, 0]);
    const general: ApiExpeditionOrder = order({ id: 1, position: 5 });
    const pass_one: ApiExpeditionOrder = order({ id: 2, ...absolute(0, 1), passage: 1 });
    const far: ApiExpeditionOrder = order({ id: 3, ...absolute(0, 2) });
    const pass_two: ApiExpeditionOrder = order({ id: 4, ...absolute(0, 1), passage: 2 });
    const off_route: ApiExpeditionOrder = order({ id: 5, ...absolute(5, 5) });
    const shuffled: ApiExpeditionOrder[] = [pass_two, off_route, far, general, pass_one];

    const ids = (orders: ApiExpeditionOrder[]): number[] => orders.map((o: ApiExpeditionOrder): number => o.id);

    it('trie : générales, puis cases dans l\'ordre du tracé (passage compris), puis hors tracé', (): void => {
        expect(ids(sortOrdersByRoute(shuffled, loop, TOWN))).toEqual([1, 2, 3, 4, 5]);
    });

    it('à rang égal, garde l\'ordre de position', (): void => {
        const a: ApiExpeditionOrder = order({ id: 7, position: 2, ...absolute(0, 2) });
        const b: ApiExpeditionOrder = order({ id: 8, position: 1, ...absolute(0, 2) });
        expect(ids(sortOrdersByRoute([a, b], loop, TOWN))).toEqual([8, 7]);
    });

    it('sans tracé, garde l\'ordre stocké', (): void => {
        expect(ids(sortOrdersByRoute(shuffled, [], TOWN))).toEqual([4, 5, 3, 1, 2]);
    });
});
