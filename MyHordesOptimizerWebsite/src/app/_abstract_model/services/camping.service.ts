import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { CampingBonusDTO } from '../dto/camping-bonus.dto';
import { CampingOddsDTO } from '../dto/camping-odds.dto';
import { CampingBonus } from '../types/camping-bonus.class';
import { CampingOdds } from '../types/camping-odds.class';
import { CampingParameters } from '../types/camping-parameters.class';
import { GlobalService } from './global.service';


@Injectable({providedIn: 'root'})
export class CampingService extends GlobalService {

    constructor(_http: HttpClient) {
        super(_http);
    }

    public calculateCamping(camping_parameters: CampingParameters): Observable<CampingOdds> {
        return new Observable((sub: Subscriber<CampingOdds>) => {
            super.post<CampingOddsDTO>(this.API_URL + '/Camping/Calculate', JSON.stringify(camping_parameters.modelToDto()))
                .subscribe({
                    next: (response: CampingOddsDTO) => {
                        sub.next(new CampingOdds(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getBonus(): Observable<CampingBonus> {
        return new Observable((sub: Subscriber<CampingBonus>) => {
            super.get<CampingBonusDTO>(this.API_URL + '/Camping/Bonus')
                .subscribe({
                    next: (response: HttpResponse<CampingBonusDTO>) => {
                        sub.next(new CampingBonus(<CampingBonusDTO>response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}
