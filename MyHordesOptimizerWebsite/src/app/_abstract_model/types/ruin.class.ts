import { RuinDTO } from '../dto/ruin.dto';
import { RuinItem } from './ruin-item.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';

export class Ruin extends CommonModel<RuinDTO> {
    public id!: number;
    public camping!: number;
    public chance!: number;
    public label!: I18nLabels;
    public description!: I18nLabels;
    public explorable!: boolean;
    public img!: string;
    public min_dist!: number;
    public max_dist!: number;
    public drops: RuinItem[] = [];

    constructor(dto?: RuinDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RuinDTO {
        return {
            id: this.id,
            camping: this.camping,
            chance: this.chance,
            label: this.label,
            description: this.description,
            explorable: this.explorable,
            img: this.img,
            minDist: this.min_dist,
            maxDist: this.max_dist,
            drops: modelToDtoArray(this.drops)
        };
    }

    protected dtoToModel(dto?: RuinDTO): void {
        if (dto) {
            this.id = +dto.id;
            this.camping = dto.camping;
            this.chance = dto.chance;
            this.label = dto.label;
            this.description = dto.description;
            this.explorable = dto.explorable;
            this.img = dto.img;
            this.min_dist = dto.minDist;
            this.max_dist = dto.maxDist;
            this.drops = dtoToModelArray(RuinItem, dto.drops);
        }
    }
}
