import { ItemDTO } from "./item.dto";

export interface RecipeResultItemDTO {
    probability: number;
    weight: number;
    item: ItemDTO;
}
