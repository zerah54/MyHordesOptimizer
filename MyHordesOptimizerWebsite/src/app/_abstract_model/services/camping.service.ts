import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { CampingParameters } from '../types/camping-parameters.class';
import { GlobalService } from './global.service';


@Injectable()
export class CampingService extends GlobalService {

    constructor(_http: HttpClient) {
        super(_http);
    }

    public calculateCamping(camping_parameters: CampingParameters): Observable<number> {
        return new Observable((sub: Subscriber<number>) => {
            super.post<number>(this.API_URL + '/Camping/CalculateCamping', JSON.stringify(camping_parameters.modelToDto()))
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
}

