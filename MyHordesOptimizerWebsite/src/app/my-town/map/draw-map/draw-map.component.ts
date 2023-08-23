import { Component, HostBinding, Input } from '@angular/core';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { groupBy } from '../../../shared/utilities/array.util';
import { MapOptions } from '../map.component';

@Component({
    selector: 'mho-draw-map',
    templateUrl: './draw-map.component.html',
    styleUrls: ['./draw-map.component.scss']
})
export class DrawMapComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() allRuins!: Ruin[];
    @Input() allItems!: Item[];
    @Input() allCitizens!: Citizen[];
    @Input() options!: MapOptions;

    @Input() set map(map: Town) {
        if (map) {
            this.complete_map = map;
            this.x_row = Array.from({ length: map?.map_width }, (_: unknown, i: number) => i - +map.town_x);

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

            this.drawed_map = rows;
        }
    }

    public x_row: number[] = [];

    public complete_map!: Town;
    public drawed_map: Cell[][] = [];

    public trackByCellId(_index: number, column: Cell): number {
        return column && column.cell_id;
    }
}
