import { Item } from './item.class';
import { Common } from './_common.class';

export interface WishlistItem extends Common {
    item: Item;
    count: number;
    bank_count: number;
    priority: number;
}
