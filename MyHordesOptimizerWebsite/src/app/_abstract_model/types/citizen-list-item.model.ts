export interface CitizenListItem {
    id: number;
    name: string;
    avatar?: string;
    nbTownsPlayed: number;
    bestSurvival?: number;
    /** Dernière ville connue. Proxy de récence : aucune date de jeu n'existe côté MyHordes. */
    lastTownId?: number;
    lastTownName?: string;
    lastTownSeason?: number;
}

export interface CitizenListPageResult {
    items: CitizenListItem[];
    totalCount: number;
}
