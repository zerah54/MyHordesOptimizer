import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { CommonModel } from './_common.class';
import { Item } from './item.class';

export class WishlistItem extends CommonModel<WishlistItemDTO> {
    public item!: Item;
    public count!: number;
    public bank_count!: number;
    public bag_count!: number;
    public bag_citizens: string[] = [];
    /** Quantité totale dans les coffres des citoyens vivants de la ville. */
    public chest_count!: number;
    /** Pseudos des citoyens vivants dont le coffre contient l'objet. */
    public chest_citizens: string[] = [];
    /** Quantité posée sur les cases de la carte (toutes cases de la ville confondues). */
    public map_cell_item_count!: number;
    public priority!: number;
    public depot!: WishlistDepot;
    public should_signal!: boolean;
    public zone_x_pa!: number;

    public constructor(dto?: WishlistItemDTO) {
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
            bagCitizens: this.bag_citizens,
            chestCount: this.chest_count,
            chestCitizens: this.chest_citizens,
            mapCellItemCount: this.map_cell_item_count,
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
            this.bag_citizens = dto.bagCitizens ?? [];
            this.chest_count = dto.chestCount;
            this.chest_citizens = dto.chestCitizens ?? [];
            this.map_cell_item_count = dto.mapCellItemCount;
            this.zone_x_pa = dto.zoneXPa;
        }
    }
}
