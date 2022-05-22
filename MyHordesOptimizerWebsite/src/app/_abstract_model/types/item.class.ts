import { Recipe } from './recipe.class';
import { Common } from './_common.class';
import { I18nLabels } from './_types';

export interface Item extends Common {
    actions: string[];
    bank_count: number;
    category: string;
    deco: number;
    description: I18nLabels;
    guard: number;
    img: string;
    is_heaver: boolean;
    json_id_name: string;
    label: I18nLabels;
    properties: string[];
    recipes: Recipe[];
    wishlist_count: number;
    xml_id: number;
    xml_name: string;
}
