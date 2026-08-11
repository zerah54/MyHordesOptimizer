import { I18nLabels } from '../types/_types';
import { CategoryDTO } from './category.dto';
import { ItemSummaryDTO } from './item-summary.dto';
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
    /** Objets permettant d'ouvrir celui-ci. `null` si ce n'est pas un contenant. */
    openedWith: ItemSummaryDTO[] | null;
    /** Contenants que cet objet permet d'ouvrir. */
    opens: ItemSummaryDTO[];
    /** Coût en PA d'une tentative d'ouverture sans outil, pour un contenant à risque d'échec. */
    openApCost: number | null;
    /** Chance de réussite (0..1) associée à `openApCost`. */
    openSuccessRate: number | null;
    /** Coût en PC de l'alternative réservée au métier Technicien à l'outil requis, si elle existe. */
    technicianOpenCpCost: number | null;
    bankCount: number;
    wishListCount: number;
    dropRateNotPraf: number;
    dropRatePraf: number;
}
