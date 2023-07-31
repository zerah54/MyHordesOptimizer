import { TownType } from '../types/_types';

export interface TownDetailsDTO {
    townId: number;
    townX: number;
    townY: number;
    townMaxX: number;
    townMaxY: number;
    isDevaste: boolean;
    day: number;
    townType: TownType;
}
