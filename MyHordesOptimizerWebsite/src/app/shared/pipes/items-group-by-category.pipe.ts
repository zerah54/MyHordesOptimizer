import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { groupBy } from '../utilities/array.util';
import { normalizeString } from '../utilities/string.utils';


@Pipe({
    name: 'itemsGroupByCategory',
    standalone: true,
})
export class ItemsGroupByCategory implements PipeTransform {

    private locale: string = moment.locale();

    transform(items: Item[], order_by?: 'id'): CategoryWithItem[] {
        items = items.sort((item_a: Item, item_b: Item) => {
            return normalizeString(item_a.label[this.locale]).localeCompare(normalizeString(item_b.label[this.locale]));
        });
        const items_by_categories: Item[][] = groupBy(items, (item: Item) => item.category.id_category);

        let categories: CategoryWithItem[] = items_by_categories.map((items_for_category: Item[]): CategoryWithItem => {
            return {
                category: items_for_category[0].category,
                items: items_for_category
            };
        });
        categories = categories.sort((category_a: CategoryWithItem, category_b: CategoryWithItem) => category_a.category.ordering - category_b.category.ordering);

        if (order_by) {
            categories.forEach((category: CategoryWithItem): void => {
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
