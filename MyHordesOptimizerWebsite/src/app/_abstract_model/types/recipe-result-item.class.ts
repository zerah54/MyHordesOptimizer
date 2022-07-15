import { RecipeResultItemDTO } from '../dto/recipe-result-item.dto';
import { Item } from './item.class';
import { CommonModel } from "./_common.class";

export class RecipeResultItem extends CommonModel<RecipeResultItemDTO> {
    public probability!: number;
    public weight!: number;
    public item!: Item;
    public picto_uid!: string;

    constructor(dto?: RecipeResultItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeResultItemDTO {
        return {
            probability: this.probability,
            weight: this.weight,
            item: this.item.modelToDto(),
            pictoUid: this.picto_uid
        }
    };

    protected dtoToModel(dto?: RecipeResultItemDTO | null): void {
        if (dto) {
            this.item = new Item(dto.item);
            this.probability = dto.probability;
            this.weight = dto.weight;
            this.picto_uid = dto.pictoUid;
        }
    };

}
