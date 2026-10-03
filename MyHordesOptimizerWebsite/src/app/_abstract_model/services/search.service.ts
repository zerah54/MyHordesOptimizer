import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { DirectorySearchResultDTO, GlossaryEntryDTO } from '../dto/search.dto';
import { GlobalService } from './_global.service';

/**
 * Données de la recherche globale de l'en-tête servies à la demande : l'annuaire (joueurs, villes),
 * trop grand pour être chargé dans le navigateur, et le glossaire des sigles.
 *
 * Ni indicateur de chargement global ni message d'erreur : ces appels suivent la frappe, et la
 * recherche locale reste utilisable si l'un d'eux échoue.
 */
@Injectable({ providedIn: 'root' })
export class SearchService extends GlobalService {

    /** Joueurs et villes dont le nom contient la saisie, `limit` résultats au plus par groupe */
    public searchDirectory(query: string, limit: number): Observable<DirectorySearchResultDTO> {
        const params: HttpParams = new HttpParams().set('query', query).set('limit', String(limit));
        return this.get<DirectorySearchResultDTO>(`${this.API_URL}/Search/directory`, true, params, true)
            .pipe(map((response: HttpResponse<DirectorySearchResultDTO>): DirectorySearchResultDTO => response.body ?? {
                players: { total: 0, items: [] },
                towns: { total: 0, items: [] }
            }));
    }

    /** Glossaire de la langue du site (vide pour une langue qui n'en a pas) */
    public getGlossary(locale: string): Observable<GlossaryEntryDTO[]> {
        const params: HttpParams = new HttpParams().set('locale', locale);
        return this.get<GlossaryEntryDTO[]>(`${this.API_URL}/Search/glossary`, true, params, true)
            .pipe(map((response: HttpResponse<GlossaryEntryDTO[]>): GlossaryEntryDTO[] => response.body ?? []));
    }
}
