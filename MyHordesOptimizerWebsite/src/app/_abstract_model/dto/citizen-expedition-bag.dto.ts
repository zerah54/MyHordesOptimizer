import { ItemCountShortDTO } from './item-count-short.dto';
import { ItemCountDTO } from './item-count.dto';

export interface CitizenExpeditionBagDTO {
    id: number;
    items: ItemCountDTO[];
}

export interface CitizenExpeditionBagShortDTO {
    id: number;
    items: ItemCountShortDTO[];
}
