import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, input, Input, InputSignal } from '@angular/core';
import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { groupBy } from '../../../shared/utilities/array.util';
import { getUserId } from '../../../shared/utilities/localstorage.util';
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
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class DrawMapComponent {

    public allRuins: InputSignal<Ruin[]> = input.required();
    public allItems: InputSignal<Item[]> = input.required();
    public allCitizens: InputSignal<Citizen[]> = input.required();
    public options: InputSignal<MapOptions> = input.required();

    @Input() set map(map: Town) {
        if (map) {
            console.log('map', map);
            this.complete_map = map;
            this.x_row = Array.from({length: map?.map_width}, (_: unknown, i: number) => i - +map.town_x);
            console.log('x-row', this.x_row);
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

            this.my_cell = map.cells.find((cell: Cell) => cell.citizens.some((citizen: Citizen) => citizen.id === getUserId()));

            this.drawed_map = rows;
        }
    }

    public x_row: number[] = [];

    public complete_map!: Town;
    public my_cell: Cell | undefined;
    public hovered_cell: Cell | undefined;
    public drawed_map: Cell[][] = [];

}
