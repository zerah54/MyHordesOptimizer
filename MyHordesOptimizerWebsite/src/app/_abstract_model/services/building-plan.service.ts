import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { getTown } from '../../_core/utilities/localstorage.util';
import { BuildingUpgradesDTO } from '../../my-town/buildings/planning/building-upgrades.types';
import { HomeReferentialDTO } from '../../my-town/buildings/planning/home-referential.types';
import {
    BuildingPlanDTO,
    BuildingPlanRequestDTO,
    BuildingPlansDTO,
    BuildingPlanSettingsRequestDTO,
    BuildingPlanStateDTO
} from '../../my-town/buildings/planning/plan.types';
import { GlobalService } from './_global.service';

/** Plans de chantiers de la ville : propositions par jour, réglages de valeur des objets, état synchronisé. */
@Injectable({ providedIn: 'root' })
export class BuildingPlanService extends GlobalService {

    /**
     * Propositions de la ville, valeurs d'objets et droits de l'utilisateur.
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<BuildingPlansDTO>} Propositions, réglages et droits.
     */
    public getPlans(map_id?: number): Observable<BuildingPlansDTO> {
        return this.get<BuildingPlansDTO>(this.baseUrl(map_id)).pipe(map(BuildingPlanService.body));
    }

    /** Niveaux de maison et améliorations (référentiel statique du jeu). */
    public getHomeReferential(): Observable<HomeReferentialDTO> {
        return this.get<HomeReferentialDTO>(`${this.API_URL}/Fetcher/HomeReferential`).pipe(map(BuildingPlanService.body));
    }

    /**
     * Évolutions des chantiers (référentiel statique du jeu) ; vide, sans message d'erreur, si l'API ne les fournit pas encore.
     * @returns {Observable<BuildingUpgradesDTO>} Évolutions par uid.
     */
    public getBuildingUpgrades(): Observable<BuildingUpgradesDTO> {
        return this.get<BuildingUpgradesDTO>(`${this.API_URL}/Fetcher/BuildingUpgrades`, true, undefined, true).pipe(
            map(BuildingPlanService.body),
            catchError((): Observable<BuildingUpgradesDTO> => of({}))
        );
    }

    /**
     * État synchronisé des chantiers et défense de la ville.
     * @param {boolean} silent Sans loader ni message d'erreur (appel d'appoint dont l'échec est toléré).
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<BuildingPlanStateDTO>} État.
     */
    public getState(silent: boolean = false, map_id?: number): Observable<BuildingPlanStateDTO> {
        return this.get<BuildingPlanStateDTO>(`${this.baseUrl(map_id)}/state`, silent, undefined, silent).pipe(map(BuildingPlanService.body));
    }

    /**
     * Crée (sans `id`) ou modifie une proposition. Les 409 et 423 d'une modification sont sans message : le store affiche sa bannière.
     * @param {BuildingPlanRequestDTO} request Proposition ; `version` obligatoire pour une modification.
     * @param {string | null} connection_id Connexion au hub de l'appelant (verrou, exclusion de la diffusion).
     * @param {number} [map_id] Ville de la page appelante : l'enregistrement de sortie part après un changement de contexte.
     * @returns {Observable<BuildingPlanDTO>} Proposition enregistrée.
     */
    public savePlan(request: BuildingPlanRequestDTO, connection_id: string | null = null, map_id?: number): Observable<BuildingPlanDTO> {
        const silent_status: readonly number[] | null = request.id !== null && request.id !== undefined ? [409, 423] : null;
        return this.put<BuildingPlanDTO>(`${this.baseUrl(map_id)}/plans`, request, undefined, false, silent_status, BuildingPlanService.connectionHeaders(connection_id))
            .pipe(map(BuildingPlanService.body));
    }

    /**
     * Supprime une proposition.
     * @param {number} plan_id Identifiant de la proposition.
     * @param {string | null} connection_id Connexion au hub de l'appelant (verrou, exclusion de la diffusion).
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<void>} Complète une fois la proposition supprimée.
     */
    public deletePlan(plan_id: number, connection_id: string | null = null, map_id?: number): Observable<void> {
        return this.delete<void>(`${this.baseUrl(map_id)}/plans/${plan_id}`, BuildingPlanService.connectionHeaders(connection_id)).pipe(map((): void => undefined));
    }

    /**
     * Rend une proposition effective pour son jour.
     * @param {number} plan_id Identifiant de la proposition.
     * @param {string | null} connection_id Connexion au hub de l'appelant (exclue de la diffusion).
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<BuildingPlanDTO>} Proposition devenue effective.
     */
    public setEffective(plan_id: number, connection_id: string | null = null, map_id?: number): Observable<BuildingPlanDTO> {
        return this.put<BuildingPlanDTO>(`${this.baseUrl(map_id)}/plans/${plan_id}/effective`, {}, undefined, false, null, BuildingPlanService.connectionHeaders(connection_id))
            .pipe(map(BuildingPlanService.body));
    }

    /**
     * Enregistre la valeur en PA des objets.
     * @param {BuildingPlanSettingsRequestDTO} request Valeurs et version lue.
     * @param {string | null} connection_id Connexion au hub de l'appelant (exclue de la diffusion).
     * @param {number} [map_id] Ville de la page appelante ; par défaut celle du contexte au moment de l'appel.
     * @returns {Observable<BuildingPlansDTO>} Plans et réglages à jour.
     */
    public saveSettings(request: BuildingPlanSettingsRequestDTO, connection_id: string | null = null, map_id?: number): Observable<BuildingPlansDTO> {
        return this.put<BuildingPlansDTO>(`${this.baseUrl(map_id)}/settings`, request, undefined, false, null, BuildingPlanService.connectionHeaders(connection_id))
            .pipe(map(BuildingPlanService.body));
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
        return `${this.API_URL}/BuildingPlans/${map_id}`;
    }

    private static body<T>(response: HttpResponse<T>): T {
        return response.body as T;
    }
}
