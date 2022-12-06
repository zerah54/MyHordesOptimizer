import { I18nLabels } from '../types/_types';
import { CategoryDTO } from './category.dto';
import { RecipeDTO } from './recipe.dto';

export interface ItemDTO {
    uid: string;
    img: string;
    label: I18nLabels;
    description: I18nLabels;
    id: number;
    category: CategoryDTO;
    deco: number;
    isHeaver: boolean;
    guard: number;
    properties: string[];
    actions: string[];
    recipes: RecipeDTO[];
    bankCount: number;
    wishListCount: number;
    dropRateNotPraf: number;
    dropRatePraf: number;
}
