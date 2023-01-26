
import { Pipe, PipeTransform } from '@angular/core';
import { ItemCountShort } from 'src/app/_abstract_model/types/item-count-short.class';
import { Item } from 'src/app/_abstract_model/types/item.class';


@Pipe({
    name: 'itemDetails',
})
export class ItemDetailsPipe implements PipeTransform {
    transform(item: ItemCountShort, all_items: Item[]): Item | undefined {
        return all_items.find((item_in_all: Item) => item_in_all.id === item.item_id);
    }
}
