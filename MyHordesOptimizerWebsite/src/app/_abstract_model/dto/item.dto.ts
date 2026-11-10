import { I18nLabels } from '../types/_types';
import { CatapultEffectDTO } from './catapult-effect.dto';
import { CategoryDTO } from './category.dto';
import { ChargeChanceDTO, ItemActionEffectsDTO } from './item-action-effects.dto';
import { ItemSummaryDTO } from './item-summary.dto';
import { RecipeDTO } from './recipe.dto';

/** Balise forum (`:item_xxx:`) des objets qui en ont une, par uid (`Fetcher/ItemEmotes`). */
export type ItemEmotesDTO = Record<string, string>;

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
    /** Effet catapulte réel de l'objet. `null` si l'objet n'est pas catapultable. */
    catapultEffect: CatapultEffectDTO | null;
    /** Effets des actions du jeu liées à l'objet (ouverture, abattage, purification, attaque, veille). */
    actionEffects: ItemActionEffectsDTO[];
    /** Charges possibles au rechargement. `null` si l'objet ne se recharge pas. */
    reloadCharges: ChargeChanceDTO[] | null;
    /** Impact sur la veille (0 si aucun). */
    watchImpact: number;
    /** Capacité supplémentaire apportée en tant que sac. `null` si ce n'est pas un sac. */
    bagCapacityBonus: number | null;
    /** Sacs qui ne se cumulent pas avec celui-ci. `null` si aucun groupe d'exclusion. */
    bagExclusiveGroup: ItemSummaryDTO[] | null;
    bankCount: number;
    wishListCount: number;
    dropRateNotPraf: number;
    dropRatePraf: number;
}
