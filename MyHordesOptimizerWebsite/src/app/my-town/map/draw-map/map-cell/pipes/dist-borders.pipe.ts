import { Pipe, PipeTransform } from '@angular/core';

import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Distance, MapOptions } from '../../../map.component';

/**
 * Une case porte un filet de distance du côté où elle touche une case plus éloignée : c'est la
 * dernière case du cercle. Les quatre pipes ne diffèrent que par la voisine considérée ; la règle
 * elle-même était recopiée quatre fois, avec un accès non protégé `drawed_map[y ± 1][x]` qui
 * lève dès qu'une ligne est plus courte que les autres.
 */
function crossesDistanceRing(cell: Cell, neighbour: Cell | undefined, distances: Distance[]): boolean {
    if (!neighbour) return false;

    return distances.some((distance: Distance): boolean => {
        if (distance.unit === 'km') {
            return neighbour.nb_km > cell.nb_km && cell.nb_km === distance.value;
        }
        if (!distance.round_trip) {
            return neighbour.nb_pa > cell.nb_pa && cell.nb_pa === distance.value;
        }
        /** Aller/retour : le budget utile à l'aller est la moitié du total. */
        const half: number = distance.value / 2;
        return neighbour.nb_pa > cell.nb_pa && cell.nb_pa <= half && cell.nb_pa > half - 1;
    });
}

@Pipe({
    name: 'distBorderLeft'
})
export class DistBorderLeft implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesDistanceRing(cell, drawed_map[cell.y]?.[cell.x - 1], options.distances);
    }
}

@Pipe({
    name: 'distBorderRight'
})
export class DistBorderRight implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesDistanceRing(cell, drawed_map[cell.y]?.[cell.x + 1], options.distances);
    }
}

@Pipe({
    name: 'distBorderTop'
})
export class DistBorderTop implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesDistanceRing(cell, drawed_map[cell.y - 1]?.[cell.x], options.distances);
    }
}

@Pipe({
    name: 'distBorderBottom'
})
export class DistBorderBottom implements PipeTransform {
    public transform(cell: Cell, options: MapOptions, drawed_map: Cell[][]): boolean {
        return crossesDistanceRing(cell, drawed_map[cell.y + 1]?.[cell.x], options.distances);
    }
}
