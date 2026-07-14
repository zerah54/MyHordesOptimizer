import { TownPhase, TownTypeId } from './_types';

export interface TownPublicCitizen {
    id: number;
    name: string | null;
    deathTypeId: number | null;
}

export interface TownListItem {
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
    citizens: TownPublicCitizen[];
}

export interface TownListPageResult {
    items: TownListItem[];
    totalCount: number;
    availableTypes: TownTypeId[];
    availableLanguages: string[];
}
