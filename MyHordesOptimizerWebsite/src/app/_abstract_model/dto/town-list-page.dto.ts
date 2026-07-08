import { TownPhase, TownState, TownTypeId } from '../types/_types';
import { TownListItemDTO } from './town-list-item.dto';

export interface TownListQuery {
    season?: number;
    phase?: TownPhase;
    page: number;
    pageSize: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc' | '';
    name?: string;
    id?: string;
    types?: TownTypeId[];
    languages?: string[];
    states?: TownState[];
    refresh?: boolean;
}

export interface TownListPageResultDTO {
    items: TownListItemDTO[];
    totalCount: number;
    availableTypes: TownTypeId[];
    availableLanguages: string[];
}
