import { RecipeDTO } from './../dto/recipe.dto';
import { CommonModel } from "./_common.class";

export class Recipe extends CommonModel<RecipeDTO> {

    constructor(dto?: RecipeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RecipeDTO {
        return {}
    };

    protected dtoToModel(dto?: RecipeDTO): void {

    };

}
