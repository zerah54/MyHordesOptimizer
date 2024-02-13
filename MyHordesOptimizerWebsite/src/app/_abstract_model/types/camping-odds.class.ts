import { CampingOddsDTO } from '../dto/camping-odds.dto';
import { CommonModel } from './_common.class';
import { I18nLabels } from './_types';

export class CampingOdds extends CommonModel<CampingOddsDTO> {
    public probability!: number;
    public bounded_probability!: number;
    public label!: I18nLabels;


    constructor(dto?: CampingOddsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CampingOddsDTO {
        return {
            probability: this.probability,
            boundedProbability: this.bounded_probability,
            label: this.label,
        };
    }

    protected override dtoToModel(dto?: CampingOddsDTO): void {
        if (dto) {
            this.probability = dto.probability;
            this.bounded_probability = dto.boundedProbability;
            this.label = dto.label;
        }
    }

}
