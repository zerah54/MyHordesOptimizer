import { state } from '../state';
import type { ApiBuildingPlans, ApiBuildingRef, TownBuildingState } from '../types/building-plan';
import { fetcher } from '../utils/fetch';
import { convertResponsePromiseToError } from '../utils/version';

let building_refs_promise: Promise<ApiBuildingRef[]> | null = null;

/** Identifiant de la ville de l'utilisateur, `undefined` s'il n'en a pas. */
function getTownId(): number | undefined {
    return state.mh_user?.townDetails?.townId || undefined;
}

/** Appel authentifié (jeton attendu s'il est en renouvellement) ; une réponse non 200 rejette. */
async function request<T>(url: string, init: RequestInit): Promise<T> {
    const response: Response = await fetcher(url, {
        ...init,
        headers: { 'Content-Type': 'application/json' }
    }, { wait_for_token: true });
    if (response.status !== 200) {
        return convertResponsePromiseToError(response);
    }
    return response.json() as Promise<T>;
}

/** Plans de chantiers de la ville (`GET BuildingPlans/{townId}`) ; `null` sans ville. */
export async function loadBuildingPlans(): Promise<ApiBuildingPlans | null> {
    const town_id: number | undefined = getTownId();
    if (!town_id) return null;
    return request<ApiBuildingPlans>(`${state.api_url}/BuildingPlans/${town_id}`, { method: 'GET' });
}

/** État des chantiers de la ville (`GET BuildingPlans/{townId}/state`) ; vide sans ville. */
export async function loadBuildingStates(): Promise<TownBuildingState[]> {
    const town_id: number | undefined = getTownId();
    if (!town_id) return [];
    const body: { buildings?: TownBuildingState[] } | null = await request<{ buildings?: TownBuildingState[] } | null>(
        `${state.api_url}/BuildingPlans/${town_id}/state`, { method: 'GET' });
    return body?.buildings ?? [];
}

/** Référentiel des chantiers, un seul appel par chargement de page. */
export function loadBuildingRefs(): Promise<ApiBuildingRef[]> {
    if (building_refs_promise === null) {
        building_refs_promise = request<ApiBuildingRef[]>(`${state.api_url}/Fetcher/Buildings`, { method: 'GET' })
            .catch((error: unknown): never => {
                building_refs_promise = null;
                throw error;
            });
    }
    return building_refs_promise;
}

/** Enregistre un champ de la maison du joueur (comme `TownService.updateHomeFields` du site). */
export async function saveHomeField(key: string, value: number | boolean): Promise<void> {
    const town_id: number | undefined = getTownId();
    if (!town_id) return;
    await request<unknown>(`${state.api_url}/ExternalTools/home?townId=${town_id}`, {
        method: 'POST',
        body: JSON.stringify({ userId: state.mh_user?.id, home: { [key]: value } })
    });
}
