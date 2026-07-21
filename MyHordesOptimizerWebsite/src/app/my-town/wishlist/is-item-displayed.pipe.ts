import { Pipe, PipeTransform } from '@angular/core';

import { Item } from '../../_abstract_model/types/item.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';


@Pipe({
    name: 'isItemDisplayed'
})
export class IsItemDisplayedPipe implements PipeTransform {
    public transform(items: Item[], items_in_list: WishlistItem[], current_zone_xp_pa_add_item: number): Item[] {
        return items.filter((item: Item) => !items_in_list.some((item_in_list: WishlistItem) => item_in_list.item.id === item.id && item_in_list.zone_x_pa === current_zone_xp_pa_add_item));
    }
}
