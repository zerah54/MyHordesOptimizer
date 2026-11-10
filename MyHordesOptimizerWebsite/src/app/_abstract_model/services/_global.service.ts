import { HttpClient, HttpContext, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BYPASS_ERROR, BYPASS_LOADING, SILENT_ERROR_STATUS } from '../../_core/services/http-context-tokens';

export class GlobalService {
    protected readonly API_URL: string = environment.api_url;
    protected readonly http: HttpClient = inject(HttpClient);

    protected get<T>(url: string, bypass_loading?: boolean, params?: HttpParams, bypass_error?: boolean): Observable<HttpResponse<T>> {
        const context: HttpContext = new HttpContext()
            .set(BYPASS_LOADING, bypass_loading)
            .set(BYPASS_ERROR, !!bypass_error);
        return this.http.get<T>(url, {
            responseType: 'json',
            context: context,
            observe: 'response',
            params
        });
    }

    protected post<T>(url: string, params?: string, bypass_error?: boolean): Observable<T> {
        const headers: HttpHeaders = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
        const context: HttpContext = new HttpContext().set(BYPASS_ERROR, !!bypass_error);
        return this.http.post<T>(url, params, { responseType: 'json', headers: headers, context: context });
    }

    protected put<T>(url: string, body: unknown, params?: HttpParams, bypass_error?: boolean, silent_status: number | readonly number[] | null = null, extra_headers: Record<string, string> = {}): Observable<HttpResponse<T>> {
        const headers: HttpHeaders = new HttpHeaders({ ...extra_headers, 'Content-Type': 'application/json' });
        const context: HttpContext = new HttpContext()
            .set(BYPASS_ERROR, !!bypass_error)
            .set(SILENT_ERROR_STATUS, silent_status);
        return this.http.put<T>(
            url,
            body,
            {
                responseType: 'json',
                headers: headers,
                observe: 'response',
                params,
                context
            });
    }

    protected delete<T>(url: string, extra_headers: Record<string, string> = {}): Observable<HttpResponse<T>> {
        return this.http.delete<T>(url, {
            headers: new HttpHeaders(extra_headers),
            responseType: 'json',
            observe: 'response',
        });
    }
}
