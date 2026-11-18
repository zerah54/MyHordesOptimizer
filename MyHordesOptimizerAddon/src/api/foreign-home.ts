import { state } from '../state';
import { fetcher } from '../utils/fetch';
import type { CitizenHomeValues } from '../utils/foreign-home';
import type { CountedInventoryObject } from '../utils/item-lookup';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/**
 * Envoie à MHO une donnée d'un autre citoyen de ma ville.
 * @param route Route de `ExternalToolsController` (`Home`, `Chest`).
 * @param body Corps attendu par la route.
 */
function postCitizenData(route: string, body: object): Promise<void> {
    return fetcher(`${state.api_url}/ExternalTools/${route}?townId=${state.mh_user.townDetails?.townId}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
        .then((response: Response): Promise<void> | undefined => response.status >= 200 && response.status < 300 ? undefined : convertResponsePromiseToError(response))
        .catch((error: unknown): never => {
            addError(error);
            throw error;
        });
}

/**
 * Remplace l'habitation et les travaux d'un citoyen dans MHO.
 * @param user_id Id du User.
 * @param home Contenu complet de la maison.
 */
export function saveCitizenHome(user_id: number, home: CitizenHomeValues): Promise<void> {
    return postCitizenData('Home', { userId: user_id, home });
}

/**
 * Remplace le contenu du coffre d'un citoyen dans MHO.
 * @param user_id Id du User.
 * @param objects Objets du coffre.
 */
export function saveCitizenChest(user_id: number, objects: CountedInventoryObject[]): Promise<void> {
    return postCitizenData('Chest', { userId: user_id, objects });
}
