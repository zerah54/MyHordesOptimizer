import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';

import { mapRouteColorVar, MapRoutePoint } from '../../../../_abstract_model/types/map-route.class';
import { MapOrderBadge } from '../../map-orders/map-order-badges';
import { MapRouteDrawing, MapRouteDrawingKey } from '../../map-routes/map-route-views';
import { routeChevronsPath, routeLinePath, routeLoopMarkPath } from '../../map-routes/route-geometry.util';

/** Épaisseurs en case : la ligne grossit avec le zoom, comme la grille. */
const LINE_WIDTH: number = 0.16;
const EMPHASIZED_LINE_WIDTH: number = 0.19;
const CASING_EXTRA: number = 0.1;
const DIMMED_OPACITY: number = 0.4;
/** Pointillé des itinéraires du jeu. */
const GAME_DASH: string = '0.3 0.2';
/** Pastilles de consignes : en bas de la case, côte à côte selon la voie du tracé (−0,2, 0, +0,2). */
const BADGE_LEFT: number = -0.3;
const BADGE_LANE_SPREAD: number = 1.25;
const BADGE_TOP: number = 0.31;

interface RoutePaths {
    readonly key: MapRouteDrawingKey;
    readonly color: string;
    readonly line: string;
    readonly chevrons: string;
    /** Rond du départ-arrivée d'une boucle ; vide pour un aller simple. */
    readonly loop_mark: string;
    readonly line_width: number;
    readonly casing_width: number;
    readonly dash: string | null;
    readonly opacity: number;
}

interface BadgePin {
    readonly key: string;
    /** Couleur du tracé ; `null` : pastille neutre. */
    readonly color: string | null;
    readonly count: number;
    readonly left: string;
    readonly top: string;
    readonly opacity: number;
}

interface LabelPin {
    readonly key: MapRouteDrawingKey;
    readonly color: string;
    readonly text: string;
    readonly left: string;
    readonly top: string;
}

/**
 * Calque des tracés, posé sur la grille de la carte. Le SVG est exprimé en unités de case (`viewBox` de la
 * taille de la carte) et sa taille suit `--mho-cell` : un cran de zoom ne recalcule aucun chemin. Le calque
 * laisse passer les clics vers les cases.
 */
@Component({
    selector: 'mho-map-routes-layer',
    templateUrl: './map-routes-layer.component.html',
    styleUrls: ['./map-routes-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'aria-hidden': 'true',
        '[style.--mho-routes-columns]': 'width()',
        '[style.--mho-routes-rows]': 'height()'
    }
})
export class MapRoutesLayerComponent {
    /** Largeur de la carte, en cases. */
    public readonly width: InputSignal<number> = input.required();
    /** Hauteur de la carte, en cases. */
    public readonly height: InputSignal<number> = input.required();
    public readonly drawings: InputSignal<readonly MapRouteDrawing[]> = input.required();
    /** Pastilles des cases à consignes. Entrée distincte : une consigne cochée ne redessine aucun tracé. */
    public readonly badges: InputSignal<readonly MapOrderBadge[]> = input<readonly MapOrderBadge[]>([]);

    protected readonly view_box: Signal<string> = computed((): string => `0 0 ${this.width()} ${this.height()}`);

    protected readonly paths: Signal<RoutePaths[]> = computed((): RoutePaths[] => this.drawings().map((drawing: MapRouteDrawing): RoutePaths => {
        const line_width: number = drawing.emphasized ? EMPHASIZED_LINE_WIDTH : LINE_WIDTH;
        return {
            key: drawing.key,
            color: mapRouteColorVar(drawing.color),
            line: routeLinePath(drawing.cells, drawing.lane),
            chevrons: routeChevronsPath(drawing.cells, drawing.lane),
            loop_mark: routeLoopMarkPath(drawing.cells, drawing.lane),
            line_width,
            casing_width: line_width + CASING_EXTRA,
            dash: drawing.dashed ? GAME_DASH : null,
            opacity: drawing.dimmed ? DIMMED_OPACITY : 1
        };
    }));

    protected readonly badge_pins: Signal<BadgePin[]> = computed((): BadgePin[] => this.badges().map((badge: MapOrderBadge): BadgePin => ({
        key: badge.key,
        color: badge.color ? mapRouteColorVar(badge.color) : null,
        count: badge.count,
        left: `calc(${badge.cell.x + 0.5 + BADGE_LEFT + (badge.lane + 0.2) * BADGE_LANE_SPREAD} * var(--mho-cell))`,
        top: `calc(${badge.cell.y + 0.5 + BADGE_TOP} * var(--mho-cell))`,
        opacity: badge.dimmed ? DIMMED_OPACITY : 1
    })));

    /** Étiquettes (aperçu de saisie), au bord droit de la dernière case. */
    protected readonly label_pins: Signal<LabelPin[]> = computed((): LabelPin[] => this.drawings().flatMap((drawing: MapRouteDrawing): LabelPin[] => {
        const last: MapRoutePoint | undefined = drawing.cells[drawing.cells.length - 1];
        if (!drawing.label || !last) return [];
        return [{
            key: drawing.key,
            color: mapRouteColorVar(drawing.color),
            text: drawing.label,
            left: `calc(${last.x + 1} * var(--mho-cell))`,
            top: `calc(${last.y + 0.5} * var(--mho-cell))`
        }];
    }));
}
