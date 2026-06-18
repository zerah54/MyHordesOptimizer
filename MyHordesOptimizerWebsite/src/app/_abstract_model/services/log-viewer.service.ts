import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import { map, Observable } from 'rxjs';
import { LogPageResultDTO } from '../dto/log-viewer.dto';
import { LogViewerMapper } from '../mapper/log-viewer.mapper';
import { LogFilters, LogPageResult } from '../types/log-viewer.model';
import { GlobalService } from './_global.service';

@Injectable({providedIn: 'root'})
export class LogViewerService extends GlobalService {

    public getLogs(date: Moment, page: number, pageSize: number, filters: LogFilters): Observable<LogPageResult | null> {
        let params: HttpParams = new HttpParams()
            .set('date', date.format('YYYY-MM-DD'))
            .set('page', page)
            .set('pageSize', pageSize);

        if (filters.level) params = params.set('level', filters.level);
        if (filters.correlationId?.trim()) params = params.set('correlationId', filters.correlationId.trim());
        if (filters.search?.trim()) params = params.set('search', filters.search.trim());

        return super.get<LogPageResultDTO>(`${this.API_URL}/admin/logs`, false, params)
            .pipe(map((response: HttpResponse<LogPageResultDTO>) => {
                return LogViewerMapper.dtoToModel(response.body);
            }));
    }

    public getAvailableDates(): Observable<string[]> {
        return this.http.get<string[]>(`${this.API_URL}/admin/dates`);
    }
}
