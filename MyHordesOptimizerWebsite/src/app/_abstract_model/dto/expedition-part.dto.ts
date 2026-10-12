import { CitizenExpeditionDTO } from './citizen-expedition.dto';
import { ExpeditionOrderDTO } from './expedition-order.dto';
import { MapRoutePointDTO } from './map-route.dto';

/** Tracé lié à une partie : ce qu'il faut pour la feuille de route. */
export interface ExpeditionPartRouteDTO {
    id: number;
    label: string;
    /** Clé de palette (cf. `MAP_ROUTE_COLORS`). */
    color: string;
    cells: MapRoutePointDTO[];
    length: number;
    version: number;
}

export interface ExpeditionPartDTO {
    id?: number;
    expeditionId?: number;
    orders: ExpeditionOrderDTO[];
    citizens: CitizenExpeditionDTO[];
    position: number;
    direction?: string;
    /** Tracé lié ; absent sans tracé, ou pour un observateur. */
    mapRouteId?: number | null;
    mapRoute?: ExpeditionPartRouteDTO | null;
}

export interface ExpeditionPartShortDTO {
    id?: number;
    expeditionId?: number;
    ordersId: number[];
    citizensId: number[];
    position: number;
    direction?: string;
    /** Toujours envoyé : la partie reprend cette valeur (`null` pour délier). */
    mapRouteId: number | null;
}
