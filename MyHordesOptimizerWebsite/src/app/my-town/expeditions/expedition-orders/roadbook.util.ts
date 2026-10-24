import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { cellKey, firstPassageOf, orderCell, OwnedExpeditionOrder } from './expedition-orders.util';

/** Départ, arrivée, case à consignes sur le tracé (ou sans tracé), case à consignes hors du tracé. */
export type RoadbookNode = 'start' | 'end' | 'stop' | 'off';

export interface RoadbookStep {
    /** Clé de suivi, unique dans la feuille de route. */
    readonly key: string;
    readonly node: RoadbookNode;
    /** « D », « A », rang de l'étape, ou « ! » hors du tracé. */
    readonly label: string;
    /** Case, en coordonnées absolues. */
    readonly cell: MapRoutePoint;
    /** PA au premier passage sur le tracé, ou depuis la ville sans tracé ; `null` hors du tracé. */
    readonly ap: number | null;
    readonly orders: readonly OwnedExpeditionOrder[];
    /** L'arrivée d'une boucle est la case du départ : ses consignes sont au départ. */
    readonly addable: boolean;
}

export interface Roadbook {
    readonly steps: readonly RoadbookStep[];
    /** Consignes par case, hors du tracé comprises. */
    readonly order_count: number;
    /** Cases portant des consignes. */
    readonly cell_count: number;
    /** Consignes dont la case n'est plus sur le tracé. */
    readonly off_route_count: number;
}

function distanceInAp(a: MapRoutePoint, b: MapRoutePoint): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function groupByCell(orders: readonly OwnedExpeditionOrder[]): Map<string, OwnedExpeditionOrder[]> {
    const groups: Map<string, OwnedExpeditionOrder[]> = new Map<string, OwnedExpeditionOrder[]>();
    for (const owned of orders) {
        const cell: MapRoutePoint | null = orderCell(owned.order);
        if (!cell) continue;
        const key: string = cellKey(cell);
        const group: OwnedExpeditionOrder[] | undefined = groups.get(key);
        if (group) {
            group.push(owned);
        } else {
            groups.set(key, [owned]);
        }
    }
    return groups;
}

function pointOf(key: string): MapRoutePoint {
    const [x, y]: number[] = key.split(',').map(Number);
    return { x, y };
}

/** Cases à consignes rangées par distance à la ville, puis de haut en bas et de gauche à droite. */
function byDistance(keys: Iterable<string>, town: MapRoutePoint): MapRoutePoint[] {
    return [...keys].map(pointOf).sort((a: MapRoutePoint, b: MapRoutePoint): number => {
        return distanceInAp(a, town) - distanceInAp(b, town) || a.y - b.y || a.x - b.x;
    });
}

/**
 * Feuille de route d'une partie : avec un tracé, le départ, les cases à consignes dans l'ordre du tracé (PA au
 * premier passage), l'arrivée, puis les cases à consignes hors du tracé ; sans tracé, les cases à consignes par
 * distance à la ville.
 *
 * @param route cases du tracé lié, en coordonnées absolues ; `null` sans tracé
 * @param town case de la ville, en coordonnées absolues
 */
export function buildRoadbook(route: readonly MapRoutePoint[] | null, orders: readonly OwnedExpeditionOrder[], town: MapRoutePoint): Roadbook {
    const groups: Map<string, OwnedExpeditionOrder[]> = groupByCell(orders);
    const order_count: number = [...groups.values()].reduce((sum: number, group: OwnedExpeditionOrder[]): number => sum + group.length, 0);
    const ordersAt: (key: string) => readonly OwnedExpeditionOrder[] = (key: string): readonly OwnedExpeditionOrder[] => groups.get(key) ?? [];

    if (!route || route.length === 0) {
        const steps: RoadbookStep[] = byDistance(groups.keys(), town).map((cell: MapRoutePoint, index: number): RoadbookStep => ({
            key: `stop-${cellKey(cell)}`,
            node: 'stop',
            label: `${index + 1}`,
            cell,
            ap: distanceInAp(cell, town),
            orders: ordersAt(cellKey(cell)),
            addable: true
        }));
        return { steps, order_count, cell_count: groups.size, off_route_count: 0 };
    }

    const first_passage: Map<string, number> = firstPassageOf(route);
    const start: MapRoutePoint = route[0];
    const end: MapRoutePoint = route[route.length - 1];
    const start_key: string = cellKey(start);
    const end_key: string = cellKey(end);
    const is_loop: boolean = start_key === end_key;

    const steps: RoadbookStep[] = [{ key: 'start', node: 'start', label: $localize`D`, cell: start, ap: 0, orders: ordersAt(start_key), addable: true }];
    const on_route: string[] = [...groups.keys()]
        .filter((key: string): boolean => first_passage.has(key) && key !== start_key && key !== end_key)
        .sort((a: string, b: string): number => <number>first_passage.get(a) - <number>first_passage.get(b));
    on_route.forEach((key: string, index: number): void => {
        steps.push({ key: `stop-${key}`, node: 'stop', label: `${index + 1}`, cell: pointOf(key), ap: <number>first_passage.get(key), orders: ordersAt(key), addable: true });
    });
    steps.push({ key: 'end', node: 'end', label: $localize`A`, cell: end, ap: route.length - 1, orders: is_loop ? [] : ordersAt(end_key), addable: !is_loop });

    const off_route: MapRoutePoint[] = byDistance([...groups.keys()].filter((key: string): boolean => !first_passage.has(key)), town);
    let off_route_count: number = 0;
    for (const cell of off_route) {
        const cell_orders: readonly OwnedExpeditionOrder[] = ordersAt(cellKey(cell));
        off_route_count += cell_orders.length;
        steps.push({ key: `off-${cellKey(cell)}`, node: 'off', label: '!', cell, ap: null, orders: cell_orders, addable: false });
    }
    return { steps, order_count, cell_count: groups.size, off_route_count };
}

/** Rectangle de la mini-carte, en coordonnées absolues. */
export interface MiniMapBox {
    readonly min_x: number;
    readonly min_y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Plus petit rectangle qui contient les cases (tracé, consignes, ville), agrandi d'une marge et borné à la carte.
 *
 * @param map_width largeur de la carte, en cases
 * @param map_height hauteur de la carte, en cases
 */
export function miniMapBox(points: readonly MapRoutePoint[], map_width: number, map_height: number, margin: number = 1): MiniMapBox {
    if (points.length === 0 || map_width <= 0 || map_height <= 0) {
        return { min_x: 0, min_y: 0, width: 0, height: 0 };
    }
    let min_x: number = Infinity;
    let min_y: number = Infinity;
    let max_x: number = -Infinity;
    let max_y: number = -Infinity;
    for (const point of points) {
        min_x = Math.min(min_x, point.x);
        min_y = Math.min(min_y, point.y);
        max_x = Math.max(max_x, point.x);
        max_y = Math.max(max_y, point.y);
    }
    min_x = Math.max(0, min_x - margin);
    min_y = Math.max(0, min_y - margin);
    max_x = Math.min(map_width - 1, max_x + margin);
    max_y = Math.min(map_height - 1, max_y + margin);
    return { min_x, min_y, width: max_x - min_x + 1, height: max_y - min_y + 1 };
}
