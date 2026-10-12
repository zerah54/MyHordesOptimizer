import { ExpeditionPartDTO, ExpeditionPartRouteDTO, ExpeditionPartShortDTO } from '../dto/expedition-part.dto';
import { Direction } from '../enum/direction.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { Dictionary } from './_types';
import { CitizenExpedition } from './citizen-expedition.class';
import { ExpeditionOrder } from './expedition-order.class';
import { DEFAULT_MAP_ROUTE_COLOR, isMapRouteColor, MapRouteColor, MapRoutePoint, toMapRoutePoint, toMapRoutePointDto } from './map-route.class';

/** Tracé lié à une partie (toujours visible de toute la ville). */
export interface ExpeditionPartRoute {
    readonly id: number;
    readonly label: string;
    readonly color: MapRouteColor;
    /** Chemin case par case, en coordonnées absolues. */
    readonly cells: readonly MapRoutePoint[];
    /** PA du trajet : nombre de cases - 1. */
    readonly length: number;
    readonly version: number;
}

function toExpeditionPartRoute(dto: ExpeditionPartRouteDTO): ExpeditionPartRoute {
    return {
        id: dto.id,
        label: dto.label,
        color: isMapRouteColor(dto.color) ? dto.color : DEFAULT_MAP_ROUTE_COLOR,
        cells: (dto.cells ?? []).map(toMapRoutePoint),
        length: dto.length,
        version: dto.version
    };
}

function toExpeditionPartRouteDto(route: ExpeditionPartRoute): ExpeditionPartRouteDTO {
    return {
        id: route.id,
        label: route.label,
        color: route.color,
        cells: route.cells.map(toMapRoutePointDto),
        length: route.length,
        version: route.version
    };
}

export class ExpeditionPart extends CommonModel<ExpeditionPartDTO> {
    public id?: number;
    public expedition_id?: number;
    public orders!: ExpeditionOrder[];
    public citizens: CitizenExpedition[] = [];
    public position!: number;
    public direction: Dictionary<boolean> = {};
    /** Tracé lié ; `null` sans tracé (ou pour un observateur, qui ne voit pas les tracés). */
    public map_route_id: number | null = null;
    public map_route: ExpeditionPartRoute | null = null;


    public constructor(dto?: ExpeditionPartDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): ExpeditionPartDTO {
        return {
            id: this.id,
            orders: modelToDtoArray(this.orders),
            citizens: modelToDtoArray(this.citizens),
            position: this.position,
            direction: Direction.getSelectedDirections(this.direction)[0] || undefined,
            mapRouteId: this.map_route_id,
            mapRoute: this.map_route ? toExpeditionPartRouteDto(this.map_route) : null
        };
    }

    public modelToDtoShort(): ExpeditionPartShortDTO {
        return {
            id: this.id,
            ordersId: this.orders ? this.orders
                .filter((order: ExpeditionOrder) => order.id !== undefined && order.id !== null)
                .map((order: ExpeditionOrder) => <number>order.id) : [],
            citizensId: this.citizens ? this.citizens
                .filter((citizen: CitizenExpedition) => citizen.id !== undefined && citizen.id !== null)
                .map((citizen: CitizenExpedition) => <number>citizen.id) : [],
            position: this.position,
            direction: Direction.getSelectedDirections(this.direction)[0] || undefined,
            mapRouteId: this.map_route_id
        };
    }

    protected override dtoToModel(dto?: ExpeditionPartDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.orders = dtoToModelArray(ExpeditionOrder, dto.orders);
            this.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                if (order_a.position < order_b.position) return -1;
                if (order_a.position > order_b.position) return 1;
                return 0;
            });
            this.citizens = dtoToModelArray(CitizenExpedition, dto.citizens);
            this.position = dto.position;
            if (dto.direction) {
                this.direction[dto.direction] = true;
            }
            this.expedition_id = dto.expeditionId;
            this.map_route_id = dto.mapRouteId ?? null;
            this.map_route = dto.mapRoute ? toExpeditionPartRoute(dto.mapRoute) : null;
        } else {
            this.citizens = [new CitizenExpedition()];
        }
    }

}
