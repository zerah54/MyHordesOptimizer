
import { Pipe, PipeTransform } from '@angular/core';
import { ItemCountShort } from 'src/app/_abstract_model/types/item-count-short.class';
import { Item } from 'src/app/_abstract_model/types/item.class';


@Pipe({
    name: 'arrayItemDetails',
})
export class ArrayItemDetailsPipe implements PipeTransform {
    transform(item: ItemCountShort[], all_items: Item[]): Item[] {
        return item.map((short_item: ItemCountShort): Item => <Item>all_items.find((item_in_all: Item) => item_in_all.id === short_item.item_id));
    }
}
