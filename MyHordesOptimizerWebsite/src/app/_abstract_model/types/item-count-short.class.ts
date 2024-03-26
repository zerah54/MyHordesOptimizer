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
            count: this.count,
            isBroken: this.is_broken,
            id: this.item_id
        };
    }

    protected dtoToModel(dto?: ItemCountShortDTO | null | undefined): void {
        if (dto) {
            this.count = dto.count;
            this.is_broken = dto.isBroken;
            this.item_id = dto.id;
        }
    }

}
