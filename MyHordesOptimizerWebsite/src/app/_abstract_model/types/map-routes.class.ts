import { MapRouteAccessDTO, MapRoutesDTO } from '../dto/map-route.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { MapRoute } from './map-route.class';
import { MapRouteGame } from './map-route-game.class';

/** Droits de l'utilisateur courant sur les tracés d'une ville. */
export interface MapRouteAccess {
    /** Citoyen de la ville, vivant ou mort : seul un citoyen voit les tracés. */
    readonly is_citizen: boolean;
    /** Ville du jeton : un citoyen dont ce n'est pas la ville courante en est un ancien citoyen. */
    readonly is_current_town: boolean;
    readonly can_create: boolean;
}

export const NO_MAP_ROUTE_ACCESS: MapRouteAccess = { is_citizen: false, is_current_town: false, can_create: false };

export function toMapRouteAccess(dto?: MapRouteAccessDTO | null): MapRouteAccess {
    return dto ? { is_citizen: dto.isCitizen, is_current_town: dto.isCurrentTown, can_create: dto.canCreate } : NO_MAP_ROUTE_ACCESS;
}

/** Réponse de `GET MapRoutes/{mapId}`. */
export class MapRoutes extends CommonModel<MapRoutesDTO> {
    public access: MapRouteAccess = NO_MAP_ROUTE_ACCESS;
    public routes: MapRoute[] = [];
    public game_routes: MapRouteGame[] = [];

    public constructor(dto?: MapRoutesDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): MapRoutesDTO {
        return {
            access: { isCitizen: this.access.is_citizen, isCurrentTown: this.access.is_current_town, canCreate: this.access.can_create },
            routes: modelToDtoArray(this.routes),
            gameRoutes: modelToDtoArray(this.game_routes)
        };
    }

    protected override dtoToModel(dto?: MapRoutesDTO | null): void {
        if (dto) {
            this.access = toMapRouteAccess(dto.access);
            this.routes = dtoToModelArray(MapRoute, dto.routes);
            this.game_routes = dtoToModelArray(MapRouteGame, dto.gameRoutes);
        }
    }
}
