import { ExpeditionPartDTO } from './expedition-part.dto';

export interface ExpeditionDTO {
    id: string;
    state: 'ready' | 'stop';
    label: string;
    minPdc: number;
    parts: ExpeditionPartDTO[];
}
