import { booleanAttribute, Component, input, Input, InputSignalWithTransform } from '@angular/core';
import { Cell } from '../../../../_abstract_model/types/cell.class';

@Component({
    selector: 'mho-map-border',
    templateUrl: './map-border.component.html',
    styleUrls: ['./map-border.component.scss', '../draw-map.component.scss'],
    host: {style: 'display: contents'},
})
export class MapBorderComponent {

    public horizontal: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public vertical: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    @Input() set index(index: null | number) {
        this.cell_index = index;
        this.isMyPos();
    }

    @Input() set myCell(cell: Cell | undefined) {
        this.my_cell = cell;
        this.isMyPos();
    }

    @Input() set hoveredCell(cell: Cell | undefined) {
        this.hovered_cell = cell;
        this.isHoveredPos();
    }

    public my_pos: boolean = false;
    public my_cell!: Cell | undefined;
    public hovered_cell!: Cell | undefined;
    public hovered_pos!: boolean;
    public cell_index: number | null = null;

    public isMyPos(): void {
        if (this.my_cell === undefined || this.my_cell === null || this.cell_index === undefined || this.cell_index === null) return;

        if (this.vertical() && this.my_cell.displayed_y === this.cell_index) {
            this.my_pos = true;
        }
        if (this.horizontal() && this.my_cell.displayed_x === this.cell_index) {
            this.my_pos = true;
        }
    }

    public isHoveredPos(): void {
        if (this.hovered_cell === undefined || this.hovered_cell === null || this.cell_index === undefined || this.cell_index === null) return;

        if (this.vertical() && this.hovered_cell.displayed_y === this.cell_index) {
            this.hovered_pos = true;
        } else if (this.horizontal() && this.hovered_cell.displayed_x === this.cell_index) {
            this.hovered_pos = true;
        } else {
            this.hovered_pos = false;
        }
    }

}
