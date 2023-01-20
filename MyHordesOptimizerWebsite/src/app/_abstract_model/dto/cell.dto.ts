import { ItemCountShortDTO } from './item-count-short.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface CellDTO {
    cellId: number;
    x: number;
    y: number;
    isTown: boolean;
    isVisitedToday: boolean;
    isNeverVisited: boolean;
    dangerLevel: number;
    idRuin: number;
    isDryed: boolean;
    nbZombie: number;
    nbZombieKilled: number;
    nbHero: number;
    isRuinCamped: boolean;
    isRuinDryed: boolean;
    nbRuinDig: number;
    totalSucces: number;
    averagePotentialRemainingDig: number;
    maxPotentialRemainingDig: number;
    lastUpdateInfo: UpdateInfoDTO;
    items: ItemCountShortDTO[];
    nbKm: number;
    nbPa: number;
    zoneRegen?: string;
}
