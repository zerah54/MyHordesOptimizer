import { ShortWishlistItemDTO } from '../dto/short-wishlist-item.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { UpdateInfo } from './update-info.class';
import { WishlistItem } from './wishlist-item.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';

export class WishlistInfo extends CommonModel<WishlistInfoDTO> {
    public wishlist_items!: Map<string, WishlistItem[]>;
    public update_info!: UpdateInfo;

    constructor(dto?: WishlistInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistInfoDTO {
        const wishlist_items_dto: Map<string, WishlistItemDTO[]> = new Map();
        for (const key in this.wishlist_items) {
            wishlist_items_dto[key] = modelToDtoArray(this.wishlist_items[key]);
        }
        return {
            wishList: wishlist_items_dto,
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    public toListItem(): ShortWishlistItemDTO[] {
        const array_wishlist_items: WishlistItem[][] = Array.from(this.wishlist_items.values());
        let flat_wishlist_items: WishlistItem[] = [];
        array_wishlist_items.forEach((items: WishlistItem[]) => {
            flat_wishlist_items = flat_wishlist_items.concat(items);
        });
        return flat_wishlist_items
            .filter((wishlist_item: WishlistItem) => wishlist_item.count)
            .map((wishlist_item: WishlistItem) => {
                return {
                    id: wishlist_item.item.id,
                    priority: wishlist_item.priority,
                    count: wishlist_item.count,
                    depot: wishlist_item.depot,
                    zoneXPa: wishlist_item.zone_x_pa
                };
            });
    }

    protected dtoToModel(dto?: WishlistInfoDTO | null): void {
        if (dto) {
            this.wishlist_items = new Map();
            for (const key in dto.wishList) {
                let list_items: WishlistItemDTO[] = dto.wishList[key];
                list_items = list_items.sort((item_a: WishlistItemDTO, item_b: WishlistItemDTO) => item_b.priority - item_a.priority);
                this.wishlist_items.set(key, dtoToModelArray(WishlistItem, list_items));
            }
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }

}
