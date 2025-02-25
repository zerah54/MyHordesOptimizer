import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Distance, MapOptions } from '../../../map.component';


@Pipe({
    name: 'distBorderLeft'
})
export class DistBorderLeft implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        let border: boolean = false;
        options.distances.forEach((distance: Distance) => {
            if (!border) {
                if (distance.unit === 'km') {
                    border = drawed_map[cell.y][cell.x - 1] && drawed_map[cell.y][cell.x - 1].nb_km > cell.nb_km && cell.nb_km === distance.value;
                } else {
                    if (!distance.round_trip) {
                        border = drawed_map[cell.y][cell.x - 1] && drawed_map[cell.y][cell.x - 1].nb_pa > cell.nb_pa && cell.nb_pa === distance.value;
                    } else {
                        border = drawed_map[cell.y][cell.x - 1] && drawed_map[cell.y][cell.x - 1].nb_pa > cell.nb_pa && cell.nb_pa <= (distance.value / 2) && cell.nb_pa > ((distance.value / 2) - 1);
                    }
                }
            }
        });
        return border;
    }
}

@Pipe({
    name: 'distBorderRight'
})
export class DistBorderRight implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        let border: boolean = false;
        options.distances.forEach((distance: Distance) => {
            if (!border) {
                if (distance.unit === 'km') {
                    border = drawed_map[cell.y][cell.x + 1] && drawed_map[cell.y][cell.x + 1].nb_km > cell.nb_km && cell.nb_km === distance.value;
                } else {
                    if (!distance.round_trip) {
                        border = drawed_map[cell.y][cell.x + 1] && drawed_map[cell.y][cell.x + 1].nb_pa > cell.nb_pa && cell.nb_pa === distance.value;
                    } else {
                        border = drawed_map[cell.y][cell.x + 1] && drawed_map[cell.y][cell.x + 1].nb_pa > cell.nb_pa && cell.nb_pa <= (distance.value / 2) && cell.nb_pa > ((distance.value / 2) - 1);
                    }
                }
            }
        });
        return border;
    }
}

@Pipe({
    name: 'distBorderTop'
})
export class DistBorderTop implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        let border: boolean = false;
        options.distances.forEach((distance: Distance) => {
            if (!border) {
                if (distance.unit === 'km') {
                    border = drawed_map[cell.y - 1] && drawed_map[cell.y - 1][cell.x].nb_km > cell.nb_km && cell.nb_km === distance.value;
                } else {
                    if (!distance.round_trip) {
                        border = drawed_map[cell.y - 1] && drawed_map[cell.y - 1][cell.x].nb_pa > cell.nb_pa && cell.nb_pa === distance.value;
                    } else {
                        border = drawed_map[cell.y - 1] && drawed_map[cell.y - 1][cell.x].nb_pa > cell.nb_pa && cell.nb_pa <= (distance.value / 2) && cell.nb_pa > ((distance.value / 2) - 1);
                    }
                }
            }
        });
        return border;
    }
}

@Pipe({
    name: 'distBorderBottom'
})
export class DistBorderBottom implements PipeTransform {
    transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        let border: boolean = false;
        options.distances.forEach((distance: Distance) => {
            if (!border) {
                if (distance.unit === 'km') {
                    border = drawed_map[cell.y + 1] && drawed_map[cell.y + 1][cell.x].nb_km > cell.nb_km && cell.nb_km === distance.value;
                } else {
                    if (!distance.round_trip) {
                        border = drawed_map[cell.y + 1] && drawed_map[cell.y + 1][cell.x].nb_pa > cell.nb_pa && cell.nb_pa === distance.value;
                    } else {
                        border = drawed_map[cell.y + 1] && drawed_map[cell.y + 1][cell.x].nb_pa > cell.nb_pa && cell.nb_pa <= (distance.value / 2) && cell.nb_pa > ((distance.value / 2) - 1);
                    }
                }
            }
        });
        return border;
    }
}

