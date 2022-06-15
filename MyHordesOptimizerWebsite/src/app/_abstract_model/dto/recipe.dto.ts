import { ItemDTO } from './item.dto';
import { I18nLabels } from './../types/_types';

export interface RecipeDTO {
    actions: I18nLabels;
    components: ItemDTO[]
    isShamanOnly: boolean;
    name: string;
    result: ItemDTO[];
    type: "Workshop" | "Manual";
}
