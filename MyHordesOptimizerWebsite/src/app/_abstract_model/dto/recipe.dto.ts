import { I18nLabels } from '../types/_types';
import { RecipeResultItemDTO } from './recipe-result-item.dto';
import { ItemCountDTO } from './item-count.dto';

export interface RecipeDTO {
    name: string;
    type: 'WORKSHOP' | 'MANUAL_ANYWHERE' | 'WORKSHOP_SHAMAN';
    components: ItemCountDTO[];
    result: RecipeResultItemDTO[];
    actions: I18nLabels;
}
