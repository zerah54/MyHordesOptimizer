import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { getTown } from '../../_core/utilities/localstorage.util';
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

    /** Propositions de la ville, valeurs d'objets et droits de l'utilisateur. */
    public getPlans(): Observable<BuildingPlansDTO> {
        return this.get<BuildingPlansDTO>(this.baseUrl()).pipe(map(BuildingPlanService.body));
    }

    /** Niveaux de maison et améliorations (référentiel statique du jeu). */
    public getHomeReferential(): Observable<HomeReferentialDTO> {
        return this.get<HomeReferentialDTO>(`${this.API_URL}/Fetcher/HomeReferential`).pipe(map(BuildingPlanService.body));
    }

    /**
     * État synchronisé des chantiers et défense de la ville.
     * @param {boolean} silent Sans loader ni message d'erreur (appel d'appoint dont l'échec est toléré).
     * @returns {Observable<BuildingPlanStateDTO>} État.
     */
    public getState(silent: boolean = false): Observable<BuildingPlanStateDTO> {
        return this.get<BuildingPlanStateDTO>(`${this.baseUrl()}/state`, silent, undefined, silent).pipe(map(BuildingPlanService.body));
    }

    /**
     * Crée (sans `id`) ou modifie une proposition. Le 409 d'une modification est sans message : le store affiche la bannière de conflit.
     * @param {BuildingPlanRequestDTO} request Proposition ; `version` obligatoire pour une modification.
     * @returns {Observable<BuildingPlanDTO>} Proposition enregistrée.
     */
    public savePlan(request: BuildingPlanRequestDTO): Observable<BuildingPlanDTO> {
        const silent_status: number | null = request.id !== null && request.id !== undefined ? 409 : null;
        return this.put<BuildingPlanDTO>(`${this.baseUrl()}/plans`, request, undefined, false, silent_status).pipe(map(BuildingPlanService.body));
    }

    /**
     * Supprime une proposition.
     * @param {number} plan_id Identifiant de la proposition.
     * @returns {Observable<void>} Complète une fois la proposition supprimée.
     */
    public deletePlan(plan_id: number): Observable<void> {
        return this.delete<void>(`${this.baseUrl()}/plans/${plan_id}`).pipe(map((): void => undefined));
    }

    /**
     * Rend une proposition effective pour son jour.
     * @param {number} plan_id Identifiant de la proposition.
     * @returns {Observable<BuildingPlanDTO>} Proposition devenue effective.
     */
    public setEffective(plan_id: number): Observable<BuildingPlanDTO> {
        return this.put<BuildingPlanDTO>(`${this.baseUrl()}/plans/${plan_id}/effective`, {}).pipe(map(BuildingPlanService.body));
    }

    /**
     * Enregistre la valeur en PA des objets.
     * @param {BuildingPlanSettingsRequestDTO} request Valeurs et version lue.
     * @returns {Observable<BuildingPlansDTO>} Plans et réglages à jour.
     */
    public saveSettings(request: BuildingPlanSettingsRequestDTO): Observable<BuildingPlansDTO> {
        return this.put<BuildingPlansDTO>(`${this.baseUrl()}/settings`, request).pipe(map(BuildingPlanService.body));
    }

    private baseUrl(): string {
        return `${this.API_URL}/BuildingPlans/${getTown()?.town_id}`;
    }

    private static body<T>(response: HttpResponse<T>): T {
        return response.body as T;
    }
}
