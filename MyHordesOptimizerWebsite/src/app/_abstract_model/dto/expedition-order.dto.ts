import { ExpeditionOrderType } from '../types/_types';

export interface ExpeditionOrderDTO {
    id?: number;
    expeditionCitizenId?: number;
    expeditionPartsId?: number[];
    expeditionsId?: number[];
    type: ExpeditionOrderType;
    text: string;
    isDone: boolean;
    position: number;
    /** Case visée, en coordonnées absolues ; `null` (avec `y`) pour une consigne générale. */
    x?: number | null;
    y?: number | null;
    /** Clé de `ExpeditionOrderKind` ; `null` pour un texte libre. */
    kind?: string | null;
    itemId?: number | null;
    quantity?: number | null;
    heroSkill?: string | null;
    /** Citoyen à attendre ; `null` avec « wait » : le groupe. */
    targetUserId?: number | null;
}
