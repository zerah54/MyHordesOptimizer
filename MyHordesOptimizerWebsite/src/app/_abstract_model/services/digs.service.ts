import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { getTown, getUserId } from 'src/app/shared/utilities/localstorage.util';
import { environment } from 'src/environments/environment';
import { DigDTO } from '../dto/dig.dto';
import { Dig } from '../types/dig.class';
import { dtoToModelArray, modelToDtoArray } from '../types/_common.class';
import { GlobalServices } from './global.services';
import { SnackbarService } from '../../shared/services/snackbar.service';

const API_URL: string = environment.api_url;

@Injectable()
export class DigsServices extends GlobalServices {

    /** La locale */
    private readonly locale: string = moment.locale();

    constructor(private http: HttpClient, private snackbar: SnackbarService) {
        super(http, snackbar);
    }

    public getDigs(): Observable<Dig[]> {
        return new Observable((sub: Subscriber<Dig[]>) => {
            super.get<DigDTO[]>(API_URL + `/myhordesfetcher/MapDigs?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<DigDTO[]>) => {
                        let digs: Dig[] = dtoToModelArray(Dig, response.body);
                        digs = digs.sort((dig_a: Dig, dig_b: Dig) => {
                            if (dig_a.update_info.update_time.isBefore(dig_b.update_info.update_time)) return -1;
                            if (dig_a.update_info.update_time.isAfter(dig_b.update_info.update_time)) return 1;
                            return 0;
                        });
                        sub.next(digs);
                    }
                });
        });
    }

    public deleteDig(dig: Dig): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.delete<void>(API_URL + `/myhordesfetcher/MapDigs?idCell=${dig.cell_id}&diggerId=${dig.digger_id}&day=${dig.day}`)
                .subscribe({
                    next: () => {
                        this.snackbar.successSnackbar($localize`La fouille a bien été supprimée`);
                        sub.next();
                    }
                });
        });
    }

    public updateDig(digs: Dig[]): Observable<Dig[]> {
        return new Observable((sub: Subscriber<Dig[]>) => {
            super.post<DigDTO[]>(API_URL + `/myhordesfetcher/MapDigs?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(modelToDtoArray(digs)))
                .subscribe({
                    next: (response: DigDTO[]) => {
                        this.snackbar.successSnackbar($localize`La fouille a bien été mise à jour`);
                        sub.next(dtoToModelArray(Dig, response));
                    }
                });
        });
    }
}

