import { gh_map, GhZone } from '../../../../conversion/gh-map.const';
import { DictionaryUtils } from '../dictionary.util';
import { Town } from '../../../_abstract_model/types/town.class';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Item } from '../../../_abstract_model/types/item.class';

export function convertGHMapIntoMHOMap(mho_map: Town, all_items: Item[]): void {

    if (gh_map) {
        console.log('const', gh_map.zoneRetour.ville.zones);
        console.log('mho_map', mho_map);
        // const mho_cells: CellDTO[] = (<GhZone[]>DictionaryUtils.getValues(gh_map.zoneRetour.ville.zones)).map((gh_zone: GhZone) => {
        //     console.log('gh_zone', gh_zone);
        // });
        (<GhZone[]>DictionaryUtils.getValues(gh_map.zoneRetour.ville.zones)).forEach((gh_zone: GhZone) => {
            const mho_cell: Cell | undefined = mho_map.cells.find((_mho_cell: Cell): boolean => {
                return _mho_cell.x === gh_zone.x && _mho_cell.y === gh_zone.y;
            });
            if (mho_cell) {
                mho_cell.danger_level = gh_zone.danger || 0;
                mho_cell.is_never_visited = gh_zone.dried === null;
                mho_cell.is_dryed = gh_zone.dried || false;
                const items_on_cell: Item[] = all_items.filter((item: Item): boolean => {
                    return (<string[]>DictionaryUtils.getValues(<Record<string, string>>gh_zone.itemsSolIcone)).some((gh_item: string) => gh_item === item.img);
                });
                console.log('gh_zone', gh_zone);
                console.log('mho_cell', items_on_cell);
            }
        });
    }
}
