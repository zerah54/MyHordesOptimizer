import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

    constructor(private loading_service: LoadingOverlayService) { }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<any>, next: HttpHandler) {
        this.loading_service.setLoading(true);
        return next.handle(request).pipe(
            finalize(() => {
                // console.log('finalize', request);
                this.loading_service.setLoading(false);
            })
        );
    }
}
