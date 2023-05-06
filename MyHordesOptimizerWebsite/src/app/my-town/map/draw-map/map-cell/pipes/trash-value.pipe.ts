import { Pipe, PipeTransform } from '@angular/core';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { MapOptions } from '../../../map.component';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { Trash } from '../../../../../_abstract_model/enum/trash.enum';
import { Property } from '../../../../../_abstract_model/enum/property.enum';


@Pipe({
    name: 'trashValue',
})
export class TrashValuePipe implements PipeTransform {
    transform(cell: Cell, option: MapOptions, items: Item[]): number {
        option;
        let value: number = 0;
        const decharge: boolean = true;
        if (cell && decharge) {
            const trashes: Trash[] = Trash.getAllValues();
            const decharge_humidifiee: boolean = true;
            console.log(trashes);
            cell.items.forEach((short_item: ItemCountShort): void => {
                const item: Item = <Item>items.find((_item: Item): boolean => _item.id === short_item.item_id);
                if (item) {
                    let item_value: number = 0;
                    trashes
                        .filter((trash: Trash) => item.properties.find((property: Property): boolean => trash.value.property?.key === property.key))
                        .forEach((trash: Trash): void => {
                            const specialized: boolean = true;
                            if (option.trash_mode === 'def') {
                                item_value += ((decharge_humidifiee ? trash.value.improved_value : trash.value.value) + (specialized ? trash.value.specialized_trash_add_value : 0)) * short_item.count;
                            } else {
                                item_value += short_item.count;
                            }
                        });

                    value += item_value;
                }
            });
        }
        return value;
    }
}
