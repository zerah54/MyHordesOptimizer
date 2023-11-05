import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import {
    getExternalAppId,
    getTokenWithMeWithExpirationDate,
    setTokenWithMeWithExpirationDate,
    setTown,
    setUser
} from '../../shared/utilities/localstorage.util';
import { TokenWithMeDTO } from '../dto/token-with-me.dto';
import { Me } from '../types/me.class';
import { GlobalServices } from './global.services';
import { TokenWithMe } from '../types/token-with-me.class';


@Injectable()
export class AuthenticationService extends GlobalServices {

    constructor(_http: HttpClient) {
        super(_http);
    }

    public getMe(force?: boolean): Observable<Me | null> {
        return new Observable((sub: Subscriber<Me | null>) => {
            if (getExternalAppId()) {
                const saved_me: Me | undefined = getTokenWithMeWithExpirationDate()?.simple_me;
                if (saved_me && !force) {
                    sub.next(saved_me);
                } else {
                    super.get<TokenWithMeDTO>(this.API_URL + `/Authentication/Token?userKey=${getExternalAppId()}`)
                        .subscribe({
                            next: (response: HttpResponse<TokenWithMeDTO>) => {
                                const token_with_me: TokenWithMe = new TokenWithMe(response.body);
                                setUser(token_with_me.simple_me);
                                setTown(token_with_me.simple_me.town_details);
                                setTokenWithMeWithExpirationDate(token_with_me);
                                sub.next(token_with_me.simple_me);
                            },
                            error: (error: HttpErrorResponse) => {
                                sub.error(error);
                            }
                        });
                }

            } else {
                setUser(null);
                setTown(null);
                sub.next(null);
            }
        });
    }
}

