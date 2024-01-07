import { BagDTO } from './bag.dto';
import { CitizenDTO } from './citizen.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface CitizenExpeditionDTO {
    id: number;
    citizen?: CitizenDTO;
    bag?: BagDTO;
    orders: ExpeditionOrderDTO[];
    preinscrit: boolean;
    preinscritJob?: string;
    preinscritHeroic?: string;
    pdc: number;
    soif?: boolean;
}
