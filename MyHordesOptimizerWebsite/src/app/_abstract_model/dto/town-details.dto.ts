import { TownTypeId } from '../types/_types';

export interface TownDetailsDTO {
    townId: number;
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
