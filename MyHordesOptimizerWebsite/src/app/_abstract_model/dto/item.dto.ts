import { I18nLabels } from '../types/_types';
import { CategoryDTO } from './category.dto';
import { RecipeDTO } from './recipe.dto';

export interface ItemDTO {
    uid: string;
    img: string;
    /** Icône de l'objet cassé, `null` quand le jeu n'en prévoit pas de distincte (363 objets sur 383). */
    imgBroken: string | null;
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
