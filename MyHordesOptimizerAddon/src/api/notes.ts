import { state } from '../state';
import type { NoteDto } from '../types';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { convertResponsePromiseToError } from '../utils/version';

/**
 * Reflète en local l'effet d'un upsert : le backend supprime la note quand le texte est
 * vide/blanc (`UpsertUserNoteInternal`/`UpsertTownNote`), le cache client fait de même
 * pour rester cohérent sans re-fetch.
 */
function withLocalNote(dict: Record<number, NoteDto> | undefined, key: number, note: string): Record<number, NoteDto> {
    const next: Record<number, NoteDto> = { ...dict };
    if (note.trim() === '') {
        delete next[key];
    } else {
        next[key] = { note, updatedAt: new Date().toISOString() };
    }
    return next;
}

function putNote(url: string, note: string): Promise<Response> {
    return fetcher(url, {
        method: 'PUT',
        body: JSON.stringify({ note }),
        headers: { 'Content-Type': 'application/json' }
    }).then((response: Response) => response.status === 204 ? response : convertResponsePromiseToError(response));
}

export function getMyTownNotes(): Promise<Record<number, NoteDto>> {
    return new Promise<Record<number, NoteDto>>((resolve, reject) => {
        fetcher(state.api_url + '/Note/town/mine')
            .then((response: Response) => response.status === 200 ? response.json() : convertResponsePromiseToError(response))
            .then((response: Record<number, NoteDto>) => {
                state.town_notes = response;
                resolve(state.town_notes);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

export function upsertTownNote(mapId: number, note: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        putNote(state.api_url + '/Note/town/' + mapId, note)
            .then(() => {
                state.town_notes = withLocalNote(state.town_notes, mapId, note);
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

export function getMyUserNotes(): Promise<Record<number, NoteDto>> {
    return new Promise<Record<number, NoteDto>>((resolve, reject) => {
        fetcher(state.api_url + '/Note/user/mine')
            .then((response: Response) => response.status === 200 ? response.json() : convertResponsePromiseToError(response))
            .then((response: Record<number, NoteDto>) => {
                state.user_notes = response;
                resolve(state.user_notes);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

export function upsertUserNote(userId: number, note: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        putNote(state.api_url + '/Note/user/' + userId, note)
            .then(() => {
                state.user_notes = withLocalNote(state.user_notes, userId, note);
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/** @param mapId Identifiant public de la ville (`data-town-id`), pas l'IdTown interne */
export function getMyCitizenNotes(mapId: number): Promise<Record<number, NoteDto>> {
    return new Promise<Record<number, NoteDto>>((resolve, reject) => {
        fetcher(state.api_url + '/Note/citizen/mine?townId=' + mapId)
            .then((response: Response) => response.status === 200 ? response.json() : convertResponsePromiseToError(response))
            .then((response: Record<number, NoteDto>) => {
                state.citizen_notes = response;
                state.citizen_notes_map_id = mapId;
                resolve(state.citizen_notes);
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}

/** @param mapId Identifiant public de la ville (`data-town-id`), pas l'IdTown interne */
export function upsertCitizenNote(userId: number, mapId: number, note: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        putNote(state.api_url + '/Note/citizen/' + userId + '?townId=' + mapId, note)
            .then(() => {
                state.citizen_notes = withLocalNote(state.citizen_notes, userId, note);
                state.citizen_notes_map_id = mapId;
                resolve();
            })
            .catch((error) => {
                addError(error);
                reject(error);
            });
    });
}
