import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BYPASS_ERROR, BYPASS_LOADING } from '../../_core/services/http-context-tokens';
import { PreTown, PreTownLinkPreview, PreTownLinkResult, PreTownSummary } from '../types/pre-town.class';

/** Pré-villes : préparation d'une ville avant son lancement (membres, organisateurs, liaison à la ville réelle). */
@Injectable({ providedIn: 'root' })
export class PreTownService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly base_url: string = `${environment.api_url}/PreTowns`;

    /**
     * Crée une pré-ville dont l'appelant est organisateur.
     * @param {string} alias Nom de la pré-ville.
     * @returns {Observable<PreTown>} Pré-ville créée.
     */
    public create(alias: string): Observable<PreTown> {
        return this.http.post<PreTown>(this.base_url, { alias });
    }

    /** Identifiants des pré-villes que l'appelant n'a pas encore ouvertes, d'après la dernière liste obtenue. */
    private readonly unseen_ids: WritableSignal<ReadonlySet<number>> = signal<ReadonlySet<number>>(new Set<number>());
    private refresh_requested: boolean = false;

    /** Nombre de pré-villes jamais ouvertes par l'appelant (pastille du menu). */
    public readonly unseenPreTownCount: Signal<number> = computed((): number => this.unseen_ids().size);

    /** Pré-villes de l'appelant. */
    public listMine(): Observable<PreTownSummary[]> {
        return this.http.get<PreTownSummary[]>(`${this.base_url}/mine`)
            .pipe(tap((items: PreTownSummary[]): void => this.setUnseen(items)));
    }

    /**
     * Renseigne le compteur de pré-villes non vues, une seule fois par session, sans loader ni message d'erreur :
     * l'échec d'une pastille ne doit pas gêner l'utilisateur.
     */
    public refreshUnseenCount(): void {
        if (this.refresh_requested) return;
        this.refresh_requested = true;
        const context: HttpContext = new HttpContext().set(BYPASS_LOADING, true).set(BYPASS_ERROR, true);
        this.http.get<PreTownSummary[]>(`${this.base_url}/mine`, { context })
            .subscribe({ next: (items: PreTownSummary[]): void => this.setUnseen(items), error: (): void => undefined });
    }

    /** Remplace l'ensemble des pré-villes non vues par celles de la liste. */
    private setUnseen(items: PreTownSummary[]): void {
        this.unseen_ids.set(new Set<number>(items.filter((item: PreTownSummary): boolean => !item.seen).map((item: PreTownSummary): number => item.preTownId)));
    }

    /**
     * Détail d'une pré-ville.
     * @param {number} id Identifiant de la pré-ville.
     * @returns {Observable<PreTown>} Pré-ville.
     */
    public get(id: number): Observable<PreTown> {
        return this.http.get<PreTown>(`${this.base_url}/${id}`);
    }

    /**
     * Ajoute un membre (organisateur uniquement).
     * @param {number} id Identifiant de la pré-ville.
     * @param {number} idUser Joueur à ajouter.
     * @returns {Observable<void>} Complète une fois le membre ajouté.
     */
    public addMember(id: number, idUser: number): Observable<void> {
        return this.http.put<void>(`${this.base_url}/${id}/members/${idUser}`, {});
    }

    /**
     * Retire un membre, ou quitte la pré-ville si c'est l'appelant.
     * @param {number} id Identifiant de la pré-ville.
     * @param {number} idUser Joueur à retirer.
     * @returns {Observable<void>} Complète une fois le membre retiré.
     */
    public removeMember(id: number, idUser: number): Observable<void> {
        return this.http.delete<void>(`${this.base_url}/${id}/members/${idUser}`);
    }

    /**
     * Promeut ou rétrograde un membre.
     * @param {number} id Identifiant de la pré-ville.
     * @param {number} idUser Membre concerné.
     * @param {boolean} isOrganizer Nouveau statut.
     * @returns {Observable<void>} Complète une fois le statut modifié.
     */
    public setOrganizer(id: number, idUser: number, isOrganizer: boolean): Observable<void> {
        return this.http.put<void>(`${this.base_url}/${id}/organizers/${idUser}`, {}, { params: new HttpParams().set('isOrganizer', isOrganizer) });
    }

    /**
     * Renomme la pré-ville.
     * @param {number} id Identifiant de la pré-ville.
     * @param {string} alias Nouveau nom.
     * @returns {Observable<void>} Complète une fois renommée.
     */
    public rename(id: number, alias: string): Observable<void> {
        return this.http.put<void>(`${this.base_url}/${id}/alias`, { alias });
    }

    /**
     * Règle le nombre de citoyens simulés.
     * @param {number} id Identifiant de la pré-ville.
     * @param {number} count Nombre de citoyens (1 à 40).
     * @returns {Observable<void>} Complète une fois enregistré.
     */
    public setSimulatedCitizens(id: number, count: number): Observable<void> {
        return this.http.put<void>(`${this.base_url}/${id}/simulated-citizens`, { simulatedCitizens: count });
    }

    /**
     * Marque la pré-ville comme vue par l'appelant (sans loader global).
     * @param {number} id Identifiant de la pré-ville.
     * @returns {Observable<void>} Complète une fois enregistré.
     */
    public markSeen(id: number): Observable<void> {
        return this.http.put<void>(`${this.base_url}/${id}/seen`, {}, { context: new HttpContext().set(BYPASS_LOADING, true) })
            .pipe(tap((): void => this.markUnseenAsSeen(id)));
    }

    /** Retire l'identifiant des non-vues ; sans effet s'il n'y figure pas. */
    private markUnseenAsSeen(id: number): void {
        if (!this.unseen_ids().has(id)) return;
        const next: Set<number> = new Set<number>(this.unseen_ids());
        next.delete(id);
        this.unseen_ids.set(next);
    }

    /**
     * Simule la liaison vers la ville actuelle de l'appelant.
     * @param {number} id Identifiant de la pré-ville.
     * @returns {Observable<PreTownLinkPreview>} Bilan simulé.
     */
    public previewLink(id: number): Observable<PreTownLinkPreview> {
        return this.http.get<PreTownLinkPreview>(`${this.base_url}/${id}/link/preview`);
    }

    /**
     * Lie la pré-ville à la ville actuelle de l'appelant.
     * @param {number} id Identifiant de la pré-ville.
     * @returns {Observable<PreTownLinkResult>} Bilan de la liaison.
     */
    public link(id: number): Observable<PreTownLinkResult> {
        return this.http.post<PreTownLinkResult>(`${this.base_url}/${id}/link`, {});
    }

    /**
     * Défait la liaison.
     * @param {number} id Identifiant de la pré-ville.
     * @returns {Observable<void>} Complète une fois la liaison défaite.
     */
    public unlink(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base_url}/${id}/link`);
    }

    /**
     * Duplique la pré-ville sous un nouvel alias.
     * @param {number} id Identifiant de la pré-ville source.
     * @param {string} alias Nom de la copie.
     * @returns {Observable<PreTown>} Pré-ville créée.
     */
    public duplicate(id: number, alias: string): Observable<PreTown> {
        return this.http.post<PreTown>(`${this.base_url}/${id}/duplicate`, { alias });
    }
}
