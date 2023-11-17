import { TownTypeId } from '../types/_types';

export interface CampingParametersDTO {
    TownType: TownTypeId;
    job: string;
    distance: number;
    campings: number;
    proCamper: boolean;
    hiddenCampers: number;
    objects: number;
    vest: boolean;
    tomb: boolean;
    zombies: number;
    night: boolean;
    devastated: boolean;
    phare: boolean;
    improve: number;
    objectImprove: number;
    ruinBonus: number;
    ruinBuryCount: number;
    ruinCapacity: number;
}
