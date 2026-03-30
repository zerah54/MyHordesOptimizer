import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { TokenWithMe } from '../../_abstract_model/types/token-with-me.class';
import { getTokenWithMeWithExpirationDate } from '../utilities/localstorage.util';

/** Intercepte les appels REST pour ajouter des headers */
export function headersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    let new_request: HttpRequest<unknown>;
    if (request.url.toLowerCase().indexOf('token') > -1) {
        new_request = request.clone({
            headers: request.headers
                .set('Mho-Origin', 'website')
        });
        return next(new_request);
    } else if (getTokenWithMeWithExpirationDate()?.token?.access_token) {
        new_request = request.clone({
            headers: request.headers
                .set('Mho-Origin', 'website')
                .set('Authorization', `Bearer ${getTokenWithMeWithExpirationDate()?.token.access_token?.toString() || ''}`)
        });
        return next(new_request);
    } else {
        const authentication_service: AuthenticationService = inject(AuthenticationService);
        return authentication_service.getToken().pipe(map((token: TokenWithMe) => {
            new_request = request.clone({
                headers: request.headers
                    .set('Mho-Origin', 'website')
                    .set('Authorization', `Bearer ${token?.token.access_token?.toString() || ''}`)
            });
            return new_request;
        }), switchMap((request: HttpRequest<unknown>) => next(request)));
    }
}
