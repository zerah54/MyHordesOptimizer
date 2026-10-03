import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

import { Category } from '../../_abstract_model/types/category.class';
import { Item } from '../../_abstract_model/types/item.class';
import { groupBy } from '../utilities/array.util';
import { localizedLabel, normalizeString } from '../utilities/string.utils';


@Pipe({
    name: 'itemsGroupByCategory'
})
export class ItemsGroupByCategoryPipe implements PipeTransform {

    private locale: string = moment.locale();

    public transform(items: Item[], order_by?: 'id'): CategoryWithItem[] {
        items = items.sort((item_a: Item, item_b: Item) => {
            return normalizeString(localizedLabel(item_a.label, this.locale))
                .localeCompare(normalizeString(localizedLabel(item_b.label, this.locale)));
        });
        const items_by_categories: Item[][] = groupBy(items, (item: Item) => item.category.id_category);

        let categories: CategoryWithItem[] = items_by_categories.map((items_for_category: Item[]): CategoryWithItem => {
            return {
                category: items_for_category[0].category,
                items: items_for_category
            };
        });
        // Une catégorie sans `ordering` donne un NaN qui neutralise la comparaison : le groupe
        // orphelin restait alors en tête, devant toutes les vraies catégories. Il passe en fin de
        // liste — il n'est pas masqué pour autant, c'est le symptôme d'objets vides à l'import.
        categories = categories.sort((category_a: CategoryWithItem, category_b: CategoryWithItem) => {
            const ordering_a: number = Number.isFinite(category_a.category?.ordering) ? category_a.category.ordering : Number.MAX_SAFE_INTEGER;
            const ordering_b: number = Number.isFinite(category_b.category?.ordering) ? category_b.category.ordering : Number.MAX_SAFE_INTEGER;
            return ordering_a - ordering_b;
        });

        if (order_by) {
            categories.forEach((category: CategoryWithItem): void => {
                category.items
                    .sort((item_a: Item, item_b: Item) => item_a.id - item_b.id)
                    .sort((item_a: Item, item_b: Item) => (item_b.img ?? '').localeCompare(item_a.img ?? ''));
            });
        }
        return categories;
    }
}

interface CategoryWithItem {
    category: Category;
    items: Item[];
}
