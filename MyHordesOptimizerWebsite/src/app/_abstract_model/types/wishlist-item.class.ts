import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { CommonModel } from './_common.class';
import { Item } from './item.class';

export class WishlistItem extends CommonModel<WishlistItemDTO> {
    public item!: Item;
    public count!: number;
    public bank_count!: number;
    public bag_count!: number;
    public priority!: number;
    public depot!: WishlistDepot;
    public should_signal!: boolean;
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
            depot: this.depot.value.count,
            bagCount: this.bag_count,
            zoneXPa: this.zone_x_pa,
            shouldSignal: this.should_signal
        };
    }

    protected dtoToModel(dto?: WishlistItemDTO): void {
        if (dto) {
            this.count = dto.count;
            this.bank_count = dto.bankCount;
            this.item = new Item(dto.item);
            this.priority = dto.priority;
            this.depot = WishlistDepot.getDepotFromCountAndPriority(dto.depot, dto.priority);
            this.should_signal = dto.shouldSignal;
            this.bag_count = dto.bagCount;
            this.zone_x_pa = dto.zoneXPa;
        }
    }
}
