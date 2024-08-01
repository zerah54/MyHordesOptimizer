import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { LocalStorageService } from '../../shared/services/localstorage.service';
import { getTown } from '../../shared/utilities/localstorage.util';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { dtoToModelArray } from '../types/_common.class';
import { Expedition } from '../types/expedition.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class ExpeditionService extends GlobalService {

    constructor(_http: HttpClient, private local_storage: LocalStorageService) {
        super(_http);
    }

    /**
     * Récupère les expéditions du jour
     *
     * @param {number} day
     *
     * @returns {Observable<Expedition[]>}
     */
    public getExpeditions(day: number): Observable<Expedition[]> {
        return new Observable((sub: Subscriber<Expedition[]>) => {
            super.get<ExpeditionDTO[]>(this.API_URL + `/expeditions/${getTown(this.local_storage)?.town_id}/${day}`)
                .subscribe({
                    next: (response: HttpResponse<ExpeditionDTO[]>) => {
                        const expeditions: Expedition[] = dtoToModelArray(Expedition, response.body);
                        expeditions.sort((expedition_a: Expedition, expedition_b: Expedition) => {
                            if (expedition_a.position < expedition_b.position) return -1;
                            if (expedition_a.position > expedition_b.position) return 1;
                            return 0;
                        });
                        sub.next(expeditions);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}
