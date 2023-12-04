import { HttpBackend, HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { CampingBonusDTO } from '../dto/camping-bonus.dto';
import { CampingBonus } from '../types/camping-bonus.class';
import { CampingParameters } from '../types/camping-parameters.class';
import { GlobalService } from './global.service';


@Injectable({ providedIn: 'root' })
export class CampingService extends GlobalService {

    constructor(_http: HttpClient, backend: HttpBackend) {
        super(new HttpClient(backend));
    }

    public calculateCamping(camping_parameters: CampingParameters): Observable<number> {
        return new Observable((sub: Subscriber<number>) => {
            super.post<number>(this.API_URL + '/Camping/Calculate', JSON.stringify(camping_parameters.modelToDto()))
                .subscribe({
                    next: (response: number) => {
                        sub.next(response);
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
