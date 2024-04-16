import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { CommonModel } from './_common.class';
import { ExpeditionOrderType } from './_types';

export class ExpeditionOrder extends CommonModel<ExpeditionOrderDTO> {
    public id?: number;
    public type!: ExpeditionOrderType;
    public text!: string;
    public is_done!: boolean;
    public position!: number;

    constructor(dto?: ExpeditionOrderDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionOrderDTO {
        return {
            id: this.id,
            type: this.type,
            text: this.text,
            isDone: this.is_done,
            position: this.position
        };
    }

    protected override dtoToModel(dto?: ExpeditionOrderDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.type = dto.type;
            this.text = dto.text;
            this.is_done = dto.isDone;
            this.position = dto.position;
        }
    }

}
