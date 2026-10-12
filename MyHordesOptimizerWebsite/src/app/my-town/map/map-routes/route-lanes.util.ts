import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';

/** Décalages possibles, en case, par ordre de préférence : au centre, puis de part et d'autre. */
export const ROUTE_LANE_OFFSETS: readonly number[] = [0, -0.2, 0.2];

export interface LaneRoute {
    readonly key: string;
    readonly cells: readonly MapRoutePoint[];
}

/** Clé d'un pas entre deux cases voisines, indépendante du sens de marche. */
function edgeKey(from: MapRoutePoint, to: MapRoutePoint): string {
    const from_first: boolean = from.x < to.x || (from.x === to.x && from.y <= to.y);
    const first: MapRoutePoint = from_first ? from : to;
    const second: MapRoutePoint = from_first ? to : from;
    return `${first.x},${first.y}|${second.x},${second.y}`;
}

function routeEdges(cells: readonly MapRoutePoint[]): Set<string> {
    const edges: Set<string> = new Set<string>();
    for (let index: number = 0; index < cells.length - 1; index++) {
        edges.add(edgeKey(cells[index], cells[index + 1]));
    }
    return edges;
}

/**
 * Voie de chaque tracé : deux tracés qui empruntent le même pas ne doivent pas se recouvrir. Attribution
 * gloutonne dans l'ordre reçu (l'appelant trie par identifiant, pour qu'un tracé garde sa voie d'un rendu à
 * l'autre) : chaque tracé prend le premier décalage qu'aucun tracé déjà placé n'utilise sur ses pas, à défaut
 * celui qu'ils utilisent le moins. Un décalage par tracé, constant sur tout son chemin : la ligne reste
 * continue. Coût linéaire en nombre total de pas.
 */
export function assignLanes(routes: readonly LaneRoute[]): Map<string, number> {
    const lanes_by_edge: Map<string, Set<number>> = new Map<string, Set<number>>();
    const lanes: Map<string, number> = new Map<string, number>();
    for (const route of routes) {
        const edges: Set<string> = routeEdges(route.cells);
        const conflicts: Map<number, number> = new Map<number, number>();
        for (const edge of edges) {
            for (const lane of lanes_by_edge.get(edge) ?? []) {
                conflicts.set(lane, (conflicts.get(lane) ?? 0) + 1);
            }
        }
        let chosen: number = ROUTE_LANE_OFFSETS[0];
        let fewest: number = Number.POSITIVE_INFINITY;
        for (const lane of ROUTE_LANE_OFFSETS) {
            const count: number = conflicts.get(lane) ?? 0;
            if (count < fewest) {
                fewest = count;
                chosen = lane;
                if (count === 0) break;
            }
        }
        lanes.set(route.key, chosen);
        for (const edge of edges) {
            const used: Set<number> | undefined = lanes_by_edge.get(edge);
            if (used) {
                used.add(chosen);
            } else {
                lanes_by_edge.set(edge, new Set<number>([chosen]));
            }
        }
    }
    return lanes;
}
