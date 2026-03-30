import { HttpContextToken, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingOverlayService } from './loading-overlay.service';

export const BYPASS_LOADING: HttpContextToken<boolean> = new HttpContextToken(() => false);

/** Intercepte les appels REST pour afficher un loader */
export function loadingInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const loading_service: LoadingOverlayService = inject(LoadingOverlayService);
    const should_request_display_loading: boolean = request.method.toLowerCase() === 'GET'.toLowerCase();
    if (should_request_display_loading && !request.context.get(BYPASS_LOADING)) {
        loading_service.setLoading(true);
    }
    return next(request).pipe(
        finalize(() => {
            if (should_request_display_loading && !request.context.get(BYPASS_LOADING)) {
                loading_service.setLoading(false);
            }
        })
    );
}
