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
}
