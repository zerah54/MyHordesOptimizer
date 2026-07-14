import { TownPhase, TownTypeId } from '../types/_types';

export interface TownPublicCitizenDTO {
    id: number;
    name: string | null;
    deathTypeId: number | null;
}

export interface TownListItemDTO {
    id: number;
    mapId: number | null;
    name: string | null;
    width: number | null;
    height: number | null;
    townType: TownTypeId | null;
    season: number | null;
    phase: TownPhase | null;
    language: string | null;
    score: number | null;
    isChaos: boolean;
    isDevasted: boolean;
    isFinished: boolean;
    citizens: TownPublicCitizenDTO[];
}
