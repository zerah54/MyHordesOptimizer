import { Pipe, PipeTransform } from '@angular/core';

import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';


@Pipe({
    name: 'itemAlreadyInList',
    pure: false
})
export class ItemAlreadyInListPipe implements PipeTransform {
    public transform(item: WishlistItem, items_in_list?: WishlistItem[]): boolean {
        if (!items_in_list) return false;
        const matches: WishlistItem[] = items_in_list.filter(
            (w: WishlistItem): boolean => w.item.id === item.item.id && w.zone_x_pa === item.zone_x_pa
        );
        return matches.length > 1;
    }
}
