import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { Category } from 'src/app/_abstract_model/types/category.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { groupBy } from '../utilities/array.util';


@Pipe({
    name: 'itemsGroupByCategory',
})
export class ItemsGroupByCategory implements PipeTransform {

    private locale: string = moment.locale();

    transform(items: Item[], order_by?: 'id'): CategoryWithItem[] {
        items = items.sort((item_a: Item, item_b: Item) => {
            return item_a.label[this.locale].toLowerCase().localeCompare(item_b.label[this.locale].toLowerCase());
        });
        const items_by_categories: Item[][] = groupBy(items, (item: Item) => item.category.id_category);

        let categories: CategoryWithItem[] = items_by_categories.map((items_for_category: Item[]) => {
            return {
                category: items_for_category[0].category,
                items: items_for_category
            };
        });
        categories = categories.sort((category_a: CategoryWithItem, category_b: CategoryWithItem) => category_a.category.ordering - category_b.category.ordering);

        if (order_by) {
            categories.forEach((category: CategoryWithItem) => {
                category.items
                    .sort((item_a: Item, item_b: Item) => item_a.id - item_b.id)
                    .sort((item_a: Item, item_b: Item) => item_b.img.localeCompare(item_a.img));
            });
        }
        return categories;
    }
}

interface CategoryWithItem {
    category: Category;
    items: Item[];
}
