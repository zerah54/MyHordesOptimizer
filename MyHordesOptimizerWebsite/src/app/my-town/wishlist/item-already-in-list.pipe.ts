import { Pipe, PipeTransform } from '@angular/core';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';


@Pipe({
    name: 'itemAlreadyInList',
    pure: false
})
export class ItemAlreadyInListPipe implements PipeTransform {
    transform(item: WishlistItem, items_in_list?: WishlistItem[]): boolean {
        if (!items_in_list) return false;
        const matches = items_in_list.filter(
            (w: WishlistItem): boolean => w.item.id === item.item.id && w.zone_x_pa === item.zone_x_pa
        );
        console.log('item', item.item.id, item.zone_x_pa, typeof item.zone_x_pa);
        console.log('matches', matches.map(w => ({id: w.item.id, zone: w.zone_x_pa, type: typeof w.zone_x_pa})));
        return matches.length > 1;
    }
}
