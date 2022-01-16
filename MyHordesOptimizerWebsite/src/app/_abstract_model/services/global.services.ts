import { HttpClient, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { catchError, Observable, retry, throwError } from "rxjs";
import { SnackbarService } from './../../shared/services/snackbar.service';

export class GlobalServices {

    constructor(private _http: HttpClient, private _snackbar: SnackbarService) {

    }

    protected get<T>(url: string): Observable<HttpResponse<T>> {
        return this._http.get<T>(url, {
            responseType: 'json',
            observe: 'response'
        }).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    protected post<T>(url: string, params?: string): Observable<T> {
        return this._http.post<T>(url, {
            params: params ? params : undefined,
            responseType: 'json',
            headers: {
                "Content-Type": "application/json"
            }
        }).pipe(
            retry(3),
            catchError(this.handleError)
        );
    }

    protected put<T>(url: string, body: unknown): Observable<HttpResponse<T>> {
        return this._http.put<T>(
            url,
            body,
            {
                responseType: 'json',
                headers: {
                    "Content-Type": "application/json"
                },
                observe: 'response'
            }).pipe(
                retry(3),
                catchError(this.handleError)
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
            this._snackbar.errorSnackbar(`Une erreur s'est produite lors de l'appel (Erreur ${error.status})`);
        });
    }
}
