import { BagDTO } from './bag.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface CitizenExpeditionDTO {
    id?: number;
    idUser?: number;
    bag?: BagDTO;
    orders: ExpeditionOrderDTO[];
    preinscrit: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
}

export interface CitizenExpeditionShortDTO {
    id?: number;
    idUser?: number;
    bag?: number;
    ordersId: number[];
    preinscrit: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
}
