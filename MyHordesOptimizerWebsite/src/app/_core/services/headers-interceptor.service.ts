import { HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { TokenWithMe } from '../../_abstract_model/types/token-with-me.class';
import { getExternalAppId, getTokenWithMeWithExpirationDate } from '../utilities/localstorage.util';

/** Intercepte les appels REST pour ajouter des headers */
export function headersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (request.url.toLowerCase().indexOf('token') > -1) {
        return next(addHeaders(request));
    }

    const access_token: string | undefined = getTokenWithMeWithExpirationDate()?.token?.access_token?.toString();
    if (access_token) {
        return next(addHeaders(request, access_token));
    }

    if (!getExternalAppId()) {
        return next(addHeaders(request));
    }

    const authentication_service: AuthenticationService = inject(AuthenticationService);
    return authentication_service.getToken(true).pipe(
        map((token_with_me: TokenWithMe) => token_with_me?.token?.access_token?.toString()),
        /** Clef invalide : la requête part sans jeton, pour que les appels ne nécessitant pas d'authentification aboutissent quand même */
        catchError(() => of(undefined)),
        switchMap((token: string | undefined) => next(addHeaders(request, token)))
    );
}

function addHeaders(request: HttpRequest<unknown>, access_token?: string): HttpRequest<unknown> {
    let headers: HttpHeaders = request.headers.set('Mho-Origin', 'website');
    if (access_token) {
        headers = headers.set('Authorization', `Bearer ${access_token}`);
    }
    return request.clone({ headers: headers });
}
