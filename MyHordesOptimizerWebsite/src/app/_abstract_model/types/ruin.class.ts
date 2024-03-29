import { RuinDTO } from '../dto/ruin.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';
import { RuinItem } from './ruin-item.class';

export class Ruin extends CommonModel<RuinDTO> {
    public id!: number;
    public camping!: number;
    public chance!: number;
    public label!: I18nLabels;
    public description!: I18nLabels;
    public explorable!: boolean;
    public img!: string;
    public formatted_img!: string;
    public min_dist!: number;
    public max_dist!: number;
    public drops: RuinItem[] = [];
    public capacity?: number;

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
            drops: modelToDtoArray(this.drops),
            capacity: this.capacity
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
            if (this.img && this.img !== '') {
                this.formatted_img = 'ruin/' + dto.img + '.gif';
            }
            this.min_dist = dto.minDist;
            this.max_dist = dto.maxDist;
            this.drops = dtoToModelArray(RuinItem, dto.drops).sort((drop_a: RuinItem, drop_b: RuinItem) => {
                if (drop_a.probability < drop_b.probability) {
                    return 1;
                } else if (drop_b.probability < drop_a.probability) {
                    return -1;
                } else {
                    return 0;
                }
            });
            this.capacity = dto.capacity;
        }
    }
}
