import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { CommonModel } from './_common.class';

export class ExpeditionOrder extends CommonModel<ExpeditionOrderDTO> {
    public type!: string;
    public text!: string;
    public done!: boolean;

    constructor(dto?: ExpeditionOrderDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionOrderDTO {
        return {
            type: this.type,
            text: this.text,
            done: this.done,
        };
    }

    protected override dtoToModel(dto?: ExpeditionOrderDTO): void {
        if (dto) {
            this.type = dto.type;
            this.text = dto.text;
            this.done = dto.done;
        }
    }

}
