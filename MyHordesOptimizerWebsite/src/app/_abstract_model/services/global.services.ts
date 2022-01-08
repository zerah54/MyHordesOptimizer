import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

export class GlobalServices {

    constructor(private _http: HttpClient) {

    }

    protected get<T>(url: string): Observable<HttpResponse<T>> {
        return this._http.get<T>(
            url,
            {
                responseType: 'json',
                observe: 'response'
            })
    }

    protected post<T>(url: string, params: any): Observable<T> {
        return this._http.post<T>(
            url,
            {
                params: params.toString(),
                responseype: 'json',
                headers: {
                    "Content-Type": "application/json"
                },
                observe: 'response'
            });
    }
}
