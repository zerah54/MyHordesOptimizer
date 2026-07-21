import { ItemCountDTO } from './item-count.dto';
import { ItemCountShortDTO } from './item-count-short.dto';

export interface CitizenExpeditionBagDTO {
    id: number;
    expeditionsId?: number[];
    expeditionsCitizenId?: number[];
    expeditionsPartId?: number[];
    items: ItemCountDTO[];
}

export interface CitizenExpeditionBagShortDTO {
    id: number;
    expeditionsId?: number[];
    expeditionsCitizenId?: number[];
    expeditionsPartId?: number[];
    items: ItemCountShortDTO[];
}
