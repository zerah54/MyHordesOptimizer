import { ItemCountDTO } from '../dto/item-count.dto';
import { ShortItemCountDTO } from '../dto/short-item-count.dto';
import { Item } from './item.class';
import { CommonModel } from './_common.class';

export class ItemCount extends CommonModel<ItemCountDTO> {
    public count!: number;
    public is_broken!: boolean;
    public item!: Item;

    constructor(dto?: ItemCountDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemCountDTO {
        return {
            count: this.count,
            isBroken: this.is_broken,
            item: this.item.modelToDto()
        };
    }

    public toShortItemCount(): ShortItemCountDTO {
        return {
            count: this.count,
            isBroken: this.is_broken,
            id: this.item.id
        };
    }

    protected dtoToModel(dto?: ItemCountDTO): void {
        if (dto) {
            this.count = dto.count;
            this.is_broken = dto.isBroken;
            this.item = new Item(dto.item);
        }
    };

}
