import { I18nLabels } from '../types/_types';
import { RecipeDTO } from './recipe.dto';

export interface ItemDTO {
    actions: string[];
    bankCount: number;
    category: string;
    deco: number;
    description: I18nLabels;
    guard: number;
    img: string;
    isHeaver: boolean;
    jsonIdName: string;
    label: I18nLabels;
    properties: string[];
    recipes: RecipeDTO[];
    wishListCount: number;
    xmlId: number;
    xmlName: string;
}
