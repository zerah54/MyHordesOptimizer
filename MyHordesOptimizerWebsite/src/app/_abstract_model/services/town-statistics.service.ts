import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { getTown, getUserId, } from '../../shared/utilities/localstorage.util';
import { EstimationsDTO } from '../dto/estimations.dto';
import { RegenDTO } from '../dto/regen.dto';
import { MinMax } from '../interfaces';
import { dtoToModelArray } from '../types/_common.class';
import { Estimations } from '../types/estimations.class';
import { Regen } from '../types/regen.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class TownStatisticsService extends GlobalService {

    constructor(_http: HttpClient) {
        super(_http);
    }

    public getApofooAttackCalculation(day: number, beta: boolean): Observable<MinMax | null> {
        return new Observable((sub: Subscriber<MinMax | null>) => {
            super.get<MinMax>(this.API_URL + `/attaqueEstimation/apofooAttackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<MinMax>) => {
                        sub.next(response.body);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getScrutList(): Observable<Regen[]> {
        return new Observable((sub: Subscriber<Regen[]>) => {
            super.get<RegenDTO[]>(this.API_URL + `/Fetcher/MapUpdates?townid=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<RegenDTO[]>) => {
                        sub.next(dtoToModelArray(Regen, response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getEstimations(day: number): Observable<Estimations> {
        return new Observable((sub: Subscriber<Estimations>) => {
            super.get<EstimationsDTO>(this.API_URL + `/AttaqueEstimation/Estimations/${day}?townid=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<EstimationsDTO>) => {
                        sub.next(new Estimations(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public saveEstimations(estimations: Estimations): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post<EstimationsDTO>(this.API_URL + `/AttaqueEstimation/Estimations?townid=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(estimations.modelToDto()))
                .subscribe({
                    next: () => {
                        sub.next();
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

}

