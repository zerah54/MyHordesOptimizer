import { HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { ImportJobKey, ImportJobStateDTO } from '../dto/import-job-state.dto';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class AdminService extends GlobalService {
    public readonly isAdmin: WritableSignal<boolean> = signal<boolean>(false);

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

    /**
     * Déclenche l'import global, qui s'exécute côté serveur en tâche de fond : la réponse est immédiate
     * et ne dit rien de son issue, qu'il faut suivre via {@link getImportStatus}.
     */
    public importAll(): Observable<ImportJobStateDTO> {
        return this.startImportJob(`${this.API_URL}/admin/import/all`);
    }

    public getImportStatus(job: ImportJobKey): Observable<ImportJobStateDTO> {
        return super.get<ImportJobStateDTO>(`${this.API_URL}/admin/import/${job}/status`, true).pipe(
            map((result: HttpResponse<ImportJobStateDTO>) => result.body as ImportJobStateDTO)
        );
    }

    /** Comme {@link importAll}, s'exécute en tâche de fond et se suit via {@link getImportStatus} */
    public importTowns(season?: number): Observable<ImportJobStateDTO> {
        const url: string = season !== undefined
            ? `${this.API_URL}/admin/import/towns?season=${season}`
            : `${this.API_URL}/admin/import/towns`;
        return this.startImportJob(url);
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

    public importPictos(): Observable<void> {
        return super.post<void>(`${this.API_URL}/admin/import/pictos`);
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

    /**
     * Un 409 signifie que cet import était déjà en cours ; son état est renvoyé tel quel, il n'y a rien
     * à signaler à l'utilisateur au-delà de l'avancement.
     */
    private startImportJob(url: string): Observable<ImportJobStateDTO> {
        return super.post<ImportJobStateDTO>(url, undefined, true).pipe(
            catchError((error: HttpErrorResponse) => error.status === HttpStatusCode.Conflict
                ? of(error.error as ImportJobStateDTO)
                : throwError(() => error))
        );
    }
}
