import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({ providedIn: 'root' })
export class LoadingInterceptor implements HttpInterceptor {

    constructor(private loading_service: LoadingOverlayService) {
    }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        this.loading_service.setLoading(true);
        return next.handle(request).pipe(
            finalize(() => {
                this.loading_service.setLoading(false);
            })
        );
    }
}
