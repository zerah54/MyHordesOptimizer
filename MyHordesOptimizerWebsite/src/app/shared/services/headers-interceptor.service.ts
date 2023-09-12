import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class HeadersInterceptor implements HttpInterceptor {

    constructor() {
    }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        request = request.clone({ headers: request.headers.set('Mho-Origin', 'Website') });
        return next.handle(request);
    }
}
