import { HttpClient, HttpContext, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BYPASS_LOADING } from '../../shared/services/loading-interceptor.service';

export class GlobalService {
    protected readonly API_URL: string = environment.api_url;

    constructor(private http: HttpClient) {

    }

    protected get<T>(url: string, bypass_loading?: boolean): Observable<HttpResponse<T>> {
        const context: HttpContext = new HttpContext().set(BYPASS_LOADING, bypass_loading);
        return this.http.get<T>(url, {
            responseType: 'json',
            context: context,
            observe: 'response'
        });
    }

    protected post<T>(url: string, params?: string, bypass_loading?: boolean): Observable<T> {
        const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
        const context: HttpContext = new HttpContext().set(BYPASS_LOADING, bypass_loading);
        return this.http.post<T>(url, params, { responseType: 'json', headers: headers, context: context });
    }

    protected put<T>(url: string, body: unknown, bypass_loading?: boolean): Observable<HttpResponse<T>> {
        const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
        const context: HttpContext = new HttpContext().set(BYPASS_LOADING, bypass_loading);
        return this.http.put<T>(
            url,
            body,
            {
                responseType: 'json',
                headers: headers,
                context: context,
                observe: 'response'
            });
    }

    protected delete<T>(url: string, bypass_loading?: boolean): Observable<HttpResponse<T>> {
        const context: HttpContext = new HttpContext().set(BYPASS_LOADING, bypass_loading);
        return this.http.delete<T>(url, {
            responseType: 'json',
            context: context,
            observe: 'response',
        });
    }
}
