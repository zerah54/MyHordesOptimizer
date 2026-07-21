import { RecipeResultItemDTO } from '../dto/recipe-result-item.dto';
import { CommonModel } from './_common.class';
import { Item } from './item.class';

export class RecipeResultItem extends CommonModel<RecipeResultItemDTO> {
    public probability!: number;
    private weight!: number;
    public item!: Item;
    private picto_uid!: string;

    public constructor(dto?: RecipeResultItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeResultItemDTO {
        return {
            probability: this.probability,
            weight: this.weight,
            item: this.item.modelToDto(),
            pictoUid: this.picto_uid
        };
    }

    protected dtoToModel(dto?: RecipeResultItemDTO | null): void {
        if (dto) {
            this.item = new Item(dto.item);
            this.probability = dto.probability;
            this.weight = dto.weight;
            this.picto_uid = dto.pictoUid;
        }
    }

}
