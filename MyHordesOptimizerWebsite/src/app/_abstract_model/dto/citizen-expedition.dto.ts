import { CitizenExpeditionBagDTO } from './citizen-expedition-bag.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface CitizenExpeditionDTO {
    id?: number;
    idUser?: number;
    bag?: CitizenExpeditionBagDTO;
    orders: ExpeditionOrderDTO[];
    preinscrit: boolean;
    isPreinscritSoif?: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
    nombrePaDepart: number;
}

export interface CitizenExpeditionShortDTO {
    id?: number;
    idUser?: number;
    bagId?: number;
    ordersId: number[];
    preinscrit: boolean;
    isPreinscritSoif?: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
    nombrePaDepart: number;
}
