import { Cell } from '../../../_abstract_model/types/cell.class';
import { MapRoutePoint, MapRouteStop, MapRouteStopMode } from '../../../_abstract_model/types/map-route.class';

/** Cases de la carte par coordonnées absolues « x,y » (cf. `cellsByCoordinates`). */
export type CellIndex = ReadonlyMap<string, Cell>;

/** Portion d'un tracé : les cases parcourues pour rejoindre une destination, celle-ci comprise. */
export interface RouteSegment {
    readonly stop: MapRouteStop;
    /** Sans la case de départ du segment (dernière case du segment précédent). */
    readonly cells: readonly MapRoutePoint[];
}

/**
 * Critères d'une case pour le meilleur chemin, comparés dans l'ordre : le premier l'emporte, les suivants ne
 * font que départager. Le chemin retenu maximise leur somme critère par critère.
 */
export type PathScore = readonly number[];

/** Nombre de critères de `cellScore`. */
const CELL_SCORE_CRITERIA: number = 4;

export function pointKey(point: MapRoutePoint): string {
    return `${point.x},${point.y}`;
}

export function samePoint(point_a: MapRoutePoint, point_b: MapRoutePoint): boolean {
    return point_a.x === point_b.x && point_a.y === point_b.y;
}

function positive(value: number): number {
    return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Score d'une case : hors du tracé (1 ou 0), puis jamais visitée (1 ou 0), puis fouilles restantes maximales
 * (régénération comprise), puis distance à la ville en km. Le chemin évite donc les cases déjà sur le tracé et
 * n'y repasse que si tous les plus courts chemins le font (le moins possible) ; ensuite une case jamais visitée
 * l'emporte sur n'importe quel nombre de fouilles, et à potentiel égal le chemin passe par les cases les plus
 * éloignées. La ville et les cases inconnues n'ont ni potentiel ni distance.
 *
 * @param used case déjà sur le tracé : seule sa distance compte encore
 */
export function cellScore(cell: Cell | undefined, used: boolean = false): PathScore {
    const off_route: number = used ? 0 : 1;
    if (!cell || cell.is_town) return [off_route, 0, 0, 0];
    const km: number = positive(cell.nb_km);
    if (used) return [0, 0, 0, km];
    return [1, cell.is_never_visited ? 1 : 0, positive(cell.max_potential_remaining_dig), km];
}

/** Case non épuisée : jamais visitée, ou avec des fouilles restantes. */
export function isFreshCell(cell: Cell | undefined): boolean {
    if (!cell || cell.is_town) return false;
    return cell.is_never_visited || positive(cell.max_potential_remaining_dig) > 0;
}

/** Nombre de cases non épuisées distinctes parmi `points`, en ignorant celles de `excluded`. */
export function countFresh(points: readonly MapRoutePoint[], cells: CellIndex, excluded: ReadonlySet<string> = new Set<string>()): number {
    const seen: Set<string> = new Set<string>();
    let fresh: number = 0;
    for (const point of points) {
        const key: string = pointKey(point);
        if (seen.has(key) || excluded.has(key)) continue;
        seen.add(key);
        if (isFreshCell(cells.get(key))) fresh++;
    }
    return fresh;
}

/** Le plus direct : horizontal puis vertical. Sans la case de départ, avec l'arrivée. */
export function lPath(from: MapRoutePoint, to: MapRoutePoint): MapRoutePoint[] {
    const path: MapRoutePoint[] = [];
    let x: number = from.x;
    let y: number = from.y;
    while (x !== to.x) {
        x += Math.sign(to.x - x);
        path.push({ x, y });
    }
    while (y !== to.y) {
        y += Math.sign(to.y - y);
        path.push({ x, y });
    }
    return path;
}

/** Compare les sommes de critères des cases `index_a` et `index_b` : > 0 si `a` l'emporte, 0 à égalité. */
function compareScores(sums: Float64Array, criteria: number, index_a: number, index_b: number): number {
    for (let criterion: number = 0; criterion < criteria; criterion++) {
        const difference: number = sums[index_a * criteria + criterion] - sums[index_b * criteria + criterion];
        if (difference !== 0) return difference;
    }
    return 0;
}

/**
 * Parmi les plus courts chemins de `from` à `to` (aucun détour : chaque pas rapproche de l'arrivée), celui
 * dont les sommes de critères sont les plus fortes, comparées dans l'ordre des critères. Programmation
 * dynamique sur le rectangle départ–arrivée, en O(|dx| × |dy| × critères). À égalité complète, le chemin part
 * d'abord à l'horizontale, comme `lPath`. Sans la case de départ, avec l'arrivée.
 *
 * @param score critères d'une case, toujours `criteria` valeurs
 */
export function bestPath(from: MapRoutePoint, to: MapRoutePoint, score: (point: MapRoutePoint) => PathScore, criteria: number): MapRoutePoint[] {
    const step_x: number = Math.sign(to.x - from.x);
    const step_y: number = Math.sign(to.y - from.y);
    const columns: number = Math.abs(to.x - from.x) + 1;
    const rows: number = Math.abs(to.y - from.y) + 1;
    // sums[(i + j·columns)·criteria + c] : meilleure somme du critère c pour atteindre la case
    // (from.x + i·step_x, from.y + j·step_y).
    const sums: Float64Array = new Float64Array(columns * rows * criteria);
    // 1 : la meilleure case précédente est à gauche (pas horizontal), 0 : au-dessus (pas vertical).
    const from_x: Uint8Array = new Uint8Array(columns * rows);

    for (let j: number = 0; j < rows; j++) {
        for (let i: number = 0; i < columns; i++) {
            if (i === 0 && j === 0) continue;
            const index: number = i + j * columns;
            // À égalité, le pas vertical est gardé : en remontant depuis l'arrivée, les derniers pas sont
            // verticaux, le chemin commence donc par l'horizontale.
            const vertical: boolean = j > 0 && (i === 0 || compareScores(sums, criteria, index - columns, index - 1) >= 0);
            const previous: number = vertical ? index - columns : index - 1;
            from_x[index] = vertical ? 0 : 1;
            const cell_score: PathScore = score({ x: from.x + i * step_x, y: from.y + j * step_y });
            for (let criterion: number = 0; criterion < criteria; criterion++) {
                sums[index * criteria + criterion] = sums[previous * criteria + criterion] + (cell_score[criterion] ?? 0);
            }
        }
    }

    const path: MapRoutePoint[] = new Array<MapRoutePoint>(columns + rows - 2);
    let i: number = columns - 1;
    let j: number = rows - 1;
    for (let position: number = path.length - 1; position >= 0; position--) {
        path[position] = { x: from.x + i * step_x, y: from.y + j * step_y };
        if (from_x[i + j * columns] === 1) {
            i--;
        } else {
            j--;
        }
    }
    return path;
}

/**
 * Chemin d'une destination à la suivante selon son mode. En « meilleur potentiel » (`cellScore`), le chemin
 * évite les cases déjà sur le tracé (`used`) tant qu'un plus court chemin le permet.
 */
export function segmentPath(from: MapRoutePoint, to: MapRoutePoint, mode: MapRouteStopMode, used: ReadonlySet<string>, cells: CellIndex): MapRoutePoint[] {
    if (samePoint(from, to)) return [];
    if (mode === 'l') return lPath(from, to);
    return bestPath(from, to, (point: MapRoutePoint): PathScore => {
        const key: string = pointKey(point);
        return cellScore(cells.get(key), used.has(key));
    }, CELL_SCORE_CRITERIA);
}

/**
 * Calcule les segments menant à chaque destination depuis `start`, avec le potentiel actuel des cases. Une
 * destination identique à la précédente ne produit pas de segment vide : elle est ignorée.
 *
 * @param used cases déjà sur le tracé avant `start` (`start` y est ajoutée)
 */
export function buildSegments(start: MapRoutePoint, stops: readonly MapRouteStop[], cells: CellIndex,
                              used: ReadonlySet<string> = new Set<string>()): RouteSegment[] {
    const visited: Set<string> = new Set<string>(used);
    visited.add(pointKey(start));
    const segments: RouteSegment[] = [];
    let last: MapRoutePoint = start;
    for (const stop of stops) {
        if (samePoint(last, stop)) continue;
        const path: MapRoutePoint[] = segmentPath(last, stop, stop.mode, visited, cells);
        path.forEach((point: MapRoutePoint): void => {
            visited.add(pointKey(point));
        });
        segments.push({ stop: { x: stop.x, y: stop.y, mode: stop.mode }, cells: path });
        last = stop;
    }
    return segments;
}

/**
 * Retrouve les segments d'un tracé enregistré (chemin complet + destinations), sans rien recalculer : le
 * chemin du jour où il a été tracé est conservé. `null` si le chemin et les destinations ne concordent pas.
 * Un tracé sans destination devient un seul segment, en L, jusqu'à sa dernière case.
 */
export function splitSegments(cells: readonly MapRoutePoint[], stops: readonly MapRouteStop[]): RouteSegment[] | null {
    if (cells.length < 2) return null;
    if (stops.length === 0) {
        const last: MapRoutePoint = cells[cells.length - 1];
        return [{ stop: { x: last.x, y: last.y, mode: 'l' }, cells: cells.slice(1) }];
    }
    const segments: RouteSegment[] = [];
    let index: number = 0;
    for (const stop of stops) {
        let next: number = index + 1;
        while (next < cells.length && !samePoint(cells[next], stop)) {
            next++;
        }
        if (next >= cells.length) return null;
        segments.push({ stop: { x: stop.x, y: stop.y, mode: stop.mode }, cells: cells.slice(index + 1, next + 1) });
        index = next;
    }
    return index === cells.length - 1 ? segments : null;
}

/** Chemin complet : le départ puis les cases de chaque segment. */
export function routeCells(start: MapRoutePoint, segments: readonly RouteSegment[]): MapRoutePoint[] {
    const cells: MapRoutePoint[] = [start];
    for (const segment of segments) {
        cells.push(...segment.cells);
    }
    return cells;
}

/** Clés des cases d'un chemin. */
export function pointKeys(points: readonly MapRoutePoint[]): Set<string> {
    return new Set<string>(points.map(pointKey));
}
