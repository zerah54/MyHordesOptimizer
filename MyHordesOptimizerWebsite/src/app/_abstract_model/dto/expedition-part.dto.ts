import { CitizenExpeditionDTO } from './citizen-expedition.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface ExpeditionPartDTO {
    id?: number;
    expeditionId?: number;
    orders: ExpeditionOrderDTO[];
    citizens: CitizenExpeditionDTO[];
    position: number;
    path: string;
    direction?: string;
}

export interface ExpeditionPartShortDTO {
    id?: number;
    expeditionId?: number;
    ordersId: number[];
    citizensId: number[];
    position: number;
    path: string;
    direction?: string;
}
