import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';

/** Demi-longueur d'un chevron, en case. */
const CHEVRON_SIZE: number = 0.085;
/** Écart du chevron d'une case en angle à son centre, en case : il se dégage du coude de la ligne. */
const CORNER_SHIFT: number = 0.20;
/** Rayon du rond qui marque le départ-arrivée d'une boucle, en case. */
const LOOP_MARK_RADIUS: number = 0.16;

/**
 * Cases d'un itinéraire du jeu à partir de ses points d'arrêt. MyHordes impose deux arrêts consécutifs
 * alignés ; un écart à cette règle est tracé en L (horizontal puis vertical) plutôt qu'en diagonale, pour
 * que chaque pas reste un déplacement d'une case.
 */
export function expandStops(stops: readonly MapRoutePoint[]): MapRoutePoint[] {
    if (stops.length === 0) return [];
    const cells: MapRoutePoint[] = [{ x: stops[0].x, y: stops[0].y }];
    for (let index: number = 1; index < stops.length; index++) {
        const target: MapRoutePoint = stops[index];
        let x: number = cells[cells.length - 1].x;
        let y: number = cells[cells.length - 1].y;
        while (x !== target.x) {
            x += Math.sign(target.x - x);
            cells.push({ x, y });
        }
        while (y !== target.y) {
            y += Math.sign(target.y - y);
            cells.push({ x, y });
        }
    }
    return cells;
}

/** Le tracé revient-il à sa case de départ ? Sinon c'est un aller simple. */
export function isLoop(cells: readonly MapRoutePoint[]): boolean {
    if (cells.length < 2) return false;
    const first: MapRoutePoint = cells[0];
    const last: MapRoutePoint = cells[cells.length - 1];
    return first.x === last.x && first.y === last.y;
}

/** Distance en PA (Manhattan) entre deux cases. */
export function distanceInAp(from: MapRoutePoint, to: MapRoutePoint): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/** Nombre court pour un attribut SVG : trois décimales suffisent à un tracé en unités de case. */
function svgNumber(value: number): string {
    return String(Math.round(value * 1000) / 1000);
}

/**
 * Ligne du tracé, en unités de case : le centre de la case (x, y) est en (x + 0,5 ; y + 0,5), décalé de la
 * voie sur les deux axes, ce qui écarte les segments horizontaux comme verticaux sans casser la ligne. Une case
 * seule (départ sans destination) devient un segment de longueur nulle : les bouts ronds en font un point de la
 * largeur du trait.
 */
export function routeLinePath(cells: readonly MapRoutePoint[], lane: number): string {
    if (cells.length === 0) return '';
    const offset: number = 0.5 + lane;
    const path: string = cells
        .map((cell: MapRoutePoint, index: number): string => `${index === 0 ? 'M' : 'L'}${svgNumber(cell.x + offset)} ${svgNumber(cell.y + offset)}`)
        .join('');
    return cells.length === 1 ? `${path}h0` : path;
}

/** Rond posé sur la case de départ-arrivée d'une boucle ; vide pour un aller simple. */
export function routeLoopMarkPath(cells: readonly MapRoutePoint[], lane: number): string {
    if (!isLoop(cells)) return '';
    const radius: string = svgNumber(LOOP_MARK_RADIUS);
    const diameter: number = LOOP_MARK_RADIUS * 2;
    const offset: number = 0.5 + lane;
    return `M${svgNumber(cells[0].x + offset - LOOP_MARK_RADIUS)} ${svgNumber(cells[0].y + offset)}`
        + `a${radius} ${radius} 0 1 0 ${svgNumber(diameter)} 0a${radius} ${radius} 0 1 0 ${svgNumber(-diameter)} 0`;
}

/** Un chevron centré en (`center_x`, `center_y`), pointé dans la direction (`dx`, `dy`). */
function chevronPath(center_x: number, center_y: number, dx: number, dy: number): string {
    // Perpendiculaire au pas : les deux branches du chevron s'en écartent symétriquement.
    const normal_x: number = -dy;
    const normal_y: number = dx;
    return `M${svgNumber(center_x - dx * CHEVRON_SIZE + normal_x * CHEVRON_SIZE)} ${svgNumber(center_y - dy * CHEVRON_SIZE + normal_y * CHEVRON_SIZE)}`
        + `L${svgNumber(center_x + dx * CHEVRON_SIZE * 0.9)} ${svgNumber(center_y + dy * CHEVRON_SIZE * 0.9)}`
        + `L${svgNumber(center_x - dx * CHEVRON_SIZE - normal_x * CHEVRON_SIZE)} ${svgNumber(center_y - dy * CHEVRON_SIZE - normal_y * CHEVRON_SIZE)}`;
}

/**
 * Un chevron au centre de chaque case quittée, pointé vers la case suivante. Dans un angle droit il est remplacé
 * par deux chevrons dégagés du coude, un sur le tronçon entrant et un sur le tronçon sortant ; dans un demi-tour,
 * où les deux tronçons se superposent, il est avancé sur le tronçon sortant. La case de départ d'une boucle porte
 * son rond à la place.
 */
export function routeChevronsPath(cells: readonly MapRoutePoint[], lane: number): string {
    const offset: number = 0.5 + lane;
    const loop_start: MapRoutePoint | null = isLoop(cells) ? cells[0] : null;
    let path: string = '';
    for (let index: number = 0; index < cells.length - 1; index++) {
        const from: MapRoutePoint = cells[index];
        const to: MapRoutePoint = cells[index + 1];
        const dx: number = Math.sign(to.x - from.x);
        const dy: number = Math.sign(to.y - from.y);
        if (dx === 0 && dy === 0) continue;
        if (loop_start && from.x === loop_start.x && from.y === loop_start.y) continue;
        const previous: MapRoutePoint | undefined = cells[index - 1];
        const previous_dx: number = previous ? Math.sign(from.x - previous.x) : dx;
        const previous_dy: number = previous ? Math.sign(from.y - previous.y) : dy;
        const is_corner: boolean = (previous_dx !== 0 || previous_dy !== 0) && (previous_dx !== dx || previous_dy !== dy);
        const is_right_angle: boolean = is_corner && previous_dx * dx + previous_dy * dy === 0;
        const center_x: number = from.x + offset;
        const center_y: number = from.y + offset;
        if (is_right_angle) {
            path += chevronPath(center_x - previous_dx * CORNER_SHIFT, center_y - previous_dy * CORNER_SHIFT, previous_dx, previous_dy);
        }
        const shift: number = is_corner ? CORNER_SHIFT : 0;
        path += chevronPath(center_x + dx * shift, center_y + dy * shift, dx, dy);
    }
    return path;
}
