import { ItemCountShortDTO } from '../dto/item-count-short.dto';
import { CommonModel } from './_common.class';

export class ItemCountShort extends CommonModel<ItemCountShortDTO> {
    public count!: number;
    public is_broken!: boolean;
    public item_id!: number;

    constructor(dto?: ItemCountShortDTO | null | undefined) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemCountShortDTO {
        return {
            itemCount: this.count,
            isItemBroken: this.is_broken,
            itemId: this.item_id
        };
    }

    protected dtoToModel(dto?: ItemCountShortDTO | null | undefined): void {
        if (dto) {
            this.count = dto.itemCount;
            this.is_broken = dto.isItemBroken;
            this.item_id = dto.itemId;
        }
    };

}
