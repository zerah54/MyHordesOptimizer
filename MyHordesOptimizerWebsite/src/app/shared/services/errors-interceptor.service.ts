import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { SnackbarService } from './snackbar.service';

/** Intercepte les appels REST pour afficher un loader */
export function errorInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const snackbar: SnackbarService = inject(SnackbarService);
    return next(request).pipe(
        catchError((error: HttpErrorResponse) => handleError(error, snackbar))
    );
}

/**
 * Gère les erreurs suite aux appels
 *
 * @param {HttpErrorResponse} error
 * @param {SnackbarService} snackbar
 *
 * @return {Observable<never>}
 */
function handleError(error: HttpErrorResponse, snackbar: SnackbarService): Observable<never> {
    if (error.status === 0) {
        /** A client-side or network error occurred. Handle it accordingly. */
        console.error(`Erreur ${error.status} du client ou de réseau : `, error.error);
    } else {
        /**
         * The backend returned an unsuccessful response code.
         * The response body may contain clues as to what went wrong.
         */
        console.error(`Erreur ${error.status} retournée par le backend : `, error.error);
    }
    /** Return an observable with a user-facing error message. */
    return throwError(() => {
        if (error.error && error.error !== '') {
            snackbar.errorSnackbar(`Erreur ${error.status} : ${error.error}`);
        } else {
            snackbar.errorSnackbar(`Une erreur s'est produite lors de l'appel (Erreur ${error.status})`);
        }
    });
}
