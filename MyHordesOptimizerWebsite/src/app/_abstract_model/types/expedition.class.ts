import { ExpeditionDTO, ExpeditionShortDTO } from '../dto/expedition.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { ExpeditionPart } from './expedition-part.class';

export class Expedition extends CommonModel<ExpeditionDTO> {
    public id?: number;
    public state: 'ready' | 'stop' = 'stop';
    public label!: string;
    public min_pdc!: number;
    public parts: ExpeditionPart[] = [];
    public position!: number;


    constructor(dto?: ExpeditionDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionDTO {
        return {
            id: this.id,
            state: this.state,
            label: this.label,
            minPdc: this.min_pdc,
            parts: modelToDtoArray(this.parts),
            position: this.position
        };
    }

    public modelToDtoShort(): ExpeditionShortDTO {
        return {
            id: this.id,
            state: this.state,
            label: this.label,
            minPdc: this.min_pdc,
            partsId: this.parts ? this.parts
                .filter((part: ExpeditionPart) => part.id !== undefined && part.id !== null)
                .map((part: ExpeditionPart) => <number>part.id) : [],
            position: this.position
        };
    }

    protected override dtoToModel(dto?: ExpeditionDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.state = dto.state;
            this.label = dto.label;
            this.min_pdc = dto.minPdc;
            this.parts = dtoToModelArray(ExpeditionPart, dto.parts);
            this.parts.sort((part_a: ExpeditionPart, part_b: ExpeditionPart) => {
                if (part_a.position < part_b.position) return -1;
                if (part_a.position > part_b.position) return 1;
                return 0;
            });
            this.position = dto.position;
        }
    }

}
