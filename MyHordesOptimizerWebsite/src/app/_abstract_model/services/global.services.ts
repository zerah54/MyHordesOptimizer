import { HttpClient, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Observable, Subscriber } from "rxjs";

export class GlobalServices {

    constructor(private _http: HttpClient) {

    }

    protected get<T>(url: string): Observable<T> {
        return new Observable((response: Subscriber<T>) => {
            this._http.get<T>(
                url,
                {
                    responseType: 'json',
                    observe: 'response'
                }).subscribe({
                    next: (http_response: HttpResponse<T>) => {
                        console.log('response', response)
                        response.next(http_response.body ? http_response.body : undefined)
                    },
                    error: (error: HttpErrorResponse) => console.error(`Une erreur s'est produite : `, error),
                });
        });
    }

    protected post<T>(url: string, params: any): Observable<T> {
        return new Observable((response: Subscriber<T>) => {
            this._http.post<T>(
                url,
                {
                    params: params.toString(),
                    responseType: 'json',
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).subscribe({
                    next: (http_response: T) => response.next(http_response),
                    error: (error: HttpErrorResponse) => console.error(`Une erreur s'est produite : `, error)
                });
        });
    }

    protected put<T>(url: string, params: any): Observable<T> {
        return new Observable((response: Subscriber<T>) => {
            this._http.put<T>(
                url,
                {
                    params: params.toString(),
                    responseType: 'json',
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).subscribe({
                    next: (http_response: T) => response.next(http_response),
                    error: (error: HttpErrorResponse) => console.error(`Une erreur s'est produite : `, error)
                });
        });
    }
}
