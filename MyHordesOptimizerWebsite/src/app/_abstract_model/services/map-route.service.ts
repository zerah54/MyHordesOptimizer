import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { MapRouteAccessDTO, MapRouteDTO, MapRoutesDTO } from '../dto/map-route.dto';
import { MapRoute } from '../types/map-route.class';
import { MapRouteAccess, MapRoutes, NO_MAP_ROUTE_ACCESS, toMapRouteAccess } from '../types/map-routes.class';
import { GlobalService } from './_global.service';

/** Lecture des tracés d'expédition ; l'écriture passe par `RealtimeExpeditionsService`. */
@Injectable({ providedIn: 'root' })
export class MapRouteService extends GlobalService {

    /** Tracés visibles par l'utilisateur et itinéraires du jeu du jour ; aucun tracé pour qui n'est pas citoyen. */
    public getMapRoutes(map_id: number): Observable<MapRoutes> {
        return this.get<MapRoutesDTO>(`${this.API_URL}/MapRoutes/${map_id}`, true).pipe(
            map((response: HttpResponse<MapRoutesDTO>): MapRoutes => new MapRoutes(response.body))
        );
    }

    /**
     * Droits sur une ville, sans ses tracés : la ville observée est-elle une ancienne ville de l'utilisateur ? En cas
     * d'échec, aucun droit (lecture seule), sans message d'erreur.
     */
    public getAccess(map_id: number): Observable<MapRouteAccess> {
        return this.get<MapRouteAccessDTO>(`${this.API_URL}/MapRoutes/${map_id}/access`, true, undefined, true).pipe(
            map((response: HttpResponse<MapRouteAccessDTO>): MapRouteAccess => toMapRouteAccess(response.body)),
            catchError((): Observable<MapRouteAccess> => of(NO_MAP_ROUTE_ACCESS))
        );
    }

    /**
     * Un tracé, relu après un événement temps réel. `null` s'il n'existe plus ou n'est plus visible (404) :
     * l'appelant le retire. Pas de message d'erreur, une relecture ratée n'intéresse pas l'utilisateur.
     */
    public getMapRoute(map_id: number, route_id: number): Observable<MapRoute | null> {
        return this.get<MapRouteDTO>(`${this.API_URL}/MapRoutes/${map_id}/${route_id}`, true, undefined, true).pipe(
            map((response: HttpResponse<MapRouteDTO>): MapRoute | null => response.body ? new MapRoute(response.body) : null),
            catchError((error: HttpErrorResponse): Observable<null> => {
                return error.status === HttpStatusCode.NotFound ? of(null) : throwError((): HttpErrorResponse => error);
            })
        );
    }
}
