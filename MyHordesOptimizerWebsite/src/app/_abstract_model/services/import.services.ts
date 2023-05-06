import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { GlobalServices } from './global.services';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { getTown, getUserId } from '../../shared/utilities/localstorage.util';

@Injectable()
export class ImportServices extends GlobalServices {

    constructor(_http: HttpClient, _snackbar: SnackbarService) {
        super(_http, _snackbar);
    }

    public getGhInformations(): Observable<any> {
        return new Observable((sub: Subscriber<any>) => {
            super.post<any>('https://gest-hordes2.eragaming.fr/rest/v1/carte/refresh', JSON.stringify({userId: getUserId(), townId: getTown()?.town_id}))
                .subscribe({
                    next: (response: any) => {
                        console.log('response', response);
                        sub.next();
                    }
                });
        });
    }
}

