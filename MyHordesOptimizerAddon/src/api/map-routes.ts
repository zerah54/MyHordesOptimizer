import { state } from '../state';
import type { ApiMapRoute } from '../types';
import { fetcher } from '../utils/fetch';
import { convertResponsePromiseToError } from '../utils/version';

/** Tracés de ma ville liés à aucune partie d'expédition, quel que soit le jour (`GET MapRoutes/{mapId}`, comme le site), sans notification d'erreur (à l'appelant). */
export async function loadRoutesWithoutExpedition(): Promise<ApiMapRoute[]> {
    const map_id: number | undefined = state.mh_user?.townDetails?.townId;
    if (!map_id) return [];

    /** Seuls les citoyens reçoivent les tracés : le jeton est attendu s'il est en cours de renouvellement */
    const response: Response = await fetcher(`${state.api_url}/MapRoutes/${map_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }, { wait_for_token: true });
    if (response.status !== 200) {
        return convertResponsePromiseToError(response);
    }
    const body: { routes?: unknown } | null = await response.json();
    const routes: ApiMapRoute[] = Array.isArray(body?.routes) ? body.routes as ApiMapRoute[] : [];
    return routes.filter((route: ApiMapRoute): boolean => (route.linkedParts?.length ?? 0) === 0);
}
