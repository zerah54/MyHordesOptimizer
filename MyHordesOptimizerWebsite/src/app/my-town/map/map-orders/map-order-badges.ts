import { MapRouteColor, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { MapRouteDrawing, MapRouteDrawingKey } from '../map-routes/map-route-views';
import { mapRouteKey } from '../map-routes/map-routes-display';
import { CellOrderEntry, CellOrderIndex } from './map-cell-orders';

/** Pastille d'une case à consignes : nombre de consignes des parties qui suivent un même tracé. */
export interface MapOrderBadge {
    readonly key: string;
    readonly cell: MapRoutePoint;
    /** Voie du tracé (décalage en case) ; 0 sans tracé. */
    readonly lane: number;
    /** Couleur du tracé ; `null` pour les parties sans tracé (pastille neutre). */
    readonly color: MapRouteColor | null;
    readonly count: number;
    readonly dimmed: boolean;
}

/**
 * Pastilles des cases à consignes : une par tracé lié, sur sa voie et de sa couleur, cachée avec lui ; une neutre
 * pour les consignes des parties sans tracé. Le tracé en saisie (`draft_route_id`) garde les siennes, sur son
 * brouillon.
 */
export function buildOrderBadges(index: CellOrderIndex, drawings: readonly MapRouteDrawing[], draft_route_id: number | null): MapOrderBadge[] {
    if (index.size === 0) return [];
    const by_key: Map<MapRouteDrawingKey, MapRouteDrawing> = new Map<MapRouteDrawingKey, MapRouteDrawing>(
        drawings.map((drawing: MapRouteDrawing): [MapRouteDrawingKey, MapRouteDrawing] => [drawing.key, drawing])
    );
    const badges: MapOrderBadge[] = [];
    index.forEach((entries: readonly CellOrderEntry[], key: string): void => {
        const counts: Map<number | null, number> = new Map<number | null, number>();
        for (const entry of entries) {
            const route_id: number | null = entry.part.map_route_id;
            counts.set(route_id, (counts.get(route_id) ?? 0) + 1);
        }
        const [x, y]: number[] = key.split(',').map(Number);
        counts.forEach((count: number, route_id: number | null): void => {
            if (route_id === null) {
                badges.push({ key: `${key}:none`, cell: { x, y }, lane: 0, color: null, count, dimmed: false });
                return;
            }
            const drawing: MapRouteDrawing | undefined = by_key.get(route_id === draft_route_id ? 'draft' : mapRouteKey('mho', route_id));
            if (!drawing) return;
            badges.push({ key: `${key}:${route_id}`, cell: { x, y }, lane: drawing.lane, color: drawing.color, count, dimmed: drawing.dimmed });
        });
    });
    return badges;
}
