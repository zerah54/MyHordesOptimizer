import { Item } from './item.class';

export interface WishlistItem {
    item: Item;
    count: number;
    bank_count: number;
    priority: number;
}
