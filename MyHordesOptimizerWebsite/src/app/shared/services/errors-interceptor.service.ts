import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { AuthenticationService } from '../../_abstract_model/services/authentication.service';
import { SnackbarService } from './snackbar.service';

/** Intercepte les appels REST pour afficher un loader */
export function errorInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const snackbar: SnackbarService = inject(SnackbarService);
    const authentication_service: AuthenticationService = inject(AuthenticationService);
    return next(request)
        .pipe(
            catchError((error: HttpErrorResponse) => handleError(error, snackbar, authentication_service))
        );
}

/**
 * Gère les erreurs suite aux appels
 *
 * @param {HttpErrorResponse} error
 * @param {SnackbarService} snackbar
 * @param {AuthenticationService} authentication_service
 *
 * @return {Observable<never>}
 */
function handleError(error: HttpErrorResponse, snackbar: SnackbarService, authentication_service: AuthenticationService)
    : Observable<never> {
    console.log('error', error);

    if (error.status === 0) {
        /** A client-side or network error occurred. Handle it accordingly. */
        console.error(`Erreur ${error.status} du client ou de réseau : \n`, error.error);
    } else if (error.status === 401) {
        authentication_service.getMe(true).subscribe(() => {
            return retry(1);
        });
    } else {
        /**
         * The backend returned an unsuccessful response code.
         * The response body may contain clues as to what went wrong.
         */
        console.error(`Erreur ${error.status} retournée par le backend : \n`, error.error);
    }
    /** Return an observable with a user-facing error message. */
    return throwError(() => {
        if (error.status !== 401) {
            if (error.error && error.error !== '' && error.status !== 500 && error.status !== 502 && error.status !== 504 && typeof error.error === 'string') {
                snackbar.errorSnackbar(`Erreur ${error.status} : ${error.error}`);
            } else {
                snackbar.errorSnackbar(`Une erreur s'est produite lors de l'appel (Erreur ${error.status})`);
            }
        }
    });
}
