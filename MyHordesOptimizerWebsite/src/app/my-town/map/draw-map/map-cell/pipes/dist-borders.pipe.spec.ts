import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Distance, MapOptions } from '../../../map.component';
import { DistBorderBottom, DistBorderLeft, DistBorderRight, DistBorderTop } from './dist-borders.pipe';

function newCell(x: number, y: number, nb_km: number, nb_pa: number = nb_km): Cell {
    const cell: Cell = new Cell();
    cell.x = x;
    cell.y = y;
    cell.nb_km = nb_km;
    cell.nb_pa = nb_pa;
    return cell;
}

function optionsWith(distances: Distance[]): MapOptions {
    return <MapOptions>{ distances };
}

describe('DistBorder pipes', (): void => {
    /** Case centrale à 5 km, entourée d'une seule voisine plus éloignée : à droite. */
    const center: Cell = newCell(1, 1, 5);
    const grid: Cell[][] = [
        [newCell(0, 0, 4), newCell(1, 0, 4), newCell(2, 0, 4)],
        [newCell(0, 1, 4), center, newCell(2, 1, 6)],
        [newCell(0, 2, 4), newCell(1, 2, 4), newCell(2, 2, 4)]
    ];

    it('renvoie la bordure de la zone du côté de la case plus éloignée seulement', (): void => {
        const options: MapOptions = optionsWith([{ value: 5, unit: 'km', color: '#e0483d', border_style: 'solid' }]);

        expect(new DistBorderRight().transform(center, options, grid)).toBe('2px solid #e0483d');
        expect(new DistBorderLeft().transform(center, options, grid)).toBeNull();
        expect(new DistBorderTop().transform(center, options, grid)).toBeNull();
        expect(new DistBorderBottom().transform(center, options, grid)).toBeNull();
    });

    it('ne trace rien sur une case qui n\'est pas à la distance de la zone', (): void => {
        const options: MapOptions = optionsWith([{ value: 3, unit: 'km' }]);

        expect(new DistBorderRight().transform(center, options, grid)).toBeNull();
    });

    it('laisse la première zone de la liste l\'emporter quand deux tombent sur le même bord', (): void => {
        const options: MapOptions = optionsWith([
            { value: 5, unit: 'km', color: '#3b7fd6', border_style: 'solid' },
            { value: 5, unit: 'pa', color: '#e0483d', border_style: 'dotted' }
        ]);

        expect(new DistBorderRight().transform(center, options, grid)).toBe('2px solid #3b7fd6');
    });
});
