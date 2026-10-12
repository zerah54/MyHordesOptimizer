import { TownTypeId } from '../types/_types';
import { CampingOddsDTO } from './camping-odds.dto';

/** Un campeur du groupe, sans ce qui tient à la zone. */
export interface CampingGroupCamperDTO {
    job: string;
    campings: number;
    proCamper: boolean;
    objects: number;
    vest: boolean;
    tomb: boolean;
    r4: boolean;
    /** Niveau de Repos (0 à 4) : remplace proCamper et r4 ; null : les deux cases saisies à la main. */
    recluseLevel: number | null;
}

/** Campeurs d'une même zone, dans l'ordre où ils se cachent. */
export interface CampingGroupParametersDTO {
    townType: TownTypeId;
    distance: number;
    zombies: number;
    night: boolean;
    devastated: boolean;
    phare: boolean;
    /** Aménagement de la zone (+5 par amélioration, +9 par objet de défense). */
    improvementLevel: number;
    /** Bonus du bâtiment, null sans bâtiment (désert) ou pour un bâtiment enseveli. */
    ruinBonus: number | null;
    /** Places pour se cacher dans le bâtiment, -1 sans limite. */
    ruinCapacity: number;
    /** Tas d'un bâtiment enseveli, 0 sinon. */
    ruinBuryCount: number;
    /** Citoyens déjà cachés avant le premier campeur. */
    hiddenCampers: number;
    campers: CampingGroupCamperDTO[];
}

export interface CampingGroupResultDTO {
    /** Chances de chaque campeur, dans l'ordre demandé. */
    odds: CampingOddsDTO[];
    expectedSurvivors: number;
    /** Indices des campeurs demandés, du premier caché au dernier. */
    bestOrder: number[];
    bestExpectedSurvivors: number;
}

/** Saisie de l'aménagement d'une zone : ajouts du jour, ou niveau constaté. */
export interface CampImprovementUpdateDTO {
    x: number;
    y: number;
    improvements: number;
    defenseObjects: number;
    level: number | null;
}

/** Aménagement enregistré, au jour de la ville. */
export interface CampImprovementDTO {
    level: number;
    day: number;
}
