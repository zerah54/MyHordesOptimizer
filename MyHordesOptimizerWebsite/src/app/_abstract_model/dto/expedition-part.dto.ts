import { CitizenExpeditionDTO } from './citizen-expedition.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface ExpeditionPartDTO {
    id?: number;
    orders: ExpeditionOrderDTO[];
    citizens: CitizenExpeditionDTO[];
    position: number;
    path: string;
}

export interface ExpeditionPartShortDTO {
    id?: number;
    ordersId: number[];
    citizens: number[];
    position: number;
    path: string;
}
