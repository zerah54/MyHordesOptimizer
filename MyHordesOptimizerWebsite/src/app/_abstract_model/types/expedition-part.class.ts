import { ExpeditionPartDTO } from '../dto/expedition-part.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { CitizenExpedition } from './citizen-expedition.class';
import { ExpeditionOrder } from './expedition-order.class';

export class ExpeditionPart extends CommonModel<ExpeditionPartDTO> {
    public id!: string;
    public orders!: ExpeditionOrder[];
    public citizens: CitizenExpedition[] = [];
    public path!: string;


    constructor(dto?: ExpeditionPartDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionPartDTO {
        return {
            id: this.id,
            orders: modelToDtoArray(this.orders),
            citizens: modelToDtoArray(this.citizens),
            path: this.path
        };
    }

    protected override dtoToModel(dto?: ExpeditionPartDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.orders = dtoToModelArray(ExpeditionOrder, dto.orders);
            this.citizens = dtoToModelArray(CitizenExpedition, dto.citizens);
            this.path = dto.path;
        } else {
            this.citizens = [new CitizenExpedition()];
        }
    }

}
