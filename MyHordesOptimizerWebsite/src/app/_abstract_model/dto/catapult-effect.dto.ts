import { ItemSummaryDTO } from './item-summary.dto';

/** Effet catapulte réel d'un objet — remplace l'ancienne propriété booléenne `fragile`. */
export interface CatapultEffectDTO {
    fate: 'Intact' | 'Broken' | 'Transformed' | 'Destroyed';
    /** Renseigné seulement si `fate` vaut `'Transformed'`. */
    morphTarget: ItemSummaryDTO | null;
    killMin: number | null;
    killMax: number | null;
    /** Renseigné seulement pour une variante de répulsion sans mise à mort. */
    repelSeconds: number | null;
    /** Renseigné si `killMin` ou `repelSeconds` l'est. */
    radius: 'Target' | 'Cross' | 'Square' | null;
}
