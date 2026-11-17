import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { getTown } from '../../_core/utilities/localstorage.util';
import {
    NightwatchPlanDTO,
    NightwatchPlanRequestDTO,
    NightwatchPlansDTO,
    NightwatchReferentialDTO,
    NightwatchStateDTO
} from '../../my-town/nightwatch/nightwatch.types';
import { GlobalService } from './_global.service';

/** Plans de veille de la ville : propositions par jour, référentiel du modèle, état réel de la ville. */
@Injectable({ providedIn: 'root' })
export class NightwatchPlanService extends GlobalService {

    /**
     * Propositions de la ville et droits de l'utilisateur.
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<NightwatchPlansDTO>} Propositions et droits.
     */
    public getPlans(map_id?: number): Observable<NightwatchPlansDTO> {
        return this.get<NightwatchPlansDTO>(this.baseUrl(map_id)).pipe(map(NightwatchPlanService.body));
    }

    /** Paramètres du modèle de veille (référentiel statique). */
    public getReferential(): Observable<NightwatchReferentialDTO> {
        return this.get<NightwatchReferentialDTO>(`${this.API_URL}/Fetcher/NightwatchReferential`).pipe(map(NightwatchPlanService.body));
    }

    /**
     * État réel de la ville lu en base pour un jour.
     * @param {number} day Jour de la veille.
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<NightwatchStateDTO>} État.
     */
    public getState(day: number, map_id?: number): Observable<NightwatchStateDTO> {
        return this.get<NightwatchStateDTO>(`${this.baseUrl(map_id)}/state`, false, new HttpParams().set('day', day)).pipe(map(NightwatchPlanService.body));
    }

    /**
     * Crée (sans `id`) ou modifie une proposition. Les 409 et 423 d'une modification sont sans message : le store affiche sa bannière.
     * @param {NightwatchPlanRequestDTO} request Proposition ; `version` obligatoire pour une modification.
     * @param {string | null} connection_id Connexion au hub de l'appelant (verrou, exclusion de la diffusion).
     * @param {number} [map_id] Ville de la page appelante : l'enregistrement de sortie part après un changement de contexte.
     * @returns {Observable<NightwatchPlanDTO>} Proposition enregistrée.
     */
    public savePlan(request: NightwatchPlanRequestDTO, connection_id: string | null = null, map_id?: number): Observable<NightwatchPlanDTO> {
        const silent_status: readonly number[] | null = request.id !== null && request.id !== undefined ? [409, 423] : null;
        return this.put<NightwatchPlanDTO>(`${this.baseUrl(map_id)}/plans`, request, undefined, false, silent_status, NightwatchPlanService.connectionHeaders(connection_id))
            .pipe(map(NightwatchPlanService.body));
    }

    /**
     * Supprime une proposition.
     * @param {number} plan_id Identifiant de la proposition.
     * @param {string | null} connection_id Connexion au hub de l'appelant.
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<void>} Complète une fois la proposition supprimée.
     */
    public deletePlan(plan_id: number, connection_id: string | null = null, map_id?: number): Observable<void> {
        return this.delete<void>(`${this.baseUrl(map_id)}/plans/${plan_id}`, NightwatchPlanService.connectionHeaders(connection_id)).pipe(map((): void => undefined));
    }

    /**
     * Rend une proposition effective pour son jour.
     * @param {number} plan_id Identifiant de la proposition.
     * @param {string | null} connection_id Connexion au hub de l'appelant (exclue de la diffusion).
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<NightwatchPlanDTO>} Proposition devenue effective.
     */
    public setEffective(plan_id: number, connection_id: string | null = null, map_id?: number): Observable<NightwatchPlanDTO> {
        return this.put<NightwatchPlanDTO>(`${this.baseUrl(map_id)}/plans/${plan_id}/effective`, {}, undefined, false, null, NightwatchPlanService.connectionHeaders(connection_id))
            .pipe(map(NightwatchPlanService.body));
    }

    /**
     * En-tête identifiant la connexion au hub, absent sans connexion.
     * @param {string | null} connection_id Connexion au hub.
     * @returns {Record<string, string>} En-têtes à ajouter.
     */
    private static connectionHeaders(connection_id: string | null): Record<string, string> {
        return connection_id !== null && connection_id !== '' ? { 'Mho-Hub-Connection': connection_id } : {};
    }

    /**
     * URL des plans d'une ville.
     * @param {number} [map_id] Ville visée ; par défaut celle du contexte au moment de l'appel.
     * @returns {string} URL de base.
     */
    private baseUrl(map_id: number | undefined = getTown()?.town_id): string {
        return `${this.API_URL}/NightwatchPlans/${map_id}`;
    }

    private static body<T>(response: HttpResponse<T>): T {
        return response.body as T;
    }
}
