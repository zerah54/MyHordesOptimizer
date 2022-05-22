import { Item } from './item.class';
import { Common } from './_common.class';

export interface BankItem extends Common {
    item: Item;
    count: number;
    wishlist_count: number;
}
