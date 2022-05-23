import { RuinItemDTO } from './../dto/ruin-item.dto';
import { Item } from "./item.class";
import { CommonModel } from "./_common.class";

export class RuinItem extends CommonModel<RuinItemDTO> {
    public probability!: number;
    public weight!: number;
    public item!: Item;

    constructor(dto?: RuinItemDTO) {
        super();
        this.dtoToModel(dto);
    }
    
    public modelToDto(): RuinItemDTO {
        return {
            probability: this.probability,
            weight: this.weight,
            item: this.item.modelToDto()
        }
    };
    
    protected dtoToModel(dto?: RuinItemDTO): void {
        if (dto) {
            this.probability = dto.probability;
            this.weight = dto.weight;
            this.item = new Item(dto.item);
        }
    };
}
