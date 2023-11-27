import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeadersInterceptor implements HttpInterceptor {

    constructor() {
    }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        request = request.clone({ headers: request.headers.set('Mho-Origin', 'website') });
        return next.handle(request);
    }
}
