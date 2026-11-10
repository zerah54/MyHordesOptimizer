import type { ApiExpedition, ApiExpeditionCitizen, ApiExpeditionOrder, ApiExpeditionPart, ApiMapPoint } from '../types';

/** Suivi du tracé d'expédition dans le désert (flèches à suivre, consignes des cases ; fonctions pures, sans DOM), en coordonnées du jeu : relatives à la ville, nord vers les y croissants (`toRelative` convertit celles de l'API). */

/** Une case en coordonnées relatives à la ville, telles que le jeu les affiche. */
export interface GridPoint {
    readonly x: number;
    readonly y: number;
}

/** Flèches de déplacement du jeu (`.action-move-{direction}`). */
export type MoveDirection = 'north' | 'east' | 'south' | 'west';

/** Ordre d'affichage stable des directions. */
export const MOVE_DIRECTIONS: readonly MoveDirection[] = ['north', 'east', 'south', 'west'];

/** `on_route` : sur le tracé, `directions` mène à la case suivante (deux si passages à suites différentes) ; `back` : hors du tracé, `directions` rapproche de sa case la plus proche, à `distance` PA ; `arrived` : dernière case du tracé. */
export type RouteGuidanceMode = 'on_route' | 'back' | 'arrived';

export interface RouteGuidance {
    readonly mode: RouteGuidanceMode;
    readonly directions: readonly MoveDirection[];
    /** PA jusqu'au tracé (`back`) ; 0 sur le tracé */
    readonly distance: number;
}

/** Une partie d'expédition où je suis inscrit, et son tracé en coordonnées relatives. */
export interface MyExpeditionPart {
    readonly expedition: ApiExpedition;
    readonly part: ApiExpeditionPart;
    /** Rang de la partie dans l'expédition (1 = première), pour la nommer s'il y en a plusieurs */
    readonly part_rank: number;
    /** Chemin case par case ; vide sans tracé lié */
    readonly cells: readonly GridPoint[];
}

/** Consigne d'une case, et le citoyen qu'elle vise (`null` : toute la partie). */
export interface CellOrder {
    readonly order: ApiExpeditionOrder;
    readonly citizen_user_id: number | null;
}

/** Prochaine case à consignes le long du tracé. */
export interface NextOrdersCell {
    readonly point: GridPoint;
    /** PA depuis la case actuelle, en suivant le tracé */
    readonly distance: number;
}

/** Position lue dans le texte de `.current-location` (« Position : 3 / -2 », quelle que soit la langue) ; `null` sans coordonnées (ville dévastée, chaos). */
export function parsePosition(text: string | null | undefined): GridPoint | null {
    const match: RegExpMatchArray | null = (text ?? '').match(/(-?\d+)\s*\/\s*(-?\d+)/);
    return match ? { x: parseInt(match[1], 10), y: parseInt(match[2], 10) } : null;
}

/** Case absolue de l'API → coordonnées affichées par le jeu, la ville étant en `town` (absolue). */
export function toRelative(point: ApiMapPoint, town: GridPoint): GridPoint {
    return { x: point.x - town.x, y: town.y - point.y };
}

export function samePoint(a: GridPoint, b: GridPoint): boolean {
    return a.x === b.x && a.y === b.y;
}

export function pointKey(point: GridPoint): string {
    return `${point.x},${point.y}`;
}

function manhattan(a: GridPoint, b: GridPoint): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Direction d'un pas entre deux cases voisines ; `null` si elles ne le sont pas. */
export function stepDirection(from: GridPoint, to: GridPoint): MoveDirection | null {
    const dx: number = to.x - from.x;
    const dy: number = to.y - from.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
    if (dy === 1) return 'north';
    if (dy === -1) return 'south';
    return dx === 1 ? 'east' : 'west';
}

function sortDirections(directions: ReadonlySet<MoveDirection>): MoveDirection[] {
    return MOVE_DIRECTIONS.filter((direction: MoveDirection): boolean => directions.has(direction));
}

/** Rang de la case du tracé la plus proche ; à égalité la dernière rencontrée, comme le jeu (`HUD.tsx`). */
function closestIndex(cells: readonly GridPoint[], position: GridPoint): number {
    let best_index: number = 0;
    let best_distance: number = Infinity;
    cells.forEach((cell: GridPoint, index: number): void => {
        const distance: number = manhattan(cell, position);
        if (distance <= best_distance) {
            best_distance = distance;
            best_index = index;
        }
    });
    return best_index;
}

/** Flèche(s) à suivre depuis `position`, comme les itinéraires du jeu (`assets/ts/react/map/HUD.tsx`) : suite de chaque passage sur le tracé, sinon axe le plus long vers la case la plus proche (les deux à égalité) ; `null` sous deux cases. */
export function routeGuidance(cells: readonly GridPoint[], position: GridPoint): RouteGuidance | null {
    if (cells.length < 2) return null;

    const next: Set<MoveDirection> = new Set<MoveDirection>();
    let on_route: boolean = false;
    cells.forEach((cell: GridPoint, index: number): void => {
        if (!samePoint(cell, position)) return;
        on_route = true;
        const following: GridPoint | undefined = cells[index + 1];
        const direction: MoveDirection | null = following ? stepDirection(cell, following) : null;
        if (direction) next.add(direction);
    });
    if (on_route) {
        return next.size > 0
            ? { mode: 'on_route', directions: sortDirections(next), distance: 0 }
            : { mode: 'arrived', directions: [], distance: 0 };
    }

    const closest: GridPoint = cells[closestIndex(cells, position)];
    const dx: number = Math.abs(position.x - closest.x);
    const dy: number = Math.abs(position.y - closest.y);
    const back: Set<MoveDirection> = new Set<MoveDirection>();
    if (dx >= dy) back.add(position.x < closest.x ? 'east' : 'west');
    if (dy >= dx) back.add(position.y < closest.y ? 'north' : 'south');
    return { mode: 'back', directions: sortDirections(back), distance: dx + dy };
}

/** Parties du jour où je suis inscrit, avec leur tracé en coordonnées relatives. */
export function myExpeditionParts(expeditions: readonly ApiExpedition[], user_id: number, town: GridPoint): MyExpeditionPart[] {
    return expeditions.flatMap((expedition: ApiExpedition): MyExpeditionPart[] => {
        const parts: ApiExpeditionPart[] = expedition.parts ?? [];
        return parts.flatMap((part: ApiExpeditionPart, index: number): MyExpeditionPart[] => {
            const is_member: boolean = (part.citizens ?? []).some((citizen: ApiExpeditionCitizen): boolean => citizen.idUser === user_id);
            if (!is_member) return [];
            const cells: GridPoint[] = (part.mapRoute?.cells ?? []).map((point: ApiMapPoint): GridPoint => toRelative(point, town));
            return [{ expedition, part, part_rank: index + 1, cells }];
        });
    });
}

/** Consignes d'une même case pour un passage ; `passage` et `ap` valent `null` si la case n'est traversée qu'une fois. */
export interface PassageOrders {
    readonly passage: number | null;
    /** PA dépensés pour atteindre ce passage depuis la ville */
    readonly ap: number | null;
    readonly orders: CellOrder[];
}

function orderPoint(order: ApiExpeditionOrder, town: GridPoint): GridPoint | null {
    if (order.x === null || order.x === undefined || order.y === null || order.y === undefined) return null;
    return toRelative({ x: order.x, y: order.y }, town);
}

/** Rangs de `point` dans le tracé, dans l'ordre. */
function occurrenceIndexes(cells: readonly GridPoint[], point: GridPoint): number[] {
    return cells.flatMap((cell: GridPoint, index: number): number[] => (samePoint(cell, point) ? [index] : []));
}

/** Rang dans le tracé de la case traversée visée par la consigne (passage absent : le premier, dépassé : le dernier) ; `null` hors du tracé ou sans case. */
export function resolvedOrderIndex(order: ApiExpeditionOrder, cells: readonly GridPoint[], town: GridPoint): number | null {
    const point: GridPoint | null = orderPoint(order, town);
    if (!point) return null;
    const indexes: number[] = occurrenceIndexes(cells, point);
    if (indexes.length === 0) return null;
    return indexes[Math.min(order.passage ?? 1, indexes.length) - 1];
}

/** Tri des consignes par `position` (absente : 0). */
function byPosition(a: CellOrder, b: CellOrder): number {
    return (a.order.position ?? 0) - (b.order.position ?? 0);
}

/** Toutes les consignes d'une partie : celles de toute la partie, puis celles de chaque citoyen, chaque liste dans l'ordre de `position`. */
function partCellOrders(part: ApiExpeditionPart): CellOrder[] {
    const part_orders: CellOrder[] = (part.orders ?? [])
        .map((order: ApiExpeditionOrder): CellOrder => ({ order, citizen_user_id: null }))
        .sort(byPosition);
    const citizen_orders: CellOrder[] = (part.citizens ?? []).flatMap((citizen: ApiExpeditionCitizen): CellOrder[] => {
        return (citizen.orders ?? [])
            .map((order: ApiExpeditionOrder): CellOrder => ({ order, citizen_user_id: citizen.idUser ?? null }))
            .sort(byPosition);
    });
    return [...part_orders, ...citizen_orders];
}

/** Consignes d'une case (relative) d'une partie, groupées par passage dans l'ordre du tracé ; dans un groupe, celles de toute la partie puis celles des citoyens. */
export function ordersByPassage(part: ApiExpeditionPart, point: GridPoint, town: GridPoint, cells: readonly GridPoint[]): PassageOrders[] {
    const indexes: number[] = occurrenceIndexes(cells, point);
    const orders: CellOrder[] = partCellOrders(part).filter((cell_order: CellOrder): boolean => {
        const order_point: GridPoint | null = orderPoint(cell_order.order, town);
        return order_point !== null && samePoint(order_point, point);
    });
    if (indexes.length <= 1) return [{ passage: null, ap: null, orders }];

    return indexes
        .map((index: number, rank: number): PassageOrders => ({
            passage: rank + 1,
            ap: index,
            orders: orders.filter((cell_order: CellOrder): boolean => resolvedOrderIndex(cell_order.order, cells, town) === index)
        }))
        .filter((group: PassageOrders): boolean => group.orders.length > 0);
}

/** Consignes d'une case d'une partie ; `point` vaut `null` pour celles sans case. */
export interface RouteCellOrders {
    readonly point: GridPoint | null;
    readonly groups: PassageOrders[];
}

/** Consignes d'une partie case par case : cases du tracé dans l'ordre de première apparition, puis cases hors tracé (ordre de `position`), puis consignes sans case ; aucune entrée vide. */
export function routeCellOrders(part: ApiExpeditionPart, town: GridPoint, cells: readonly GridPoint[]): RouteCellOrders[] {
    const orders: CellOrder[] = partCellOrders(part);
    const order_points: GridPoint[] = [...orders]
        .sort(byPosition)
        .flatMap((cell_order: CellOrder): GridPoint[] => {
            const point: GridPoint | null = orderPoint(cell_order.order, town);
            return point ? [point] : [];
        });
    const with_orders: Set<string> = new Set<string>(order_points.map(pointKey));
    const listed: Set<string> = new Set<string>();
    const entries: RouteCellOrders[] = [];
    for (const point of [...cells, ...order_points]) {
        const key: string = pointKey(point);
        if (!with_orders.has(key) || listed.has(key)) continue;
        listed.add(key);
        /** Vide seulement avec un `passage` invalide (≤ 0, non entier) sur une case retraversée */
        const groups: PassageOrders[] = ordersByPassage(part, point, town, cells);
        if (groups.length > 0) entries.push({ point, groups });
    }
    const without_cell: CellOrder[] = orders.filter((cell_order: CellOrder): boolean => orderPoint(cell_order.order, town) === null);
    if (without_cell.length > 0) {
        entries.push({ point: null, groups: [{ passage: null, ap: null, orders: without_cell }] });
    }
    return entries;
}

/** Rangs du tracé portant une consigne de toute la partie ou de moi. */
export function myOrderIndexes(part: ApiExpeditionPart, user_id: number, town: GridPoint, cells: readonly GridPoint[]): Set<number> {
    const indexes: Set<number> = new Set<number>();
    const add = (order: ApiExpeditionOrder): void => {
        const index: number | null = resolvedOrderIndex(order, cells, town);
        if (index !== null) indexes.add(index);
    };
    (part.orders ?? []).forEach(add);
    (part.citizens ?? [])
        .filter((citizen: ApiExpeditionCitizen): boolean => citizen.idUser === user_id)
        .forEach((citizen: ApiExpeditionCitizen): void => (citizen.orders ?? []).forEach(add));
    return indexes;
}

/** Prochain rang du tracé portant une consigne de `order_indexes`, au-delà de la case actuelle : depuis son passage sur le tracé, sinon depuis la case la plus proche (PA pour la rejoindre compris). `null` si cette case (ou la position) est traversée plusieurs fois : le passage en cours est inconnu. */
export function nextOrdersCell(cells: readonly GridPoint[], position: GridPoint, order_indexes: ReadonlySet<number>): NextOrdersCell | null {
    if (cells.length === 0 || order_indexes.size === 0) return null;
    const on_route: number[] = occurrenceIndexes(cells, position);
    if (on_route.length > 1) return null;
    const on_route_index: number = on_route.length === 1 ? on_route[0] : -1;
    const start: number = on_route_index >= 0 ? on_route_index + 1 : closestIndex(cells, position);
    if (on_route_index < 0 && occurrenceIndexes(cells, cells[start]).length > 1) return null;
    const offset: number = on_route_index >= 0 ? on_route_index : start - manhattan(cells[start], position);
    for (let index: number = start; index < cells.length; index++) {
        if (order_indexes.has(index)) {
            return { point: cells[index], distance: index - offset };
        }
    }
    return null;
}

/** Consignes dans l'ordre du tracé : générales, puis cases par rang (passage compris), puis hors tracé ; à égalité par `position`. Sans tracé, ordre conservé. */
export function sortOrdersByRoute(orders: readonly ApiExpeditionOrder[], cells: readonly GridPoint[], town: GridPoint): ApiExpeditionOrder[] {
    if (cells.length === 0) return [...orders];
    const rank: (order: ApiExpeditionOrder) => number = (order: ApiExpeditionOrder): number => {
        if (orderPoint(order, town) === null) return -1;
        return resolvedOrderIndex(order, cells, town) ?? Infinity;
    };
    return [...orders].sort((a: ApiExpeditionOrder, b: ApiExpeditionOrder): number => {
        const ra: number = rank(a);
        const rb: number = rank(b);
        if (ra !== rb) return ra < rb ? -1 : 1;
        return (a.position ?? 0) - (b.position ?? 0);
    });
}
