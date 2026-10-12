import { UpdateInfoDTO } from './update-info.dto';

/** Case de la carte, en coordonnées absolues (comme `Cell.x` / `Cell.y`). */
export interface MapRoutePointDTO {
    x: number;
    y: number;
}

/** Destination cliquée lors de la saisie, et mode de calcul du segment qui y mène (`best` ou `l`). */
export interface MapRouteStopDTO extends MapRoutePointDTO {
    mode: string;
}

export interface MapRouteLinkedPartDTO {
    expeditionId: number;
    partId: number;
    day: number | null;
    expeditionLabel: string | null;
    partPosition: number;
}

export interface MapRouteDTO {
    id: number;
    label: string;
    /** Clé de palette (cf. `MAP_ROUTE_COLORS`). */
    color: string;
    authorId: number;
    authorName: string | null;
    isPrivate: boolean;
    isEditableByAll: boolean;
    sharedUserIds: number[];
    cells: MapRoutePointDTO[];
    stops: MapRouteStopDTO[];
    length: number;
    version: number;
    canEdit: boolean;
    linkedParts: MapRouteLinkedPartDTO[];
    lastUpdateInfo: UpdateInfoDTO | null;
}

/** Enregistrement d'un tracé (`SaveMapRoute`) : sans `id`, création ; avec, modification à la `version` lue. */
export interface MapRouteRequestDTO {
    id: number | null;
    version: number | null;
    label: string;
    /** Clé de palette ; `null` : conservée, ou tirée au hasard à la création. */
    color: string | null;
    isPrivate: boolean;
    isEditableByAll: boolean;
    /** Ignoré pour un tracé visible de toute la ville. */
    sharedUserIds: number[];
    cells: MapRoutePointDTO[];
    stops: MapRouteStopDTO[];
}

/** Itinéraire créé dans MyHordes : lecture seule, jour courant seulement. */
export interface MapRouteGameDTO {
    id: number;
    authorId: number | null;
    label: string;
    length: number;
    /** Points d'arrêt, alignés deux à deux. */
    stops: MapRoutePointDTO[];
}

export interface MapRouteAccessDTO {
    isCitizen: boolean;
    isCurrentTown: boolean;
    canCreate: boolean;
}

export interface MapRoutesDTO {
    access: MapRouteAccessDTO;
    routes: MapRouteDTO[];
    gameRoutes: MapRouteGameDTO[];
}

/** Événement temps réel « tracé modifié » : ni contenu ni visibilité, chaque client relit le tracé. */
export interface MapRouteChangeDTO {
    id: number;
    version: number;
}
