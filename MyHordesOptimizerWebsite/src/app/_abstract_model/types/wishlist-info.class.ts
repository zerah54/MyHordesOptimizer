import { UpdateInfo } from './update-info.class';
import { WishlistItem } from './wishlist-item.class';

export interface WishlistInfo {
    wishlist_items: WishlistItem[];
    update_info: UpdateInfo | null;
}
