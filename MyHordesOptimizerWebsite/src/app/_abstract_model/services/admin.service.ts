import { HttpResponse } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { GlobalService } from './_global.service';

@Injectable({providedIn: 'root'})
export class AdminService extends GlobalService {
    readonly isAdmin: WritableSignal<boolean> = signal<boolean>(false);

    public checkIsAdmin(): Observable<boolean> {
        return super.get<boolean>(`${this.API_URL}/admin/is-admin`).pipe(
            tap((result: HttpResponse<boolean>) => this.isAdmin.set(result.body ?? false)),
            map((result: HttpResponse<boolean>) => result.body ?? false),
            catchError(() => {
                this.isAdmin.set(false);
                return of(false);
            })
        );
    }
}
