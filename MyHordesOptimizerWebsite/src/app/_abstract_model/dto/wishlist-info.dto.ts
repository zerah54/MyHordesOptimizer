import { Dictionary } from './../types/_types';
import { UpdateInfoDTO } from './update-info.dto';
import { WishlistItemDTO } from './wishlist-item.dto';

export interface WishlistInfoDTO {
    wishList: Dictionary<WishlistItemDTO>;
    lastUpdateInfo: UpdateInfoDTO | null;
}
