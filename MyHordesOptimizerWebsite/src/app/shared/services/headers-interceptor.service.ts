import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getTokenWithMeWithExpirationDate } from '../utilities/localstorage.util';

/** Intercepte les appels REST pour ajouter des headers */
export function headersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const new_request: HttpRequest<unknown> = request.clone({
        headers: request.headers
            .set('Mho-Origin', 'website')
            .set('Bearer-Token', getTokenWithMeWithExpirationDate()?.token.access_token?.toString() || '')
    });
    return next(new_request);
}
