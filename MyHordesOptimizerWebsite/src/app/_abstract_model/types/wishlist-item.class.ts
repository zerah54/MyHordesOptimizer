import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { Item } from './item.class';
import { CommonModel } from './_common.class';

export class WishlistItem extends CommonModel<WishlistItemDTO> {
    public item!: Item;
    public count!: number;
    public bank_count!: number;
    public bag_count!: number;
    public priority!: number;
    public depot!: number;
    public zone_x_pa!: number;

    constructor(dto?: WishlistItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): WishlistItemDTO {
        return {
            count: this.count,
            bankCount: this.bank_count,
            item: this.item.modelToDto(),
            priority: this.priority,
            depot: this.depot,
            bagCount: this.bag_count,
            zoneXPa: this.zone_x_pa
        };
    };

    protected dtoToModel(dto?: WishlistItemDTO): void {
        if (dto) {
            this.count = dto.count;
            this.bank_count = dto.bankCount;
            this.item = new Item(dto.item);
            this.priority = dto.priority;
            this.depot = dto.depot;
            this.bag_count = dto.bagCount;
            this.zone_x_pa = dto.zoneXPa;
        }
    };
}
