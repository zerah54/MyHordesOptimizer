import { Recipe } from './../types/recipe.class';

export class RecipeDtoTransform {

    public static transformDtoArray(array: RecipeDTO[]): Recipe[] {
        return array.map((dto: RecipeDTO) => this.dtoToClass(dto))
    }

    public static dtoToClass(dto: RecipeDTO): Recipe {
        return {

        };
    }

}

export interface RecipeDTO {
}
