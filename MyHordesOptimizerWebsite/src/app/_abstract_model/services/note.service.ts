import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { NoteDTO } from '../dto/note.dto';
import { Dictionary } from '../types/_types';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class NoteService extends GlobalService {

    /** Toutes les notes de ville de l'appelant, indexées par mapId. Un seul appel pour toute une liste. */
    public getMyTownNotes(): Observable<Dictionary<NoteDTO>> {
        return this.get<Dictionary<NoteDTO>>(`${this.API_URL}/Note/town/mine`, true).pipe(
            map((response: HttpResponse<Dictionary<NoteDTO>>) => response.body ?? {})
        );
    }

    public saveTownNote(mapId: number, note: string): Observable<void> {
        return this.put<void>(`${this.API_URL}/Note/town/${mapId}`, { note }).pipe(map(() => undefined));
    }

    /** Toutes les notes globales de l'appelant, indexées par userId. Un seul appel pour toute une liste. */
    public getMyUserNotes(): Observable<Dictionary<NoteDTO>> {
        return this.get<Dictionary<NoteDTO>>(`${this.API_URL}/Note/user/mine`, true).pipe(
            map((response: HttpResponse<Dictionary<NoteDTO>>) => response.body ?? {})
        );
    }

    /** Note globale (toutes villes confondues) sur un utilisateur. */
    public getUserNote(userId: number): Observable<NoteDTO> {
        return this.get<NoteDTO>(`${this.API_URL}/Note/user/${userId}`, true).pipe(
            map((response: HttpResponse<NoteDTO>) => response.body ?? { note: null })
        );
    }

    public saveUserNote(userId: number, note: string): Observable<void> {
        return this.put<void>(`${this.API_URL}/Note/user/${userId}`, { note }).pipe(map(() => undefined));
    }

    /** Toutes les notes-citoyen de l'appelant pour cette ville, indexées par userId. Un seul appel par ville. */
    public getMyCitizenNotes(townId: number): Observable<Dictionary<NoteDTO>> {
        const params: HttpParams = new HttpParams().set('townId', townId);
        return this.get<Dictionary<NoteDTO>>(`${this.API_URL}/Note/citizen/mine`, true, params).pipe(
            map((response: HttpResponse<Dictionary<NoteDTO>>) => response.body ?? {})
        );
    }

    public saveCitizenNote(userId: number, townId: number, note: string): Observable<void> {
        const params: HttpParams = new HttpParams().set('townId', townId);
        return this.put<void>(`${this.API_URL}/Note/citizen/${userId}`, { note }, params).pipe(map(() => undefined));
    }

    /** Toutes les notes-citoyen de l'appelant sur ce joueur, indexées par mapId de ville. Un seul appel pour tout son profil. */
    public getMyCitizenNotesForUser(userId: number): Observable<Dictionary<NoteDTO>> {
        return this.get<Dictionary<NoteDTO>>(`${this.API_URL}/Note/citizen/${userId}/mine`, true).pipe(
            map((response: HttpResponse<Dictionary<NoteDTO>>) => response.body ?? {})
        );
    }
}
