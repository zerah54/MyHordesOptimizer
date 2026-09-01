import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, InputSignal, signal, WritableSignal } from '@angular/core';

import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { groupBy } from '../../../_core/utilities/array.util';
import { getUserId } from '../../../_core/utilities/localstorage.util';
import { MapOptions } from '../map.component';
import { MapBorderComponent } from './map-border/map-border.component';
import { MapCellComponent } from './map-cell/map-cell.component';

const angular_common: Imports = [CommonModule, NgTemplateOutlet];
const components: Imports = [MapBorderComponent, MapCellComponent];
const pipes: Imports = [];
const material_modules: Imports = [];

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
    public options: InputSignal<MapOptions> = input.required();
    public map: InputSignal<Town> = input.required();

    // Signaux (pas de simples champs) : lus par le template sous OnPush, un `effect()` qui les
    // muterait comme de simples champs ne marquerait pas la vue pour vérification.
    protected readonly x_row: WritableSignal<number[]> = signal([]);
    protected readonly complete_map: WritableSignal<Town | undefined> = signal(undefined);
    protected readonly my_cell: WritableSignal<Cell | undefined> = signal(undefined);
    protected readonly drawed_map: WritableSignal<Cell[][]> = signal([]);
    protected hovered_cell: Cell | undefined;

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
            }
        });
    }

}
