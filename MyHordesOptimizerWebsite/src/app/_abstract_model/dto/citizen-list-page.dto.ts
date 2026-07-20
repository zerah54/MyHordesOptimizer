export interface CitizenListQuery {
    page: number;
    pageSize: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc' | '';
    name?: string;
    /** Restreint aux joueurs ayant partagé au moins une ville avec ce joueur. */
    sharedWithPlayerId?: number;
}

export interface CitizenListItemDTO {
    id: number;
    name: string;
    avatar?: string;
    nbTownsPlayed: number;
    bestSurvival?: number;
    lastTownId?: number;
    lastTownName?: string;
    lastTownSeason?: number;
}

export interface CitizenListPageResultDTO {
    items: CitizenListItemDTO[];
    totalCount: number;
}
