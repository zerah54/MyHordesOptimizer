import { ExpeditionPartDTO, ExpeditionPartShortDTO } from '../dto/expedition-part.dto';
import { Direction } from '../enum/direction.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { Dictionary } from './_types';
import { CitizenExpedition } from './citizen-expedition.class';
import { ExpeditionOrder } from './expedition-order.class';

export class ExpeditionPart extends CommonModel<ExpeditionPartDTO> {
    public id?: number;
    public orders!: ExpeditionOrder[];
    public citizens: CitizenExpedition[] = [];
    public path!: string;
    public position!: number;
    public direction: Dictionary<boolean> = {};


    constructor(dto?: ExpeditionPartDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionPartDTO {
        return {
            id: this.id,
            orders: modelToDtoArray(this.orders),
            citizens: modelToDtoArray(this.citizens),
            path: this.path,
            position: this.position,
            direction: Direction.getSelectedDirections(this.direction)[0] || undefined
        };
    }

    public modelToDtoShort(): ExpeditionPartShortDTO {
        return {
            id: this.id,
            ordersId: this.orders ? this.orders
                .filter((order: ExpeditionOrder) => order.id !== undefined && order.id !== null)
                .map((order: ExpeditionOrder) => <number>order.id) : [],
            citizensId: this.citizens ? this.citizens
                .filter((citizen: CitizenExpedition) => citizen.id !== undefined && citizen.id !== null)
                .map((citizen: CitizenExpedition) => <number>citizen.id) : [],
            path: this.path,
            position: this.position,
            direction: Direction.getSelectedDirections(this.direction)[0] || undefined
        };
    }

    protected override dtoToModel(dto?: ExpeditionPartDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.orders = dtoToModelArray(ExpeditionOrder, dto.orders);
            this.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                if (order_a.position < order_b.position) return -1;
                if (order_a.position > order_b.position) return 1;
                return 0;
            });
            this.citizens = dtoToModelArray(CitizenExpedition, dto.citizens);
            this.path = dto.path;
            this.position = dto.position;
            if (dto.direction) {
                this.direction[dto.direction] = true;
            }
        } else {
            this.citizens = [new CitizenExpedition()];
        }
    }

}
