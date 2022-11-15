import { BankItemDTO } from './../dto/bank-item.dto';
import { Item } from './item.class';
import { CommonModel } from './_common.class';

export class BankItem extends CommonModel<BankItemDTO> {
    public item!: Item;
    public count!: number;
    public wishlist_count!: number;
    public is_broken!: boolean;

    constructor(dto?: BankItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BankItemDTO {
        return {
            count: this.count,
            wishListCount: this.wishlist_count,
            item: this.item.modelToDto(),
            isBroken: this.is_broken
        }
    };

    protected dtoToModel(dto?: BankItemDTO): void {
        if (dto) {
            this.count = dto.count;
            this.wishlist_count = dto.wishListCount;
            this.item = new Item(dto.item);
            this.is_broken = dto.isBroken;
        }
    };
}
