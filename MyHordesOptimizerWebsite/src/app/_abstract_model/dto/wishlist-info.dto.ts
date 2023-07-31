import { UpdateInfoDTO } from './update-info.dto';
import { WishlistItemDTO } from './wishlist-item.dto';

export interface WishlistInfoDTO {
    wishList: Record<string, WishlistItemDTO[]>;
    lastUpdateInfo: UpdateInfoDTO | null;
}
