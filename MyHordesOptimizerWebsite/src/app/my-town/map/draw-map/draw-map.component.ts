import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    InputSignal,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { groupBy } from '../../../_core/utilities/array.util';
import { getUserId } from '../../../_core/utilities/localstorage.util';
import { MapOptions } from '../map.component';
import { MapBorderComponent } from './map-border/map-border.component';
import { MapCellComponent, MapCellSelection } from './map-cell/map-cell.component';
import { MapCellDetailsComponent } from './map-cell-details/map-cell-details.component';
import { MapUpdateComponent, MapUpdateData } from './map-update/map-update.component';

const angular_common: Imports = [CommonModule, NgTemplateOutlet];
const components: Imports = [MapBorderComponent, MapCellComponent, MapCellDetailsComponent];
const pipes: Imports = [];
const material_modules: Imports = [];

/** Seuils du zoom sémantique : en dessous de COMPACT_BELOW la case n'a plus la place
 *  d'afficher ses indicateurs secondaires, au-delà de DETAIL_FROM elle peut en montrer plus. */
const COMPACT_BELOW: number = 28;
const DETAIL_FROM: number = 60;

export type ZoomTier = 'compact' | 'standard' | 'detail';

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

    public constructor() {
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

    protected selectCell(selection: MapCellSelection, row: number, column: number): void {
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

    private scrollTo(selector: string): boolean {
        const target: HTMLElement | null | undefined = this.grid()?.nativeElement.querySelector(selector);
        if (!target) return false;
        target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        return true;
    }

}
