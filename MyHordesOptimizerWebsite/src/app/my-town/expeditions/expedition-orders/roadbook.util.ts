import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { cellKey, orderCell, OwnedExpeditionOrder, passageLabel, resolvedRouteIndex, routeIndexesOf } from './expedition-orders.util';

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
    /** PA de ce passage sur le tracé, ou depuis la ville sans tracé ; `null` hors du tracé. */
    readonly ap: number | null;
    /** Rang de l'étape parmi les passages sur sa case ; `null` hors du tracé et sans tracé. */
    readonly passage: number | null;
    /** Rang du passage, seulement sur un arrêt dont la case est traversée plusieurs fois. */
    readonly passage_label: string | null;
    readonly orders: readonly OwnedExpeditionOrder[];
    /** Faux pour une étape hors tracé et pour l'arrivée d'un tracé d'une seule case. */
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
 * Feuille de route d'une partie : avec un tracé, le départ, un arrêt par passage portant des consignes dans l'ordre du tracé (PA du
 * passage), l'arrivée, puis les cases à consignes hors du tracé ; sans tracé, les cases à consignes par
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
            passage: null,
            passage_label: null,
            orders: ordersAt(cellKey(cell)),
            addable: true
        }));
        return { steps, order_count, cell_count: groups.size, off_route_count: 0 };
    }

    const by_index: Map<number, OwnedExpeditionOrder[]> = new Map<number, OwnedExpeditionOrder[]>();
    const off_orders: OwnedExpeditionOrder[] = [];
    for (const owned of orders) {
        if (!orderCell(owned.order)) continue;
        const index: number | null = resolvedRouteIndex(owned.order, route);
        if (index === null) {
            off_orders.push(owned);
        } else {
            by_index.set(index, [...(by_index.get(index) ?? []), owned]);
        }
    }

    const last: number = route.length - 1;
    const stepAt: (index: number, node: RoadbookNode, key: string, label: string, labelled: boolean) => RoadbookStep =
        (index: number, node: RoadbookNode, key: string, label: string, labelled: boolean): RoadbookStep => {
            const cell: MapRoutePoint = route[index];
            const indexes: number[] = routeIndexesOf(route, cell);
            const passage: number = indexes.indexOf(index) + 1;
            return {
                key, node, label, cell, ap: index, passage,
                passage_label: labelled && indexes.length > 1 ? passageLabel(passage) : null,
                orders: by_index.get(index) ?? [],
                addable: true
            };
        };

    const steps: RoadbookStep[] = [stepAt(0, 'start', 'start', $localize`D`, false)];
    const stops: number[] = [...by_index.keys()].filter((index: number): boolean => index > 0 && index < last).sort((a: number, b: number): number => a - b);
    stops.forEach((index: number, rank: number): void => {
        steps.push(stepAt(index, 'stop', `stop-${index}`, `${rank + 1}`, true));
    });
    const arrival: RoadbookStep = stepAt(last, 'end', 'end', $localize`A`, false);
    steps.push(last === 0 ? { ...arrival, orders: [], addable: false } : arrival);

    let off_route_count: number = 0;
    for (const cell of byDistance(groupByCell(off_orders).keys(), town)) {
        const cell_orders: readonly OwnedExpeditionOrder[] = ordersAt(cellKey(cell));
        off_route_count += cell_orders.length;
        steps.push({ key: `off-${cellKey(cell)}`, node: 'off', label: '!', cell, ap: null, passage: null, passage_label: null, orders: cell_orders, addable: false });
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
