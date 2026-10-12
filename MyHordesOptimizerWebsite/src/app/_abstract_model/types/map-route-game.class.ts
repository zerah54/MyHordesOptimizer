import { MapRouteGameDTO, MapRoutePointDTO } from '../dto/map-route.dto';
import { CommonModel } from './_common.class';
import { MapRoutePoint, toMapRoutePoint } from './map-route.class';

/** Itinéraire créé dans MyHordes, relu à chaque mise à jour : lecture seule, jour courant seulement. */
export class MapRouteGame extends CommonModel<MapRouteGameDTO> {
    public id!: number;
    /** `null` si l'auteur n'est pas connu de MHO. */
    public author_id: number | null = null;
    public label!: string;
    public length: number = 0;
    /** Points d'arrêt, alignés deux à deux : les cases intermédiaires se déduisent. */
    public stops: MapRoutePoint[] = [];

    public constructor(dto?: MapRouteGameDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): MapRouteGameDTO {
        return {
            id: this.id,
            authorId: this.author_id,
            label: this.label,
            length: this.length,
            stops: this.stops.map((stop: MapRoutePoint): MapRoutePointDTO => ({ x: stop.x, y: stop.y }))
        };
    }

    protected override dtoToModel(dto?: MapRouteGameDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.author_id = dto.authorId ?? null;
            this.label = dto.label;
            this.length = dto.length;
            this.stops = (dto.stops ?? []).map(toMapRoutePoint);
        }
    }
}
