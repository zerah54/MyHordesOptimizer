import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { DigDTO } from '../dto/dig.dto';
import { Dig } from '../types/dig.class';
import { dtoToModelArray, modelToDtoArray } from '../types/_common.class';
import { GlobalServices } from './global.services';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { getTown, getUserId } from '../../shared/utilities/localstorage.util';


@Injectable()
export class DigsServices extends GlobalServices {

    constructor(_http: HttpClient, private _snackbar: SnackbarService) {
        super(_http, _snackbar);
    }

    public getDigs(): Observable<Dig[]> {
        return new Observable((sub: Subscriber<Dig[]>) => {
            super.get<DigDTO[]>(this.API_URL + `/myhordesfetcher/MapDigs?townId=${getTown()?.town_id}`)
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
            super.delete<void>(this.API_URL + `/myhordesfetcher/MapDigs?idCell=${dig.cell_id}&diggerId=${dig.digger_id}&day=${dig.day}`)
                .subscribe({
                    next: () => {
                        this._snackbar.successSnackbar($localize`La fouille a bien été supprimée`);
                        sub.next();
                    }
                });
        });
    }

    public updateDig(digs: Dig[]): Observable<Dig[]> {
        return new Observable((sub: Subscriber<Dig[]>) => {
            super.post<DigDTO[]>(this.API_URL + `/myhordesfetcher/MapDigs?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(modelToDtoArray(digs)))
                .subscribe({
                    next: (response: DigDTO[]) => {
                        this._snackbar.successSnackbar($localize`La fouille a bien été mise à jour`);
                        sub.next(dtoToModelArray(Dig, response));
                    }
                });
        });
    }
}

