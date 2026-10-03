import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import type { TownCitizenRef } from '../utils/successful-digs-page';
import { convertResponsePromiseToError } from '../utils/version';

export function getCitizens() {
    return new Promise<any>((resolve, reject) => {
        fetcher(state.api_url + `/Fetcher/citizens?userId=${state.mh_user.id}&townId=${state.mh_user.townDetails?.townId}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return convertResponsePromiseToError(response);
                }
            })
            .then((response) => {
                state.citizens = response;
                (state.citizens as any).citizens = Object.keys((state.citizens as any).citizens).map((key) => (state.citizens as any).citizens[key]);
                resolve(state.citizens);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/**
 * Citoyens de la ville du joueur, lus dans la base MHO (`GET Fetcher/citizens`, aucun appel à MyHordes),
 * réduits à l'identifiant, au pseudo et au métier. Ne touche pas à `state.citizens`.
 */
export async function fetchTownCitizenRefs(): Promise<TownCitizenRef[]> {
    const response: Response = await fetcher(`${state.api_url}/Fetcher/citizens?userId=${state.mh_user?.id}&townId=${state.mh_user?.townDetails?.townId}`);
    if (response.status !== 200) {
        return convertResponsePromiseToError(response);
    }
    return readTownCitizenRefs(await response.json());
}

/** Lecture défensive de la réponse : une entrée sans identifiant numérique ni pseudo est ignorée */
export function readTownCitizenRefs(body: unknown): TownCitizenRef[] {
    if (typeof body !== 'object' || body === null || !('citizens' in body) || !Array.isArray(body.citizens)) {
        return [];
    }
    return body.citizens.flatMap((citizen: unknown): TownCitizenRef[] => {
        if (typeof citizen !== 'object' || citizen === null || !('id' in citizen) || !('name' in citizen)
            || typeof citizen.id !== 'number' || typeof citizen.name !== 'string') {
            return [];
        }
        const job: unknown = 'jobUid' in citizen ? citizen.jobUid : null;
        return [{ id: citizen.id, name: citizen.name, job: typeof job === 'string' ? job : null }];
    });
}

/** Récupère les informations de la banque */
