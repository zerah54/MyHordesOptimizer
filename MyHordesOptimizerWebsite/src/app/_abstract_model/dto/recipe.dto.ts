import { I18nLabels } from '../types/_types';
import { ItemDTO } from './item.dto';
import { ItemCountDTO } from './item-count.dto';
import { RecipeResultItemDTO } from './recipe-result-item.dto';

export type RecipeType =
    | 'Recipe::WorkshopType'
    | 'Recipe::WorkshopTypeShamanSpecific'
    | 'Recipe::WorkshopTypeTechSpecific'
    | 'Recipe::ManualOutside'
    | 'Recipe::ManualInside'
    | 'Recipe::ManualAnywhere';

export interface RecipeDTO {
    name: string;
    type: RecipeType;
    components: ItemCountDTO[];
    result: RecipeResultItemDTO[];
    actions: I18nLabels;
    stealthy?: boolean;
    provoking?: ItemDTO;
}
