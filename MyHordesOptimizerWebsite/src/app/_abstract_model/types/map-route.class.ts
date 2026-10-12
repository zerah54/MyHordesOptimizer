import { MapRouteChangeDTO, MapRouteDTO, MapRouteLinkedPartDTO, MapRoutePointDTO, MapRouteRequestDTO, MapRouteStopDTO } from '../dto/map-route.dto';
import { CommonModel } from './_common.class';
import { UpdateInfo } from './update-info.class';

/** Clés de la palette des tracés, dans l'ordre de `MapRoutePalette` côté API. Teintes : `--mho-route-*`. */
export type MapRouteColor = 'blue' | 'violet' | 'magenta' | 'teal' | 'brown' | 'indigo' | 'pink' | 'cyan' | 'slate' | 'plum';

export const MAP_ROUTE_COLORS: readonly MapRouteColor[] = ['blue', 'violet', 'magenta', 'teal', 'brown', 'indigo', 'pink', 'cyan', 'slate', 'plum'];

/** Couleur d'un tracé dont la clé est inconnue (palette élargie côté API, par exemple). */
export const DEFAULT_MAP_ROUTE_COLOR: MapRouteColor = 'blue';

export function isMapRouteColor(value: unknown): value is MapRouteColor {
    return typeof value === 'string' && (<readonly string[]>MAP_ROUTE_COLORS).includes(value);
}

/** Teinte CSS d'une clé de palette : elle suit le mode clair ou sombre. */
export function mapRouteColorVar(color: MapRouteColor): string {
    return `var(--mho-route-${color})`;
}

/** Case de la carte, en coordonnées absolues. */
export interface MapRoutePoint {
    readonly x: number;
    readonly y: number;
}

export type MapRouteStopMode = 'best' | 'l';

export interface MapRouteStop extends MapRoutePoint {
    readonly mode: MapRouteStopMode;
}

export interface MapRouteLinkedPart {
    readonly expedition_id: number;
    readonly part_id: number;
    /** Jour de l'expédition ; `null` pour une expédition sans jour. */
    readonly day: number | null;
    readonly expedition_label: string | null;
    /** Rang de la partie dans l'expédition, à partir de 0. */
    readonly part_position: number;
}

export interface MapRouteChange {
    readonly id: number;
    readonly version: number;
}

export function toMapRouteChange(dto: MapRouteChangeDTO): MapRouteChange {
    return { id: dto.id, version: dto.version };
}

export function toMapRoutePoint(dto: MapRoutePointDTO): MapRoutePoint {
    return { x: dto.x, y: dto.y };
}

export function toMapRoutePointDto(point: MapRoutePoint): MapRoutePointDTO {
    return { x: point.x, y: point.y };
}

export function toMapRouteStopDto(stop: MapRouteStop): MapRouteStopDTO {
    return { x: stop.x, y: stop.y, mode: stop.mode };
}

/** Tracé saisi dans MHO, tel que l'utilisateur courant le voit (droits compris). */
export class MapRoute extends CommonModel<MapRouteDTO> {
    public id!: number;
    public label!: string;
    public color: MapRouteColor = DEFAULT_MAP_ROUTE_COLOR;
    public author_id!: number;
    public author_name: string | null = null;
    public is_private: boolean = false;
    public is_editable_by_all: boolean = false;
    /** Citoyens autorisés à voir le tracé privé, l'auteur exclu. */
    public shared_user_ids: number[] = [];
    public cells: MapRoutePoint[] = [];
    public stops: MapRouteStop[] = [];
    /** PA du trajet : nombre de cases - 1. */
    public length: number = 0;
    public version: number = 0;
    public can_edit: boolean = false;
    public linked_parts: MapRouteLinkedPart[] = [];
    public last_update_info: UpdateInfo | null = null;

    public constructor(dto?: MapRouteDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): MapRouteDTO {
        return {
            id: this.id,
            label: this.label,
            color: this.color,
            authorId: this.author_id,
            authorName: this.author_name,
            isPrivate: this.is_private,
            isEditableByAll: this.is_editable_by_all,
            sharedUserIds: [...this.shared_user_ids],
            cells: this.cells.map(toMapRoutePointDto),
            stops: this.stops.map(toMapRouteStopDto),
            length: this.length,
            version: this.version,
            canEdit: this.can_edit,
            linkedParts: this.linked_parts.map((part: MapRouteLinkedPart): MapRouteLinkedPartDTO => ({
                expeditionId: part.expedition_id,
                partId: part.part_id,
                day: part.day,
                expeditionLabel: part.expedition_label,
                partPosition: part.part_position
            })),
            lastUpdateInfo: this.last_update_info?.modelToDto() ?? null
        };
    }

    /** Demande d'enregistrement qui reprend le tracé tel quel, à sa version : à compléter des changements. */
    public toRequestDto(): MapRouteRequestDTO {
        return {
            id: this.id,
            version: this.version,
            label: this.label,
            color: this.color,
            isPrivate: this.is_private,
            isEditableByAll: this.is_editable_by_all,
            sharedUserIds: [...this.shared_user_ids],
            cells: this.cells.map(toMapRoutePointDto),
            stops: this.stops.map(toMapRouteStopDto)
        };
    }

    protected override dtoToModel(dto?: MapRouteDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.label = dto.label;
            this.color = isMapRouteColor(dto.color) ? dto.color : DEFAULT_MAP_ROUTE_COLOR;
            this.author_id = dto.authorId;
            this.author_name = dto.authorName ?? null;
            this.is_private = dto.isPrivate;
            this.is_editable_by_all = dto.isEditableByAll;
            this.shared_user_ids = [...(dto.sharedUserIds ?? [])];
            this.cells = (dto.cells ?? []).map(toMapRoutePoint);
            this.stops = (dto.stops ?? []).map((stop: MapRouteStopDTO): MapRouteStop => ({ x: stop.x, y: stop.y, mode: stop.mode === 'l' ? 'l' : 'best' }));
            this.length = dto.length;
            this.version = dto.version;
            this.can_edit = dto.canEdit;
            this.linked_parts = (dto.linkedParts ?? []).map((part: MapRouteLinkedPartDTO): MapRouteLinkedPart => ({
                expedition_id: part.expeditionId,
                part_id: part.partId,
                day: part.day ?? null,
                expedition_label: part.expeditionLabel ?? null,
                part_position: part.partPosition
            }));
            this.last_update_info = dto.lastUpdateInfo ? new UpdateInfo(dto.lastUpdateInfo) : null;
        }
    }
}
