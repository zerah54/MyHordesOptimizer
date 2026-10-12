import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { MapRoute, MapRouteLinkedPart, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { latestLinkedPart, MapRouteView } from './map-route-views';
import { distanceInAp } from './route-geometry.util';

/** Ce que le panneau sait de la ville pour décrire un tracé. */
export interface MapRouteContext {
    readonly town: Town | undefined;
    readonly ruins: readonly Ruin[];
    readonly citizens: readonly Citizen[];
    readonly locale: string;
}

export interface MapRoutePlace {
    /** Coordonnées relatives à la ville, comme partout sur le site : « [x ; y] ». */
    readonly coordinates: string;
    /** « Ville », nom du bâtiment, ou vide. */
    readonly place: string;
}

export interface MapRouteDetail {
    readonly start: MapRoutePlace | null;
    readonly end: MapRoutePlace | null;
    readonly length_note: string;
    readonly is_private: boolean;
    readonly visibility: string;
    readonly edition: string;
    readonly author: string;
    readonly linked_parts: readonly string[];
}

/** Index des cases de la carte par coordonnées absolues, construit une fois par carte. */
export function cellsByCoordinates(town: Town | undefined): Map<string, Cell> {
    const cells: Map<string, Cell> = new Map<string, Cell>();
    for (const cell of town?.cells ?? []) {
        cells.set(`${cell.x},${cell.y}`, cell);
    }
    return cells;
}

/** Nom d'un citoyen, à défaut un libellé générique : un tracé survit à son auteur. */
export function citizenName(citizens: readonly Citizen[], user_id: number | null, fallback: string | null = null): string {
    if (fallback) return fallback;
    const citizen: Citizen | undefined = user_id === null ? undefined : citizens.find((candidate: Citizen): boolean => candidate.id === user_id);
    return citizen?.name ?? (user_id === null ? $localize`Inconnu` : $localize`Citoyen ${user_id}:id:`);
}

/** Libellé court d'une partie liée : « Expé 1 · partie 2 · J5 ». */
export function linkedPartLabel(part: MapRouteLinkedPart): string {
    const expedition: string = part.expedition_label?.trim() || $localize`Expédition`;
    const position: number = part.part_position + 1;
    return part.day === null
        ? $localize`${expedition}:expedition: · partie ${position}:position:`
        : $localize`${expedition}:expedition: · partie ${position}:position: · J${part.day}:day:`;
}

/** Sous-titre d'un tracé dans la liste. */
export function routeSubtitle(view: MapRouteView, town_day: number): string {
    if (view.game_route) return $localize`tracé dans MyHordes`;
    const route: MapRoute | null = view.route;
    const latest: MapRouteLinkedPart | null = route ? latestLinkedPart(route, town_day) : null;
    const link: string = latest ? linkedPartLabel(latest) : $localize`non lié`;
    return view.is_loop ? link : $localize`Aller simple · ${link}:link:`;
}

/** Coordonnées relatives à la ville et lieu d'une case (« Ville », nom du bâtiment). */
export function describePlace(point: MapRoutePoint | undefined, cells: ReadonlyMap<string, Cell>, context: MapRouteContext): MapRoutePlace | null {
    if (!point) return null;
    const cell: Cell | undefined = cells.get(`${point.x},${point.y}`);
    const town: Town | undefined = context.town;
    const x: number = cell?.displayed_x ?? (town ? point.x - town.town_x : point.x);
    const y: number = cell?.displayed_y ?? (town ? town.town_y - point.y : point.y);
    let place: string = '';
    if (cell?.is_town) {
        place = $localize`Ville`;
    } else if (cell?.ruin_id) {
        const ruin: Ruin | undefined = context.ruins.find((candidate: Ruin): boolean => candidate.id === cell.ruin_id);
        place = ruin?.label?.[context.locale] ?? '';
    }
    return { coordinates: `[${x} ; ${y}]`, place };
}

/** Fiche d'un tracé sélectionné. */
export function buildRouteDetail(view: MapRouteView, cells: ReadonlyMap<string, Cell>, context: MapRouteContext): MapRouteDetail {
    const first: MapRoutePoint | undefined = view.cells[0];
    const last: MapRoutePoint | undefined = view.cells[view.cells.length - 1];
    const town: Town | undefined = context.town;
    const back: number = last && town ? distanceInAp(last, { x: town.town_x, y: town.town_y }) : 0;
    const length_note: string = view.is_loop ? $localize`aller-retour` : $localize`aller simple · retour +${back}:back: PA`;
    const start: MapRoutePlace | null = describePlace(first, cells, context);
    const end: MapRoutePlace | null = describePlace(last, cells, context);

    const route: MapRoute | null = view.route;
    if (!route) {
        return {
            start, end, length_note,
            is_private: false,
            visibility: $localize`Toute la ville`,
            edition: $localize`Dans MyHordes uniquement`,
            author: citizenName(context.citizens, view.game_route?.author_id ?? null),
            linked_parts: []
        };
    }

    const author: string = citizenName(context.citizens, route.author_id, route.author_name);
    const shared: string = route.shared_user_ids.map((user_id: number): string => citizenName(context.citizens, user_id)).join(', ');
    return {
        start, end, length_note,
        is_private: route.is_private,
        visibility: route.is_private
            ? (shared ? $localize`Privé · ${shared}:names:` : $localize`Privé · vous seul`)
            : $localize`Toute la ville`,
        edition: route.is_editable_by_all ? $localize`Tous ceux qui le voient` : $localize`${author}:author: seulement`,
        author,
        linked_parts: route.linked_parts.map(linkedPartLabel)
    };
}
