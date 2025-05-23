import { Pipe, PipeTransform } from '@angular/core';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { ItemCount } from '../../../../../_abstract_model/types/item-count.class';
import { Item } from '../../../../../_abstract_model/types/item.class';


@Pipe({
    name: 'itemsInBags'
})
export class ItemsInBagsPipe implements PipeTransform {
    transform(citizens: Citizen[], all_citizens: Citizen[]): ItemCount[] {
        const items: ItemCount[] = [];
        citizens.forEach((citizen: Citizen): void => {
            const complete_citizen: Citizen = <Citizen>all_citizens.find((citizen_in_all: Citizen): boolean => citizen_in_all.id === citizen.id);
            complete_citizen.bag?.items.forEach((item_in_bag: Item): void => {
                const listed_item: ItemCount | undefined = items.find((item: ItemCount) => item.item.id === item_in_bag.id && item.is_broken === item_in_bag.is_broken);
                if (!listed_item) {
                    items.push(new ItemCount({count: 1, isBroken: !!item_in_bag.is_broken, item: item_in_bag.modelToDto()}));
                } else {
                    listed_item.count++;
                }
            });
        });
        return items;
    }
}
