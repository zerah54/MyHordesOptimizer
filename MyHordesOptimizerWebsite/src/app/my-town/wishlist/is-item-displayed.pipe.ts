
import { Pipe, PipeTransform } from '@angular/core';
import { Item } from 'src/app/_abstract_model/types/item.class';


@Pipe({
    name: 'isItemDisplayed',
})
export class IsItemDisplayedPipe implements PipeTransform {
    transform(items: Item[]): Item[] {
        return items.filter((item: Item) => item.wishlist_count <= 0);
    }
}
