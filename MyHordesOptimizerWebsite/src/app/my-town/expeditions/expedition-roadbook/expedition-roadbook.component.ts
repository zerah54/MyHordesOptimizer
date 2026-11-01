import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, InputSignal, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { BURIED_RUIN_ID } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { mapRouteColorVar, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { MapRoutesLayerComponent } from '../../map/draw-map/map-routes-layer/map-routes-layer.component';
import { cellsByCoordinates, describePlace, MapRouteContext, MapRoutePlace } from '../../map/map-routes/map-route-detail';
import { MapRouteDrawing } from '../../map/map-routes/map-route-views';
import { mapRouteKey } from '../../map/map-routes/map-routes-display';
import { ExpeditionOrderComponent } from '../expedition-order/expedition-order.component';
import { ExpeditionOrderEditorService, ExpeditionOrderMapContext } from '../expedition-orders/expedition-order-editor.service';
import {
    cellKey,
    cellOrdersOf,
    OwnedExpeditionOrder,
    passageLabel,
    routeIndexesOf,
    ruinVisitAp,
    ruinVisitsOf
} from '../expedition-orders/expedition-orders.util';
import { cellPlaceLabel, memberLabel, orderCountLabel, partApLabel } from '../expedition-orders/order-labels';
import { buildRoadbook, MiniMapBox, miniMapBox, Roadbook, RoadbookNode, RoadbookStep } from '../expedition-orders/roadbook.util';

const components: Imports = [ExpeditionOrderComponent, MapRoutesLayerComponent];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Taille d'une case de la mini-carte, en pixels : la carte tient dans environ 300 px de côté. */
const MINI_MAP_SIDE: number = 300;
const MINI_CELL_MIN: number = 8;
const MINI_CELL_MAX: number = 16;

interface OrderLine {
    readonly key: string;
    readonly owned: OwnedExpeditionOrder;
    readonly scope: string;
    readonly is_me: boolean;
}

interface StepView {
    readonly key: string;
    readonly node: RoadbookNode;
    readonly label: string;
    readonly cell: MapRoutePoint;
    readonly coordinates: string;
    readonly place: string;
    readonly ap: number | null;
    readonly passage: number | null;
    readonly passage_label: string | null;
    readonly orders: readonly OrderLine[];
    readonly addable: boolean;
}

/** Passage proposé dans le menu d'une case traversée plusieurs fois. */
interface PassageChoice {
    readonly passage: number;
    readonly label: string;
}

interface MiniCell {
    readonly key: string;
    readonly x: number;
    readonly y: number;
    /** Classes d'état de la case : ville, bâtiment, inconnue, épuisée, hors tracé… */
    readonly classes: string;
    /** Consignes posées sur la case ; 0 sans consigne. */
    readonly orders: number;
    readonly title: string;
}

interface MiniMap {
    readonly box: MiniMapBox;
    readonly cell_size: number;
    readonly cells: readonly MiniCell[];
    readonly drawings: readonly MapRouteDrawing[];
}

/**
 * Feuille de route d'une partie : mini-carte du tracé lié, puis les cases à consignes dans l'ordre du tracé (sans
 * tracé, par distance à la ville) et celles sorties du tracé. En mode édition, une consigne s'ajoute sur une case
 * (bouton d'une étape, ou clic sur la mini-carte), se modifie, se déplace ou se supprime ; l'enregistrement passe
 * par le hub, la feuille se met à jour à son retour.
 */
@Component({
    selector: 'mho-expedition-roadbook',
    templateUrl: './expedition-roadbook.component.html',
    styleUrls: ['./expedition-roadbook.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class ExpeditionRoadbookComponent {
    public readonly part: InputSignal<ExpeditionPart> = input.required();
    /** Carte de la ville : cases, lieux et position de la ville. */
    public readonly map: InputSignal<Town | undefined> = input<Town | undefined>(undefined);
    public readonly ruins: InputSignal<readonly Ruin[]> = input<readonly Ruin[]>([]);
    public readonly items: InputSignal<readonly Item[]> = input<readonly Item[]>([]);
    public readonly citizens: InputSignal<readonly Citizen[]> = input<readonly Citizen[]>([]);
    /** Expéditions du jour de la partie : « Attendre » une autre expédition. */
    public readonly expeditions: InputSignal<readonly Expedition[]> = input<readonly Expedition[]>([]);
    /** Ajout, modification, déplacement et suppression des consignes (mode édition, jour modifiable). */
    public readonly editable: InputSignal<boolean> = input<boolean>(false);
    /** Cocher une consigne (jour modifiable, citoyen de la ville). */
    public readonly checkable: InputSignal<boolean> = input<boolean>(false);
    public readonly me: InputSignal<number | null> = input<number | null>(null);
    /** Non nul : seules restent les consignes de la partie et celles des places de ce citoyen. */
    public readonly onlyUser: InputSignal<number | null> = input<number | null>(null);

    /** Case traversée plusieurs fois dont le menu des passages est ouvert. */
    private readonly passage_cell: WritableSignal<MapRoutePoint | null> = signal<MapRoutePoint | null>(null);
    protected readonly passage_choices: Signal<readonly PassageChoice[]> = computed((): readonly PassageChoice[] => {
        const cell: MapRoutePoint | null = this.passage_cell();
        return cell ? routeIndexesOf(this.route()?.cells ?? [], cell).map((ap: number, index: number): PassageChoice => ({
            passage: index + 1, label: `${passageLabel(index + 1)} · ${$localize`${ap}:ap: PA`}`
        })) : [];
    });
    protected readonly passage_title: Signal<string> = computed((): string => {
        const cell: MapRoutePoint | null = this.passage_cell();
        const town: MapRoutePoint | null = this.town();
        if (!cell || !town) return '';
        const coords: string = `[${cell.x - town.x} ; ${town.y - cell.y}]`;
        return $localize`Quel passage sur ${coords}:cell: ?`;
    });

    /** Ancre invisible du menu des passages, placée au point du clic. */
    private readonly passage_anchor: Signal<ElementRef<HTMLElement> | undefined> = viewChild<ElementRef<HTMLElement>>('passageAnchor');
    private readonly passage_trigger: Signal<MatMenuTrigger | undefined> = viewChild('passageAnchor', { read: MatMenuTrigger });
    private readonly order_editor: ExpeditionOrderEditorService = inject(ExpeditionOrderEditorService);
    private readonly locale: string = moment.locale();

    private readonly cells: Signal<Map<string, Cell>> = computed((): Map<string, Cell> => cellsByCoordinates(this.map()));
    private readonly context: Signal<MapRouteContext> = computed((): MapRouteContext => ({
        town: this.map(), ruins: this.ruins(), citizens: this.citizens(), locale: this.locale
    }));
    private readonly form_context: Signal<ExpeditionOrderMapContext> = computed((): ExpeditionOrderMapContext => ({
        map: this.map(), cells: this.cells(), ruins: this.ruins(), citizens: this.citizens(), items: this.items(), expeditions: this.expeditions()
    }));

    protected readonly town: Signal<MapRoutePoint | null> = computed((): MapRoutePoint | null => {
        const map: Town | undefined = this.map();
        return map ? { x: map.town_x, y: map.town_y } : null;
    });

    protected readonly route: Signal<ExpeditionPartRoute | null> = computed((): ExpeditionPartRoute | null => this.part().map_route);
    protected readonly route_color: Signal<string | null> = computed((): string | null => {
        const route: ExpeditionPartRoute | null = this.route();
        return route ? mapRouteColorVar(route.color) : null;
    });
    protected readonly edit_tooltip: string = $localize`Modifier la consigne`;
    protected readonly move_tooltip: string = $localize`Déplacer ou modifier la consigne`;

    private readonly owned_orders: Signal<OwnedExpeditionOrder[]> = computed((): OwnedExpeditionOrder[] => {
        const only_user: number | null = this.onlyUser();
        const owned: OwnedExpeditionOrder[] = cellOrdersOf(this.part());
        if (only_user === null) return owned;
        return owned.filter((entry: OwnedExpeditionOrder): boolean => entry.owner.kind === 'part' || entry.owner.citizen.citizen_id === only_user);
    });

    protected readonly roadbook: Signal<Roadbook | null> = computed((): Roadbook | null => {
        const town: MapRoutePoint | null = this.town();
        if (!town) return null;
        return buildRoadbook(this.route()?.cells ?? null, this.owned_orders(), town);
    });

    protected readonly steps: Signal<readonly StepView[]> = computed((): readonly StepView[] => {
        return (this.roadbook()?.steps ?? []).map((step: RoadbookStep): StepView => {
            const place: MapRoutePlace | null = describePlace(step.cell, this.cells(), this.context());
            return {
                key: step.key,
                node: step.node,
                label: step.label,
                cell: step.cell,
                coordinates: place?.coordinates ?? '',
                place: cellPlaceLabel(step.cell, place, this.cells()),
                ap: step.ap,
                passage: step.passage,
                passage_label: step.passage_label,
                orders: step.orders.map((owned: OwnedExpeditionOrder, index: number): OrderLine => this.orderLine(owned, index)),
                addable: step.addable
            };
        });
    });

    protected readonly mini_map: Signal<MiniMap | null> = computed((): MiniMap | null => {
        const map: Town | undefined = this.map();
        const town: MapRoutePoint | null = this.town();
        if (!map || !town) return null;
        const route: ExpeditionPartRoute | null = this.route();
        const order_cells: MapRoutePoint[] = (this.roadbook()?.steps ?? []).map((step: RoadbookStep): MapRoutePoint => step.cell);
        const box: MiniMapBox = miniMapBox([town, ...(route?.cells ?? []), ...order_cells], map.map_width, map.map_height);
        if (box.width === 0) return null;
        const cell_size: number = Math.max(MINI_CELL_MIN, Math.min(MINI_CELL_MAX, Math.floor(MINI_MAP_SIDE / Math.max(box.width, box.height))));
        const counts: Map<string, number> = new Map<string, number>();
        const off_route: Set<string> = new Set<string>();
        for (const step of this.roadbook()?.steps ?? []) {
            const key: string = cellKey(step.cell);
            counts.set(key, (counts.get(key) ?? 0) + step.orders.length);
            if (step.node === 'off') off_route.add(key);
        }
        const cells: MiniCell[] = [];
        for (let y: number = box.min_y; y < box.min_y + box.height; y++) {
            for (let x: number = box.min_x; x < box.min_x + box.width; x++) {
                const key: string = `${x},${y}`;
                cells.push({
                    key,
                    x,
                    y,
                    classes: this.miniCellClasses(this.cells().get(key), off_route.has(key)),
                    orders: counts.get(key) ?? 0,
                    title: `[${x - town.x} ; ${town.y - y}]`
                });
            }
        }
        const drawings: MapRouteDrawing[] = route && route.cells.length > 1 ? [this.routeDrawing(route, box)] : [];
        return { box, cell_size, cells, drawings };
    });

    protected readonly summary: Signal<string> = computed((): string => {
        const roadbook: Roadbook | null = this.roadbook();
        const route: ExpeditionPartRoute | null = this.route();
        const orders_text: string = orderCountLabel(roadbook?.order_count ?? 0, roadbook?.cell_count ?? 0);
        if (!route) return orders_text;
        const ap_text: string = partApLabel(route.length, this.ruinAp());
        return orders_text ? `${ap_text} · ${orders_text}` : ap_text;
    });

    protected readonly off_route_count: Signal<number> = computed((): number => this.roadbook()?.off_route_count ?? 0);

    /** Clic sur la mini-carte (mode édition) : consigne sur la case visée. */
    protected onMiniMapClick(event: MouseEvent): void {
        if (!this.editable()) return;
        const target: HTMLElement | null = (<HTMLElement | null>event.target)?.closest('[data-cell]') ?? null;
        const key: string | undefined = target?.dataset['cell'];
        if (!key) return;
        const [x, y]: number[] = key.split(',').map(Number);
        const cell: MapRoutePoint = { x, y };
        if (routeIndexesOf(this.route()?.cells ?? [], cell).length > 1) {
            this.openPassageMenu(cell, event);
            return;
        }
        void this.order_editor.edit(this.part(), cell, null, this.form_context());
    }

    /** Ajoute une consigne sur la case du passage choisi dans le menu. */
    protected choosePassage(passage: number): void {
        const cell: MapRoutePoint | null = this.passage_cell();
        if (cell) void this.order_editor.edit(this.part(), cell, null, this.form_context(), passage);
    }

    protected addOrder(step: StepView): void {
        void this.order_editor.edit(this.part(), step.cell, null, this.form_context(), step.passage);
    }

    /** Ouvre le menu des passages de la case au point du clic. */
    private openPassageMenu(cell: MapRoutePoint, event: MouseEvent): void {
        const anchor: HTMLElement | undefined = this.passage_anchor()?.nativeElement;
        if (!anchor) return;
        this.passage_cell.set(cell);
        anchor.style.left = `${event.clientX}px`;
        anchor.style.top = `${event.clientY}px`;
        this.passage_trigger()?.openMenu();
    }

    protected editOrder(step: StepView, line: OrderLine): void {
        if (!this.editable()) return;
        void this.order_editor.edit(this.part(), step.cell, line.owned, this.form_context());
    }

    protected toggleDone(line: OrderLine, done: boolean): Promise<void> {
        return this.order_editor.toggleDone(line.owned.order, done);
    }

    /** PA de visite de ruine : ceux de la place du joueur filtré (visites de la partie comprises), sinon ceux de la partie. */
    private ruinAp(): number {
        const only_user: number | null = this.onlyUser();
        if (only_user === null) return ruinVisitAp(this.part());
        const place: CitizenExpedition | undefined = this.part().citizens.find((citizen: CitizenExpedition): boolean => citizen.citizen_id === only_user);
        return ruinVisitsOf(this.part(), place ?? Object.assign(new CitizenExpedition(), { orders: [] }));
    }

    private orderLine(owned: OwnedExpeditionOrder, index: number): OrderLine {
        const key: string = `${owned.owner.kind}-${owned.order.id ?? `new-${index}`}`;
        if (owned.owner.kind === 'part') {
            return { key, owned, scope: $localize`N'importe qui`, is_me: false };
        }
        const citizen: CitizenExpedition = owned.owner.citizen;
        const position: number = this.part().citizens.indexOf(citizen);
        const is_me: boolean = citizen.citizen_id !== undefined && citizen.citizen_id === this.me();
        return { key, owned, scope: is_me ? $localize`Moi` : memberLabel(citizen, position, this.citizens()), is_me };
    }

    private miniCellClasses(cell: Cell | undefined, off_route: boolean): string {
        const classes: string[] = ['mini-cell'];
        if (!cell) {
            classes.push('unknown');
        } else if (cell.is_town) {
            classes.push('town');
        } else {
            if (cell.is_never_visited) classes.push('unknown');
            else if (cell.max_potential_remaining_dig === 0 || cell.is_dryed) classes.push('depleted');
            if (cell.ruin_id === BURIED_RUIN_ID) classes.push('buried');
            else if (cell.ruin_id) classes.push('building');
        }
        if (off_route) classes.push('off');
        return classes.join(' ');
    }

    /** Tracé dessiné dans le repère de la mini-carte (cases décalées du coin du rectangle). */
    private routeDrawing(route: ExpeditionPartRoute, box: MiniMapBox): MapRouteDrawing {
        const shift: (point: MapRoutePoint) => MapRoutePoint = (point: MapRoutePoint): MapRoutePoint => ({ x: point.x - box.min_x, y: point.y - box.min_y });
        return {
            key: mapRouteKey('mho', route.id),
            color: route.color,
            cells: route.cells.map(shift),
            lane: 0,
            dashed: false,
            emphasized: true,
            dimmed: false,
            label: null
        };
    }
}
