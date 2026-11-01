import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { MapThemeActiveDTO, MapThemeDTO, MapThemesDTO } from '../dto/map-theme.dto';
import { MapThemeColors } from '../types/map-theme.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class MapThemeService extends GlobalService {

    /** Thèmes de l'appelant et thème actif, sans chargeur ni message d'erreur. */
    public getMine(): Observable<MapThemesDTO> {
        return this.get<MapThemesDTO>(`${this.API_URL}/MapTheme`, true, undefined, true).pipe(
            map((response: HttpResponse<MapThemesDTO>): MapThemesDTO => response.body ?? { themes: [], active: { themeId: null } })
        );
    }

    public create(name: string, colors: MapThemeColors): Observable<MapThemeDTO> {
        return this.post<MapThemeDTO>(`${this.API_URL}/MapTheme`, JSON.stringify({ name, colors }));
    }

    public update(id: number, name: string, colors: MapThemeColors): Observable<MapThemeDTO> {
        return this.put<MapThemeDTO>(`${this.API_URL}/MapTheme/${id}`, { name, colors }, undefined, true).pipe(
            map((response: HttpResponse<MapThemeDTO>): MapThemeDTO => response.body as MapThemeDTO)
        );
    }

    public remove(id: number): Observable<void> {
        return this.delete<void>(`${this.API_URL}/MapTheme/${id}`).pipe(map((): void => undefined));
    }

    public setActive(active: MapThemeActiveDTO): Observable<void> {
        return this.put<void>(`${this.API_URL}/MapTheme/active`, active).pipe(map((): void => undefined));
    }
}
