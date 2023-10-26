import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { SnackbarService } from './snackbar.service';

@Injectable()
export class ErrorsInterceptor implements HttpInterceptor {

    constructor(private snackbar: SnackbarService) {
    }

    /** Intercepte les appels REST pour afficher un loader */
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError(this.handleError.bind(this))
        );
    }


    /**
     * Gère les erreurs suite aux appels
     *
     * @param {HttpErrorResponse} error
     *
     * @return {Observable<never>}
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        if (error.status === 0) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error(`Erreur ${error.status} du client ou de réseau : `, error.error);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong.
            console.error(`Erreur ${error.status} retournée par le backend : `, error.error);
        }
        // Return an observable with a user-facing error message.
        return throwError(() => {
            if (error.error && error.error !== '') {
                this.snackbar.errorSnackbar(`Erreur ${error.status} : ${error.error}`);
            } else {
                this.snackbar.errorSnackbar(`Une erreur s'est produite lors de l'appel (Erreur ${error.status})`);
            }
        });
    }
}
