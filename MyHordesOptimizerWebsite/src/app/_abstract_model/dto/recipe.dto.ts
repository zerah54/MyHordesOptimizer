import { I18nLabels } from '../types/_types';
import { ItemCountDTO } from './item-count.dto';
import { ItemDTO } from './item.dto';
import { RecipeResultItemDTO } from './recipe-result-item.dto';

export interface RecipeDTO {
    name: string;
    type: 'WORKSHOP' | 'MANUAL_ANYWHERE' | 'WORKSHOP_SHAMAN';
    components: ItemCountDTO[];
    result: RecipeResultItemDTO[];
    actions: I18nLabels;
    stealthy?: boolean;
    provoking?: ItemDTO;
}
