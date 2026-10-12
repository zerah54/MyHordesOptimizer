import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    InputSignal,
    InputSignalWithTransform,
    output,
    OutputEmitterRef,
    Signal,
    signal,
    untracked,
    viewChild,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { groupBy } from '../../../_core/utilities/array.util';
import { getUserId } from '../../../_core/utilities/localstorage.util';
import { MapOptions } from '../map.component';
import { MapOrderBadge } from '../map-orders/map-order-badges';
import { MapRouteDrawing } from '../map-routes/map-route-views';
import { pointKey } from '../map-routes/route-path.util';
import { MapBorderComponent } from './map-border/map-border.component';
import { MapCellComponent, MapCellSelection } from './map-cell/map-cell.component';
import { MapCellDetailsComponent } from './map-cell-details/map-cell-details.component';
import { MapRoutesLayerComponent } from './map-routes-layer/map-routes-layer.component';
import { MapUpdateComponent, MapUpdateData } from './map-update/map-update.component';

const angular_common: Imports = [CommonModule, NgTemplateOutlet];
const components: Imports = [MapBorderComponent, MapCellComponent, MapCellDetailsComponent, MapRoutesLayerComponent];
const pipes: Imports = [];
const material_modules: Imports = [];

/** Seuils du zoom sémantique : en dessous de COMPACT_BELOW la case n'a plus la place
 *  d'afficher ses indicateurs secondaires, au-delà de DETAIL_FROM elle peut en montrer plus. */
const COMPACT_BELOW: number = 28;
const DETAIL_FROM: number = 60;

/** Appui long au toucher (mode tracé) : durée avant de couper le tracé, et déplacement toléré en pixels. */
const LONG_PRESS_DELAY: number = 500;
const LONG_PRESS_TOLERANCE: number = 10;

export type ZoomTier = 'compact' | 'standard' | 'detail';

/** Case choisie en mode tracé, et si elle l'a été au toucher (premier toucher = aperçu). */
export interface MapCellPick extends MapRoutePoint {
    readonly touch: boolean;
}

/** Appui long en cours sur une case du tracé. */
interface LongPress {
    readonly pointer_id: number;
    readonly client_x: number;
    readonly client_y: number;
    readonly cell: MapRoutePoint;
    readonly timer: ReturnType<typeof setTimeout>;
    readonly element: HTMLElement;
}

/** Case choisie : la cellule, son élément (le panneau de détail s'y accroche) et sa place dans
 *  la grille (pour la croix de repérage et pour remplacer la cellule après une mise à jour). */
interface SelectedCell extends MapCellSelection {
    row: number;
    column: number;
}

@Component({
    selector: 'mho-draw-map',
    templateUrl: './draw-map.component.html',
    styleUrls: ['./draw-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class DrawMapComponent {

    public allRuins: InputSignal<Ruin[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    /** Options qui changent le CONTENU des cases. Volontairement distinctes du zoom : ce dernier
     *  ne doit pas invalider l'entrée `options` des ~900 mho-map-cell à chaque cran de molette. */
    public options: InputSignal<MapOptions> = input.required();
    /** Côté d'une case, en pixels. */
    public zoom: InputSignal<number> = input.required();
    public map: InputSignal<Town> = input.required();
    /** Tracés à dessiner par-dessus les cases. Entrée distincte des options : un tracé modifié ne touche
     *  pas les cases, et le calque ne dépend pas du zoom (unités de case). */
    public routes: InputSignal<readonly MapRouteDrawing[]> = input<readonly MapRouteDrawing[]>([]);
    /** Pastilles des cases à consignes, posées sur le calque des tracés. */
    public orderBadges: InputSignal<readonly MapOrderBadge[]> = input<readonly MapOrderBadge[]>([]);
    /** Mode tracé : un clic choisit une destination au lieu d'ouvrir le détail de la zone. */
    public routeEditing: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /** Mode tracé : case cliquée. */
    public cellPicked: OutputEmitterRef<MapCellPick> = output();
    /** Mode tracé : case survolée à la souris, `null` en quittant une case. */
    public cellHovered: OutputEmitterRef<MapRoutePoint | null> = output();
    /** Mode tracé : cases du tracé saisi (« x,y »), où un clic droit ou un appui long le coupe. */
    public editedCells: InputSignal<ReadonlySet<string>> = input<ReadonlySet<string>>(new Set<string>());
    /** Mode tracé : clic droit ou appui long sur une case du tracé saisi. */
    public cellCut: OutputEmitterRef<MapRoutePoint> = output();

    // Signaux (pas de simples champs) : lus par le template sous OnPush, un `effect()` qui les
    // muterait comme de simples champs ne marquerait pas la vue pour vérification.
    protected readonly x_row: WritableSignal<number[]> = signal([]);
    protected readonly complete_map: WritableSignal<Town | undefined> = signal(undefined);
    protected readonly my_cell: WritableSignal<Cell | undefined> = signal(undefined);
    protected readonly drawed_map: WritableSignal<Cell[][]> = signal([]);
    protected readonly selected: WritableSignal<SelectedCell | undefined> = signal(undefined);
    protected hovered_cell: Cell | undefined;

    protected readonly selected_cell: Signal<Cell | undefined> = computed((): Cell | undefined => this.selected()?.cell);
    protected readonly selected_row: Signal<number> = computed((): number => this.selected()?.row ?? -1);
    protected readonly selected_column: Signal<number> = computed((): number => this.selected()?.column ?? -1);

    protected readonly is_readonly: Signal<boolean> = computed((): boolean => this.town_context.isReadonly());
    /** Consignes modifiables : aussi sur une ancienne ville observée, dont la zone reste en lecture seule. */
    protected readonly can_contribute: Signal<boolean> = computed((): boolean => this.town_context.canContribute());

    protected readonly cell_size: Signal<string> = computed((): string => `${this.zoom()}px`);

    /** Gabarit de colonnes construit en une seule chaîne : `repeat()` accepte mal un décompte
     *  passé par variable CSS, et une propriété personnalisée évite N liaisons de style. */
    protected readonly columns_template: Signal<string> = computed((): string => {
        return `var(--mho-axis) repeat(${this.x_row().length}, var(--mho-cell)) var(--mho-axis)`;
    });

    protected readonly zoom_tier: Signal<ZoomTier> = computed((): ZoomTier => {
        const zoom: number = this.zoom();
        if (zoom < COMPACT_BELOW) return 'compact';
        if (zoom >= DETAIL_FROM) return 'detail';
        return 'standard';
    });

    private readonly grid: Signal<ElementRef<HTMLElement> | undefined> = viewChild('mapGrid');
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Type du dernier pointeur enfoncé sur la grille : le `click` qui suit ne le dit pas partout. */
    private last_pointer_type: string = 'mouse';
    private long_press: LongPress | null = null;
    /** Un appui long vient de couper le tracé : le `click` éventuel du relâchement n'ajoute rien. */
    private suppress_click: boolean = false;

    /** Écoutés seulement pendant un appui long, hors gabarit : un `pointermove` relancerait la détection à chaque pixel. */
    private readonly onLongPressMove: (event: PointerEvent) => void = (event: PointerEvent): void => {
        const press: LongPress | null = this.long_press;
        if (!press || event.pointerId !== press.pointer_id) return;
        if (Math.hypot(event.clientX - press.client_x, event.clientY - press.client_y) > LONG_PRESS_TOLERANCE) {
            this.cancelLongPress();
        }
    };

    private readonly onLongPressEnd: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (this.long_press && event.pointerId === this.long_press.pointer_id) {
            this.cancelLongPress();
        }
    };

    public constructor() {
        this.destroy_ref.onDestroy((): void => this.cancelLongPress());

        // Passage en mode tracé : le détail ouvert ne correspond plus à ce que fait un clic.
        effect((): void => {
            if (this.routeEditing()) {
                untracked((): void => this.selected.set(undefined));
            }
        });

        // Reproduit l'ancien setter `@Input() set map` : ne réagit qu'à `map`, ignore une valeur
        // absente/falsy exactement comme le faisait le `if (map)` du setter.
        effect((): void => {
            const map: Town = this.map();
            if (map) {
                this.complete_map.set(map);
                this.x_row.set(Array.from({ length: map?.map_width }, (_: unknown, i: number) => i - +map.town_x));
                const rows: Cell[][] = groupBy(map?.cells || [], (cell: Cell) => cell.y);

                rows.forEach((row: Cell[]) => {
                    row.sort((cell_a: Cell, cell_b: Cell) => {
                        if (cell_a.x < cell_b.x) return -1;
                        if (cell_a.x > cell_b.x) return 1;
                        return 0;
                    });
                });

                rows.sort((row_a: Cell[], row_b: Cell[]) => {
                    if (row_a[0].y < row_b[0].y) return -1;
                    if (row_a[0].y > row_b[0].y) return 1;
                    return 0;
                });

                this.my_cell.set(map.cells.find((cell: Cell) => cell.citizens.some((citizen: Citizen) => citizen.id === getUserId())));

                this.drawed_map.set(rows);
                // Une nouvelle carte remet à plat les éléments retenus : la case choisie ne
                // correspond plus à rien, et son élément a été détruit.
                this.selected.set(undefined);
            }
        });
    }

    /** Ramène la case du joueur au centre de la zone visible. */
    public scrollToMyCell(): boolean {
        return this.scrollTo('.map-cell.is-me');
    }

    /** Ramène la case choisie au centre de la zone visible (après un changement de zoom). */
    public scrollToSelectedCell(): boolean {
        return this.scrollTo('.map-cell.selected');
    }

    public hasMyCell(): boolean {
        return this.my_cell() !== undefined;
    }

    protected onPointerDown(event: PointerEvent): void {
        this.last_pointer_type = event.pointerType;
        this.suppress_click = false;
        this.cancelLongPress();
        if (event.pointerType !== 'touch' || !(event.currentTarget instanceof HTMLElement)) return;
        const cell: MapRoutePoint | undefined = this.editedCellAt(event.target);
        if (!cell) return;
        const element: HTMLElement = event.currentTarget;
        element.addEventListener('pointermove', this.onLongPressMove);
        element.addEventListener('pointerup', this.onLongPressEnd);
        element.addEventListener('pointercancel', this.onLongPressEnd);
        this.long_press = {
            pointer_id: event.pointerId,
            client_x: event.clientX,
            client_y: event.clientY,
            cell,
            element,
            timer: setTimeout((): void => {
                this.cancelLongPress();
                this.suppress_click = true;
                this.cellCut.emit(cell);
            }, LONG_PRESS_DELAY)
        };
    }

    /** Clic droit sur le tracé saisi : le coupe, sans menu du navigateur. Ailleurs, le menu reste. */
    protected onContextMenu(event: MouseEvent): void {
        const cell: MapRoutePoint | undefined = this.editedCellAt(event.target);
        if (!cell) return;
        event.preventDefault();
        this.cancelLongPress();
        this.cellCut.emit(cell);
    }

    protected onHoveredCell(cell: Cell | undefined): void {
        this.hovered_cell = cell;
        if (this.routeEditing()) {
            this.cellHovered.emit(cell ? { x: cell.x, y: cell.y } : null);
        }
    }

    protected selectCell(selection: MapCellSelection, row: number, column: number): void {
        if (this.routeEditing()) {
            if (this.suppress_click) {
                this.suppress_click = false;
                return;
            }
            this.cellPicked.emit({ x: selection.cell.x, y: selection.cell.y, touch: this.last_pointer_type === 'touch' });
            return;
        }
        const current: SelectedCell | undefined = this.selected();
        // Recliquer la case ouverte la referme : sans cela, seule la croix du panneau permettrait
        // de s'en débarrasser.
        if (current && current.row === row && current.column === column) {
            this.selected.set(undefined);
            return;
        }
        this.selected.set({ ...selection, row, column });
    }

    protected closeDetail(): void {
        this.selected.set(undefined);
    }

    /** Éditeur de zone. Il vivait dans la case ; il est remonté ici avec la sélection, pour que la
     *  case n'ait plus à connaître MatDialog — 900 injections pour une action à la fois. */
    protected openCellUpdate(): void {
        const selected: SelectedCell | undefined = this.selected();
        // Mode observateur : la carte reste consultable, mais on n'ouvre pas l'éditeur de cellule.
        if (!selected || this.is_readonly()) {
            return;
        }

        this.dialog
            .open(MapUpdateComponent, {
                data: <MapUpdateData>{
                    cell: selected.cell,
                    ruin: selected.cell.ruin_id ? this.allRuins().find((ruin: Ruin) => ruin.id === selected.cell.ruin_id) : undefined,
                    all_ruins: this.allRuins(),
                    all_citizens: this.allCitizens()
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((new_cell: Cell) => {
                if (!new_cell) return;
                this.drawed_map()[selected.row][selected.column] = new_cell;
                this.selected.set({ ...selected, cell: new_cell });
            });
    }

    /**
     * Case du tracé saisi sous un élément de la grille, `undefined` hors mode tracé ou hors du tracé. Retrouvée par
     * sa place dans la grille (ligne puis colonne) : pas d'attribut par case, ce gabarit en rend des centaines.
     */
    private editedCellAt(target: EventTarget | null): MapRoutePoint | undefined {
        if (!this.routeEditing() || !(target instanceof Element)) return undefined;
        const cell_element: Element | null = target.closest('mho-map-cell');
        const row_element: Element | null | undefined = cell_element?.parentElement;
        const grid: HTMLElement | undefined = this.grid()?.nativeElement;
        if (!cell_element || !row_element || !grid) return undefined;
        const rows: Element[] = Array.from(grid.children)
            .filter((child: Element): boolean => child.classList.contains('map-row') && !child.classList.contains('axis-row'));
        const columns: Element[] = Array.from(row_element.children).filter((child: Element): boolean => child.tagName === 'MHO-MAP-CELL');
        const cell: Cell | undefined = this.drawed_map()[rows.indexOf(row_element)]?.[columns.indexOf(cell_element)];
        if (!cell) return undefined;
        const point: MapRoutePoint = { x: cell.x, y: cell.y };
        return this.editedCells().has(pointKey(point)) ? point : undefined;
    }

    private cancelLongPress(): void {
        const press: LongPress | null = this.long_press;
        if (!press) return;
        clearTimeout(press.timer);
        press.element.removeEventListener('pointermove', this.onLongPressMove);
        press.element.removeEventListener('pointerup', this.onLongPressEnd);
        press.element.removeEventListener('pointercancel', this.onLongPressEnd);
        this.long_press = null;
    }

    private scrollTo(selector: string): boolean {
        const target: HTMLElement | null | undefined = this.grid()?.nativeElement.querySelector(selector);
        if (!target) return false;
        target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        return true;
    }

}
