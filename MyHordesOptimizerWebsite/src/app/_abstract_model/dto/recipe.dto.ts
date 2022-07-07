import { ItemDTO } from './item.dto';
import { I18nLabels } from './../types/_types';
import { RecipeResultItemDTO } from './recipe-result-item.dto';

export interface RecipeDTO {
    actions: I18nLabels;
    components: ItemDTO[]
    isShamanOnly: boolean;
    name: string;
    result: RecipeResultItemDTO[];
    type: "Workshop" | "Manual";
}
