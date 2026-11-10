import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/** Déclare à l'API si le joueur a ses chaussures équipées ; rien n'est envoyé sans état détecté ni ville connue. */
export function saveShoesEquipped(equipped: boolean | undefined): Promise<void> | undefined {
    const town_id: number | undefined = state.mh_user.townDetails?.townId;
    if (equipped === undefined || town_id === undefined || town_id === null) return undefined;

    return fetcher(state.api_url + `/town/${town_id}/user/${state.mh_user.id}/shoesEquipped`, {
        method: 'POST',
        body: JSON.stringify({ shoesEquipped: equipped }),
        headers: { 'Content-Type': 'application/json' }
    })
        .then((response: Response): Promise<void> | undefined => response.status >= 200 && response.status < 300 ? undefined : convertResponsePromiseToError(response))
        .catch((error: unknown): never => {
            addError(error);
            throw error;
        });
}
