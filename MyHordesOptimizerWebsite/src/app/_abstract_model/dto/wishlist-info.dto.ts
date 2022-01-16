import { WishlistInfo } from './../types/wishlist-info.class';
import { Dictionary } from './../types/_types';
import { UpdateInfoDTO, UpdateInfoDtoTransform } from './update-info.dto';
import { WishlistItemDTO, WishlistItemDtoTransform } from './wishlist-item.dto';

export class WishlistInfoDtoTransform {

    public static dtoToClass(dto: WishlistInfoDTO | null): WishlistInfo {
        return {
            wishlist_items: dto ? WishlistItemDtoTransform.transformDtoDictionary(dto.wishList) : [],
            update_info: dto ? UpdateInfoDtoTransform.dtoToClass(dto.lastUpdateInfo ? dto.lastUpdateInfo : null) : null
        };
    }
}

export interface WishlistInfoDTO {
    wishList: Dictionary<WishlistItemDTO>;
    lastUpdateInfo: UpdateInfoDTO | null;
}
