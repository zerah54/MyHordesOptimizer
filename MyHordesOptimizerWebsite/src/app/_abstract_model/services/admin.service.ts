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

    public importAll(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/all`);
    }

    public importHeroSkills(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/hero-skills`);
    }

    public importCausesOfDeath(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/causes-of-death`);
    }

    public importCleanupTypes(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/cleanup-types`);
    }

    public importItems(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/items`);
    }

    public importRuins(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/ruins`);
    }

    public importCategories(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/categories`);
    }

    public importWishlistCategories(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/wishlist-categories`);
    }

    public importDefaultWishlists(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/default-wishlists`);
    }

    public importBuildings(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/buildings`);
    }

    public importJobs(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/jobs`);
    }

    public importTowns(season?: number): Observable<void> {
        const url: string = season != null
            ? `${this.API_URL}/admin/import/towns?season=${season}`
            : `${this.API_URL}/admin/import/towns`;
        return super.post<void>(url);
    }

    public importTown(townId: number): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/towns/${townId}/import`);
    }

    public deleteTown(townId: number): Observable<void> {
        return super.delete<void>(`${this.API_URL}/admin/towns/${townId}`).pipe(map(() => undefined));
    }

    public finishSeason(season: number): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/seasons/${season}/finish`);
    }

    public unfinishSeason(season: number): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/seasons/${season}/unfinish`);
    }
}
