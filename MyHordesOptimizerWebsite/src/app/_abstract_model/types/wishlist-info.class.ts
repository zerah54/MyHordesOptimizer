import { ShortWishlistItemDTO } from '../dto/short-wishlist-item.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';
import { WishlistItem } from './wishlist-item.class';

export class WishlistInfo extends CommonModel<WishlistInfoDTO> {
    public wishlist_items!: WishlistItem[];
    public update_info!: UpdateInfo;

    constructor(dto?: WishlistInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistInfoDTO {
        return {
            wishList: this.wishlist_items.map((item: WishlistItem) => item.modelToDto()),
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    public toListItem(): ShortWishlistItemDTO[] {
        return this.wishlist_items
            .filter((wishlist_item: WishlistItem) => wishlist_item.count)
            .map((wishlist_item: WishlistItem) => {
                return {
                    id: wishlist_item.item.id,
                    priority: wishlist_item.priority,
                    count: wishlist_item.count,
                    depot: wishlist_item.depot.value.count,
                    zoneXPa: wishlist_item.zone_x_pa,
                    shouldSignal: wishlist_item.should_signal
                };
            });
    }

    protected dtoToModel(dto?: WishlistInfoDTO | null): void {
        if (dto) {
            this.wishlist_items = dto.wishList.map((item: WishlistItemDTO) => new WishlistItem(item));
            this.wishlist_items.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority);
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
