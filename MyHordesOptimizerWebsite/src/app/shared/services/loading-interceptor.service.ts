import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    /** Le nombre de requêtes actuellement en cours */
    private total_requests: number = 0;

    constructor(private loading_service: LoadingOverlayService) { }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<any>, next: HttpHandler) {
        this.total_requests++;
        this.loading_service.setLoading(true);
        return next.handle(request).pipe(
            finalize(() => {
                this.total_requests--;
                if (this.total_requests === 0) {
                    this.loading_service.setLoading(false);
                }
            })
        );
    }
}
