import { TownPhase, TownTypeId } from '../types/_types';

/** Meilleurs résultats d'un groupe de l'annuaire, et nombre total de correspondances */
export interface DirectorySearchGroupDTO<T> {
    total: number;
    items: T[];
}

export interface DirectorySearchPlayerDTO {
    id: number;
    name: string;
    avatar?: string | null;
}

/** Ville ouvrable sur le site : l'API ne renvoie que celles dont le mapId est connu */
export interface DirectorySearchTownDTO {
    id: number;
    mapId: number;
    name: string;
    townType?: TownTypeId | null;
    season?: number | null;
    phase?: TownPhase | null;
    language?: string | null;
    isChaos: boolean;
    isDevasted: boolean;
    isFinished: boolean;
}

export interface DirectorySearchResultDTO {
    players: DirectorySearchGroupDTO<DirectorySearchPlayerDTO>;
    towns: DirectorySearchGroupDTO<DirectorySearchTownDTO>;
}

/** Entrée du glossaire des joueurs (sigles), partagé avec le bot Discord */
export interface GlossaryEntryDTO {
    word: string;
    definition: string;
}
