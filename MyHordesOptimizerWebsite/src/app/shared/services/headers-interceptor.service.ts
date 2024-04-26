import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getTokenWithMeWithExpirationDate } from '../utilities/localstorage.util';

/** Intercepte les appels REST pour ajouter des headers */
export function headersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    let new_request: HttpRequest<unknown>;
    if (getTokenWithMeWithExpirationDate()?.token?.access_token) {
        new_request = request.clone({
            headers: request.headers
                .set('Mho-Origin', 'website')
                .set('Authorization', `Bearer ${getTokenWithMeWithExpirationDate()?.token.access_token?.toString() || ''}`)
        });
    } else {
        new_request = request.clone({
            headers: request.headers
                .set('Mho-Origin', 'website')
        });
    }
    return next(new_request);
}
