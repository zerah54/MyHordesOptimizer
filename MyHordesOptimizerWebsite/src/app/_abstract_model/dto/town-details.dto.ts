import { TownTypeId } from '../types/_types';

export interface TownDetailsDTO {
    townId: number;
    /** Nom de la ville. Optionnel : absent des réponses d'une API pas encore redéployée, et null
     *  hors ville. */
    townName?: string | null;
    townX: number;
    townY: number;
    townMaxX: number;
    townMaxY: number;
    isChaos: boolean;
    isDevaste: boolean;
    day: number;
    townType: TownTypeId;
    /** La ville a-t-elle activé l option d API externe de MyHordes ? Null si non constaté. */
    hasExternalApi: boolean | null;
}
