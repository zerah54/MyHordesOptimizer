import { ShortWishlistItemDTO } from '../dto/short-wishlist-item.dto';
import { WishlistGroupDTO } from '../dto/wishlist-group.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistPutDTO } from '../dto/wishlist-put.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';
import { WishlistGroup } from './wishlist-group.class';
import { WishlistItem } from './wishlist-item.class';

export class WishlistInfo extends CommonModel<WishlistInfoDTO> {
    public wishlist_items!: WishlistItem[];
    public update_info!: UpdateInfo;
    public groups: WishlistGroup[] = [];

    public constructor(dto?: WishlistInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistInfoDTO {
        return {
            wishList: this.wishlist_items.map((item: WishlistItem) => item.modelToDto()),
            lastUpdateInfo: this.update_info?.modelToDto(),
            groups: this.groups.map((group: WishlistGroup): WishlistGroupDTO => group.modelToDto())
        };
    }

    /** Corps du PUT : les membres de groupe sont toujours conservés, les lignes seules à stock 0 sont écartées. */
    public toPutDto(): WishlistPutDTO {
        return {
            items: this.wishlist_items
                .filter((wishlist_item: WishlistItem): boolean => wishlist_item.group_uid !== null || !!wishlist_item.count)
                .map((wishlist_item: WishlistItem): ShortWishlistItemDTO => wishlist_item.toShortDto()),
            groups: this.groups.map((group: WishlistGroup): WishlistGroupDTO => group.modelToDto())
        };
    }

    /** Objets rattachés au groupe. */
    public membersOf(group_uid: string): WishlistItem[] {
        return this.wishlist_items.filter((wishlist_item: WishlistItem): boolean => wishlist_item.group_uid === group_uid);
    }

    /** Recopie zone, dépôt, priorité et stock du groupe sur ses seuls membres. */
    public applyGroupSettings(group: WishlistGroup): void {
        this.membersOf(group.uid).forEach((member: WishlistItem): void => {
            member.zone_x_pa = group.zone_x_pa;
            member.depot = group.depot;
            member.priority = group.priority;
            member.count = group.count;
        });
    }

    protected dtoToModel(dto?: WishlistInfoDTO | null): void {
        if (dto) {
            this.wishlist_items = dto.wishList.map((item: WishlistItemDTO) => new WishlistItem(item)) ?? [];
            this.wishlist_items.sort((item_a: WishlistItem, item_b: WishlistItem) => item_b.priority - item_a.priority);
            this.groups = (dto.groups ?? []).map((group: WishlistGroupDTO): WishlistGroup => new WishlistGroup(group));
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
