import { CellDTO } from './cell.dto';

export interface TownDTO {
    townId: number;
    townX: number;
    townY: number;
    mapHeight: number;
    mapWidth: number;
    isChaos: boolean;
    isDevasted: boolean;
    isDoorOpen: boolean;
    waterWell: number;
    day: number;
    cells: CellDTO[];
}
