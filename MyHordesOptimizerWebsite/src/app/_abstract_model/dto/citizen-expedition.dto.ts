import { SpRequirementOperator } from '../types/_types';
import { CitizenExpeditionBagDTO } from './citizen-expedition-bag.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';

export interface CitizenExpeditionDTO {
    id?: number;
    idUser?: number;
    expeditionPartId?: number;
    expeditionId?: number;
    bag?: CitizenExpeditionBagDTO;
    orders: ExpeditionOrderDTO[];
    preinscrit: boolean;
    isPreinscritSoif?: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
    nombrePaDepart?: number;
    /** Exigence de PE au départ ; `null` : aucune. */
    nombrePeDepart?: number | null;
    nombrePeDepartOperator?: SpRequirementOperator | null;
    /** Chaussures exigées (`true`), interdites (`false`) ou indifférentes (`null`). */
    isPreinscritChaussures?: boolean | null;
}

export interface CitizenExpeditionShortDTO {
    id?: number;
    idUser?: number;
    expeditionPartId?: number;
    expeditionId?: number;
    bagId?: number;
    ordersId: number[];
    preinscrit: boolean;
    isPreinscritSoif?: boolean;
    preinscritJob?: string;
    preinscritHeroicSkillName?: string;
    pdc: number;
    isThirsty?: boolean;
    nombrePaDepart?: number;
    nombrePeDepart?: number | null;
    nombrePeDepartOperator?: SpRequirementOperator | null;
    isPreinscritChaussures?: boolean | null;
}
