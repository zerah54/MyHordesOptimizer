import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Intercepte les appels REST pour afficher un loader */
export function headersInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const new_request: HttpRequest<unknown> = request.clone({ headers: request.headers.set('Mho-Origin', 'website') });
    return next(new_request);
}
