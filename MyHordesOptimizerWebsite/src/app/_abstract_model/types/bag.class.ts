import * as moment from 'moment';
import { Moment } from 'moment';
import { BagDTO } from '../dto/bag.dto';
import { ItemCount } from './item-count.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';

export class Bag extends CommonModel<BagDTO> {
    public bag_id!: number;
    public items!: ItemCount[];
    public last_update_date_update?: Moment;
    public last_update_user_name!: string;

    constructor(dto?: BagDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BagDTO {
        return {
            idBag: this.bag_id,
            items: modelToDtoArray(this.items),
            lastUpdateDateUpdate: this.last_update_date_update ? this.last_update_date_update.toDate() : new Date(),
            lastUpdateUserName: this.last_update_user_name
        };
    }

    protected dtoToModel(dto?: BagDTO): void {
        if (dto) {
            this.bag_id = dto.idBag;
            this.items = dtoToModelArray(ItemCount, dto.items);
            this.last_update_date_update = dto.lastUpdateDateUpdate ? moment(dto.lastUpdateDateUpdate) : undefined;
            this.last_update_user_name = dto.lastUpdateUserName;
        }
    };

}
