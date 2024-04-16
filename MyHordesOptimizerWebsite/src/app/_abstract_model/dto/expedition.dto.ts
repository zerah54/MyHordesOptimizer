import { ExpeditionPartDTO } from './expedition-part.dto';

export interface ExpeditionDTO {
    id?: number;
    state: 'ready' | 'stop';
    label: string;
    minPdc: number;
    position: number;
    parts: ExpeditionPartDTO[];
}

export interface ExpeditionShortDTO {
    id?: number;
    state: 'ready' | 'stop';
    label: string;
    minPdc: number;
    position: number;
    partsId: number[];
}
