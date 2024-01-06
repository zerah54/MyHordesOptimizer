import { CitizenExpeditionDTO } from './citizen-expedition.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface ExpeditionPartDTO {
    id: string;
    orders: ExpeditionOrderDTO[];
    citizens: CitizenExpeditionDTO[];
    path: string;
}
