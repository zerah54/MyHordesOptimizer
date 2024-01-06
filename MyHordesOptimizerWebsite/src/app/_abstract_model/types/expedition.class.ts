import { v4 as UUID } from 'uuid';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { ExpeditionPart } from './expedition-part.class';

export class Expedition extends CommonModel<ExpeditionDTO> {
    public id: string = UUID();
    public state: 'ready' | 'stop' = 'stop';
    public label!: string;
    public min_pdc!: number;
    public parts: ExpeditionPart[] = [];


    constructor(dto?: ExpeditionDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionDTO {
        return {
            id: this.id,
            state: this.state,
            label: this.label,
            minPdc: this.min_pdc,
            parts: modelToDtoArray(this.parts)
        };
    }

    protected override dtoToModel(dto?: ExpeditionDTO): void {
        if (dto) {
            this.id = dto.id;
            this.state = dto.state;
            this.label = dto.label;
            this.min_pdc = dto.minPdc;
            this.parts = dtoToModelArray(ExpeditionPart, dto.parts);
        } else {
            this.parts = [new ExpeditionPart()];
        }
    }

}
