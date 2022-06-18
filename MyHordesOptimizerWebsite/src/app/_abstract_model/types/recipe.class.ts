import { RecipeDTO } from './../dto/recipe.dto';
import { Item } from './item.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from "./_common.class";
import { I18nLabels } from './_types';

export class Recipe extends CommonModel<RecipeDTO> {
    public actions!: I18nLabels;
    public components!: Item[]
    public is_shaman_only!: boolean;
    public name!: string;
    public result!: Item[];
    public type!: "Workshop" | "Manual";

    constructor(dto?: RecipeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeDTO {
        return {
            actions: this.actions,
            components: modelToDtoArray(this.components),
            isShamanOnly: this.is_shaman_only,
            name: this.name,
            result: modelToDtoArray(this.result),
            type: this.type
        }
    };

    protected dtoToModel(dto?: RecipeDTO | null): void {
        if (dto) {
            this.actions = dto.actions;
            this.components = dtoToModelArray(Item, dto.components);
            this.is_shaman_only = dto.isShamanOnly;
            this.name = dto.name;
            this.result = dtoToModelArray(Item, dto.result);
            this.type = dto.type;
        }
    };

}
