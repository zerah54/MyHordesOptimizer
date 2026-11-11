import { UpdateInfoDTO } from './update-info.dto';
import { WishlistGroupDTO } from './wishlist-group.dto';
import { WishlistItemDTO } from './wishlist-item.dto';

export interface WishlistInfoDTO {
    wishList: WishlistItemDTO[];
    lastUpdateInfo: UpdateInfoDTO | null;
    groups?: WishlistGroupDTO[];
}
