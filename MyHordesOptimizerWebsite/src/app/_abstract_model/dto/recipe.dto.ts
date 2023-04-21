import { ItemDTO } from './item.dto';
import { I18nLabels } from '../types/_types';
import { RecipeResultItemDTO } from './recipe-result-item.dto';

export interface RecipeDTO {
    name: string;
    type: 'WORKSHOP' | 'MANUAL_ANYWHERE' | 'WORKSHOP_SHAMAN';
    components: ItemDTO[];
    result: RecipeResultItemDTO[];
    actions: I18nLabels;
}
