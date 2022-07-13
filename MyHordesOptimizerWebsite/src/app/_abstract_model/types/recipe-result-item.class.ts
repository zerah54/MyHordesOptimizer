import { RecipeResultItemDTO } from '../dto/recipe-result-item.dto';
import { RecipeDTO } from './../dto/recipe.dto';
import { Item } from './item.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from "./_common.class";
import { I18nLabels } from './_types';

export class RecipeResultItem extends CommonModel<RecipeResultItemDTO> {
    public probability!: number;
    public weight!: number;
    public item!: Item;

    constructor(dto?: RecipeResultItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeResultItemDTO {
        return {
            probability: this.probability,
            weight: this.weight,
            item: this.item.modelToDto()
        }
    };

    protected dtoToModel(dto?: RecipeResultItemDTO | null): void {
        if (dto) {
            this.item = new Item(dto.item);
            this.probability = dto.probability;
            this.weight = dto.weight;
        }
    };

}
