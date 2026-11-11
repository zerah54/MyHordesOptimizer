import { ShortWishlistItemDTO } from './short-wishlist-item.dto';
import { WishlistGroupDTO } from './wishlist-group.dto';

export interface WishlistPutDTO {
    items: ShortWishlistItemDTO[];
    groups: WishlistGroupDTO[];
}
