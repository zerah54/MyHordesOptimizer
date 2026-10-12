import { MAP_ROUTE_COLORS, MapRoute, MapRouteColor, MapRouteLinkedPart, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { MapRouteGame } from '../../../_abstract_model/types/map-route-game.class';
import { MapRouteKey, mapRouteKey, MapRoutesDisplay } from './map-routes-display';
import { expandStops, isLoop } from './route-geometry.util';
import { assignLanes } from './route-lanes.util';

/**
 * Groupe du panneau : expéditions du jour (ou à venir), tracés sans expédition, expéditions des jours
 * précédents, itinéraires créés dans MyHordes.
 */
export type MapRouteGroup = 'today' | 'free' | 'previous' | 'game';

/** Tracé MHO ou itinéraire du jeu, prêt à afficher (panneau et carte). */
export interface MapRouteView {
    readonly key: MapRouteKey;
    readonly label: string;
    /** Couleur affichée : la couleur « pour moi » si elle existe, sinon la couleur commune. */
    readonly color: MapRouteColor;
    readonly common_color: MapRouteColor;
    readonly has_personal_color: boolean;
    readonly cells: readonly MapRoutePoint[];
    readonly length: number;
    readonly is_loop: boolean;
    readonly group: MapRouteGroup;
    /** Masqué à l'œil. */
    readonly hidden: boolean;
    /** Dessiné sur la carte : non masqué, et jours précédents seulement s'ils sont demandés. */
    readonly drawn: boolean;
    /** Tracé MHO ; `null` pour un itinéraire du jeu. */
    readonly route: MapRoute | null;
    /** Itinéraire du jeu ; `null` pour un tracé MHO. */
    readonly game_route: MapRouteGame | null;
}

/** Clé d'un dessin : un tracé affiché, le tracé en cours de saisie ou l'aperçu du prochain segment. */
export type MapRouteDrawingKey = MapRouteKey | 'draft' | 'preview';

/** Ce que le calque de la carte dessine pour un tracé. */
export interface MapRouteDrawing {
    readonly key: MapRouteDrawingKey;
    readonly color: MapRouteColor;
    readonly cells: readonly MapRoutePoint[];
    /** Décalage de voie, en case. */
    readonly lane: number;
    readonly dashed: boolean;
    readonly emphasized: boolean;
    readonly dimmed: boolean;
    /** Arrivée d'un aller simple ; `null` pour une boucle. */
    readonly end: MapRoutePoint | null;
    /** Étiquette posée près de la dernière case (aperçu de saisie : « +3 PA · 2 non épuisées ») ; `null` sinon. */
    readonly label: string | null;
}

/** Dernière partie liée : celle dont le jour est le plus récent (une partie sans jour compte comme du jour). */
export function latestLinkedPart(route: MapRoute, town_day: number): MapRouteLinkedPart | null {
    let latest: MapRouteLinkedPart | null = null;
    for (const part of route.linked_parts) {
        if (!latest || (part.day ?? town_day) > (latest.day ?? town_day)) {
            latest = part;
        }
    }
    return latest;
}

function routeGroup(route: MapRoute, town_day: number): MapRouteGroup {
    const latest: MapRouteLinkedPart | null = latestLinkedPart(route, town_day);
    if (!latest) return 'free';
    return (latest.day ?? town_day) >= town_day ? 'today' : 'previous';
}

/** Couleur d'un itinéraire du jeu : stable d'un chargement à l'autre, sans rien enregistrer. */
function gameRouteColor(route: MapRouteGame): MapRouteColor {
    return MAP_ROUTE_COLORS[Math.abs(route.id) % MAP_ROUTE_COLORS.length];
}

function compareLabels(view_a: MapRouteView, view_b: MapRouteView): number {
    return view_a.label.localeCompare(view_b.label, undefined, { sensitivity: 'base' }) || view_a.key.localeCompare(view_b.key);
}

/**
 * Vues des tracés MHO puis des itinéraires du jeu, chaque famille par ordre alphabétique.
 *
 * @param town_day jour courant de la ville : il départage les expéditions du jour de celles des jours précédents
 */
export function buildRouteViews(routes: readonly MapRoute[], game_routes: readonly MapRouteGame[], town_day: number, display: MapRoutesDisplay): MapRouteView[] {
    const hidden: ReadonlySet<MapRouteKey> = new Set<MapRouteKey>(display.hidden);
    const view = (key: MapRouteKey, common_color: MapRouteColor, group: MapRouteGroup, cells: readonly MapRoutePoint[],
                  fields: Pick<MapRouteView, 'label' | 'length' | 'route' | 'game_route'>): MapRouteView => {
        const personal_color: MapRouteColor | undefined = display.colors[key];
        const is_hidden: boolean = hidden.has(key);
        return {
            ...fields,
            key,
            color: personal_color ?? common_color,
            common_color,
            has_personal_color: personal_color !== undefined,
            cells,
            is_loop: isLoop(cells),
            group,
            hidden: is_hidden,
            drawn: !is_hidden && (group !== 'previous' || display.show_previous_days)
        };
    };

    const mho_views: MapRouteView[] = routes.map((route: MapRoute): MapRouteView => view(
        mapRouteKey('mho', route.id), route.color, routeGroup(route, town_day), route.cells,
        { label: route.label, length: route.length, route, game_route: null }
    ));
    const game_views: MapRouteView[] = game_routes.map((route: MapRouteGame): MapRouteView => view(
        mapRouteKey('game', route.id), gameRouteColor(route), 'game', expandStops(route.stops),
        { label: route.label, length: route.length, route: null, game_route: route }
    ));
    return [...mho_views.sort(compareLabels), ...game_views.sort(compareLabels)];
}

function keyOrder(view: MapRouteView): number {
    return view.route ? view.route.id : Number.MAX_SAFE_INTEGER / 2 + (view.game_route?.id ?? 0);
}

/**
 * Ce que dessine la carte : les tracés dessinés, le tracé choisi au premier plan et les autres atténués.
 * Les voies sont attribuées par identifiant (tracés MHO puis itinéraires du jeu), indépendamment du choix :
 * sélectionner un tracé ne déplace aucune ligne.
 */
export function buildRouteDrawings(views: readonly MapRouteView[], selected: MapRouteKey | null): MapRouteDrawing[] {
    const drawn: MapRouteView[] = views
        .filter((view: MapRouteView): boolean => view.drawn && view.cells.length > 1)
        .sort((view_a: MapRouteView, view_b: MapRouteView): number => keyOrder(view_a) - keyOrder(view_b));
    const lanes: Map<string, number> = assignLanes(drawn);
    const has_selection: boolean = selected !== null && drawn.some((view: MapRouteView): boolean => view.key === selected);
    const drawings: MapRouteDrawing[] = drawn.map((view: MapRouteView): MapRouteDrawing => ({
        key: view.key,
        color: view.color,
        cells: view.cells,
        lane: lanes.get(view.key) ?? 0,
        dashed: view.game_route !== null,
        emphasized: view.key === selected,
        dimmed: has_selection && view.key !== selected,
        end: view.is_loop ? null : view.cells[view.cells.length - 1],
        label: null
    }));
    // Le tracé choisi en dernier : il passe au-dessus des autres.
    return [
        ...drawings.filter((drawing: MapRouteDrawing): boolean => !drawing.emphasized),
        ...drawings.filter((drawing: MapRouteDrawing): boolean => drawing.emphasized)
    ];
}
