import { state } from '../state';
import { fetcher } from '../utils/fetch';
import type { CitizenHomeValues } from '../utils/foreign-home';
import type { CountedInventoryObject } from '../utils/item-lookup';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';
import { getToken } from './token';

/**
 * Id de ma ville : `mh_user` n'est résolu qu'après l'authentification, qui peut ne pas avoir abouti au clic.
 * @throws Si ma ville reste inconnue.
 */
async function resolveTownId(): Promise<number> {
    if (!state.mh_user) {
        await getToken();
    }
    const town_id: number | undefined = state.mh_user?.townDetails?.townId;
    if (!town_id) {
        throw new Error('Ville inconnue : authentification MHO incomplète');
    }
    return town_id;
}

/**
 * Envoie à MHO une donnée d'un autre citoyen de ma ville.
 * @param route Route de `ExternalToolsController` (`Home`, `Chest`).
 * @param body Corps attendu par la route.
 */
async function postCitizenData(route: string, body: object): Promise<void> {
    return resolveTownId()
        .then((town_id: number): Promise<Response> => fetcher(`${state.api_url}/ExternalTools/${route}?townId=${town_id}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        }))
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
