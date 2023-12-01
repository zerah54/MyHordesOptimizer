import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingOverlayService } from './loading-overlay.service';

/** Intercepte les appels REST pour afficher un loader */
export function loadingInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const loading_service: LoadingOverlayService = inject(LoadingOverlayService);
    loading_service.setLoading(true);
    return next(request).pipe(
        finalize(() => {
            loading_service.setLoading(false);
        })
    );
}
