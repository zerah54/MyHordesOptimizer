import { CitizenDTO } from './citizen.dto';
import { ItemCountShortDTO } from './item-count-short.dto';
import { UpdateInfoDTO } from './update-info.dto';

export interface CellDTO {
    cellId: number;
    x: number;
    y: number;
    displayX: number;
    displayY: number;
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
    /** Niveau d'abondance de la zone relevé par un fouineur, de 0 (épuisée) à 3 (abondante) */
    scavZoneLevel: number | null;
    /** Niveau d'exploration de la zone relevé par un éclaireur, de 0 à 3 */
    scoutZoneLevel: number | null;
    /** Estimation bruitée du nombre de zombies, issue du radar d'un éclaireur voisin */
    scoutEstimationZombie: number | null;
    /** Borne basse du nombre réel de zombies déduite de l'estimation */
    scoutEstimationMin: number | null;
    /** Borne haute du nombre réel de zombies déduite de l'estimation */
    scoutEstimationMax: number | null;
    /** Fraîcheur propre à l'estimation, à comparer à lastUpdateInfo */
    scoutEstimationLastUpdateInfo: UpdateInfoDTO | null;
    lastUpdateInfo: UpdateInfoDTO;
    items: ItemCountShortDTO[];
    citizens: CitizenDTO[];
    nbKm: number;
    nbPa: number;
    zoneRegen?: string;
    note: string;
    nbRuinSuccess: number;
    nbERuinBlue: number;
    nbERuinYellow: number;
    nbERuinViolet: number;
}

/** Radar du fouineur : true signifie que la case voisine est épuisée */
export interface ScavNextCellsDTO {
    north: boolean | null;
    south: boolean | null;
    east: boolean | null;
    west: boolean | null;
}

/** Radar de l'éclaireur : estimation du nombre de zombies sur la case voisine */
export interface ScoutNextCellsDTO {
    north: number | null;
    south: number | null;
    east: number | null;
    west: number | null;
}

export interface SaveCellDTO {
    x: number;
    y: number;
    isDryed: boolean;
    scavZoneLevel: number | null;
    scoutZoneLevel: number | null;
    scavNextCells: ScavNextCellsDTO | null;
    scoutNextCells: ScoutNextCellsDTO | null;
    nbZombie: number;
    nbZombieKilled: number;
    isRuinCamped: boolean;
    items: ItemCountShortDTO[];
    citizens: number[];
    note: string;
    nbRuinDig: number;
    isRuinDryed: boolean;
    nbRuinSuccess: number;
    nbERuinBlue: number;
    nbERuinYellow: number;
    nbERuinViolet: number;
}
