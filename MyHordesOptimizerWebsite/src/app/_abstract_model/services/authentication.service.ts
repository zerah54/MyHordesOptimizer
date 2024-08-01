import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { LocalStorageService } from '../../shared/services/localstorage.service';
import {
    getExternalAppId,
    getTokenWithMeWithExpirationDate,
    setTokenWithMeWithExpirationDate,
    setTown,
    setUser
} from '../../shared/utilities/localstorage.util';
import { TokenWithMeDTO } from '../dto/token-with-me.dto';
import { Me } from '../types/me.class';
import { TokenWithMe } from '../types/token-with-me.class';
import { GlobalService } from './_global.service';


@Injectable({ providedIn: 'root' })
export class AuthenticationService extends GlobalService {

    constructor(_http: HttpClient, private local_storage: LocalStorageService) {
        super(_http);
    }

    public getMe(force?: boolean): Observable<Me | null> {
        return new Observable((sub: Subscriber<Me | null>) => {
            if (getExternalAppId(this.local_storage)) {
                const saved_me: Me | undefined = getTokenWithMeWithExpirationDate(this.local_storage)?.simple_me;
                if (saved_me && !force) {
                    sub.next(saved_me);
                } else if (this.local_storage && getExternalAppId(this.local_storage)) {
                    this.getToken().subscribe({
                        next: (token: TokenWithMe) => {
                            sub.next(token.simple_me);
                        },
                        error: (error: HttpErrorResponse) => {
                            console.log('error test', error);
                        }
                    });
                }

            } else {
                setUser(null, this.local_storage);
                setTown(null, this.local_storage);
                sub.next(null);
            }
        });
    }

    public getToken(): Observable<TokenWithMe> {
        return new Observable((sub: Subscriber<TokenWithMe>) => {
            super.get<TokenWithMeDTO>(this.API_URL + `/Authentication/Token?userKey=${getExternalAppId(this.local_storage)}`)
                .subscribe({
                    next: (response: HttpResponse<TokenWithMeDTO>) => {
                        const token_with_me: TokenWithMe = new TokenWithMe(response.body);
                        setUser(token_with_me.simple_me, this.local_storage);
                        setTown(token_with_me.simple_me.town_details, this.local_storage);
                        setTokenWithMeWithExpirationDate(token_with_me, this.local_storage);
                        sub.next(token_with_me);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}

