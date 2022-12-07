import * as moment from 'moment';
import { Moment } from 'moment';
import { BagDTO } from '../dto/bag.dto';
import { ItemCount } from './item-count.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';

export class Bag extends CommonModel<BagDTO> {
    public bag_id!: number;
    public items!: ItemCount[];
    public update_time?: Moment;
    public username!: string;

    constructor(dto?: BagDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BagDTO {
        return {
            idBag: this.bag_id,
            items: modelToDtoArray(this.items),
            lastUpdateDateUpdate: this.update_time ? this.update_time.toDate() : new Date(),
            lastUpdateUserName: this.username
        };
    }

    protected dtoToModel(dto?: BagDTO): void {
        if (dto) {
            this.bag_id = dto.idBag;
            this.items = dtoToModelArray(ItemCount, dto.items);
            this.update_time = dto.lastUpdateDateUpdate ? moment.parseZone(dto.lastUpdateDateUpdate).local() : undefined;
            this.username = dto.lastUpdateUserName;
        }
    };

}
