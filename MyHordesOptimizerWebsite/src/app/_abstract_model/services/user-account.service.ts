import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map,Observable } from 'rxjs';

import { CitizenListItemDTO, CitizenListPageResultDTO, CitizenListQuery } from '../dto/citizen-list-page.dto';
import { UserAccountPublicDTO } from '../dto/user-account.dto';
import { UserPictosDTO } from '../dto/user-picto.dto';
import { CitizenListMapper } from '../mapper/citizen-list-item.mapper';
import { CitizenListPageResult } from '../types/citizen-list-item.model';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class UserAccountService extends GlobalService {

    /** Annuaire des citoyens. Tri, filtrage et pagination sont faits côté serveur. */
    public getCitizensPaged(query: CitizenListQuery): Observable<CitizenListPageResult> {
        let params: HttpParams = new HttpParams()
            .set('page', String(query.page))
            .set('pageSize', String(query.pageSize));
        if (query.sortColumn) {
            params = params.set('sortColumn', query.sortColumn);
        }
        if (query.sortDirection) {
            params = params.set('sortDirection', query.sortDirection);
        }
        if (query.name) {
            params = params.set('name', query.name);
        }
        if (query.sharedWithPlayerId != null) {
            params = params.set('sharedWithPlayerId', String(query.sharedWithPlayerId));
        }

        return this.get<CitizenListPageResultDTO>(`${this.API_URL}/UserAccount/list`, false, params).pipe(
            map((response: HttpResponse<CitizenListPageResultDTO>) => {
                const body: CitizenListPageResultDTO | null = response.body;
                return {
                    items: (body?.items ?? []).map((dto: CitizenListItemDTO) => CitizenListMapper.dtoToModel(dto)),
                    totalCount: body?.totalCount ?? 0,
                };
            })
        );
    }

    public getPublicProfile(userId: number): Observable<UserAccountPublicDTO> {
        return this.get<UserAccountPublicDTO>(`${this.API_URL}/UserAccount/${userId}`).pipe(
            map((response: HttpResponse<UserAccountPublicDTO>) => response.body!)
        );
    }

    /**
     * Pictos d'un joueur. Sans `townId`, son total ; avec, les pictos gagnés dans cette ville,
     * chacun accompagné de son total.
     */
    public getPictos(userId: number, townId?: number): Observable<UserPictosDTO> {
        const params: HttpParams = townId === undefined
            ? new HttpParams()
            : new HttpParams().set('townId', townId);
        return this.get<UserPictosDTO>(`${this.API_URL}/UserAccount/${userId}/pictos`, undefined, params).pipe(
            map((response: HttpResponse<UserPictosDTO>) => response.body!)
        );
    }

    /**
     * Lance l'import des pictos du joueur depuis MyHordes et renvoie son total à jour.
     * Appel lourd côté MyHordes : le serveur le refuse (429) s'il a déjà eu lieu récemment.
     */
    public importPictos(userId: number): Observable<UserPictosDTO> {
        return this.post<UserPictosDTO>(`${this.API_URL}/UserAccount/${userId}/pictos/import`);
    }
}
