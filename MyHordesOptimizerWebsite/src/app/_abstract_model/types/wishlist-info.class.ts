import { UpdateInfo } from './update-info.class';
import { WishlistItem } from './wishlist-item.class';
import { Common } from './_common.class';

export interface WishlistInfo extends Common {
    wishlist_items: WishlistItem[];
    update_info: UpdateInfo | null;
}
