import { Pipe, PipeTransform } from '@angular/core';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';


@Pipe({
    name: 'isItemDisplayed',
})
export class IsItemDisplayedPipe implements PipeTransform {
    transform(items: Item[], items_in_zone: WishlistItem[]): Item[] {
        return items.filter((item: Item) => !items_in_zone.some((item_in_zone: WishlistItem) => item_in_zone.item.id === item.id));
    }
}
