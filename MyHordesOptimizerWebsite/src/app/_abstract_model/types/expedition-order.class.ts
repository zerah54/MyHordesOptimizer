import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { CommonModel } from './_common.class';

export class ExpeditionOrder extends CommonModel<ExpeditionOrderDTO> {
    public id!: number;
    public type!: string;
    public text!: string;
    public done!: boolean;
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
            done: this.done,
            position: this.position
        };
    }

    protected override dtoToModel(dto?: ExpeditionOrderDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.type = dto.type;
            this.text = dto.text;
            this.done = dto.done;
            this.position = dto.position;
        }
    }

}
