import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { getMyCitizenNotes, getMyTownNotes, getMyUserNotes, upsertCitizenNote, upsertTownNote, upsertUserNote } from './notes';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;
const addErrorMock = addError as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) } as unknown as Response;
}

function noContentResponse(): Response {
    return { status: 204, json: () => Promise.reject(new Error('no body')), text: () => Promise.resolve('') } as unknown as Response;
}

function errorResponse(status: number): Response {
    return { status, text: () => Promise.resolve('boom') } as unknown as Response;
}

beforeEach(() => {
    fetcherMock.mockReset();
    addErrorMock.mockReset();
    state.api_url = 'https://api.test';
    state.town_notes = undefined;
    state.user_notes = undefined;
    state.citizen_notes = undefined;
    state.citizen_notes_map_id = undefined;
});

describe('getMyTownNotes', () => {
    it('fetches /Note/town/mine and caches the result in state', async () => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { 12: { note: 'ville sympa' } }));

        const result = await getMyTownNotes();

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/town/mine');
        expect(result).toEqual({ 12: { note: 'ville sympa' } });
        expect(state.town_notes).toEqual({ 12: { note: 'ville sympa' } });
    });

    it('reports the error and rejects on failure, without touching state', async () => {
        fetcherMock.mockResolvedValue(errorResponse(500));

        await expect(getMyTownNotes()).rejects.toThrow();

        expect(addErrorMock).toHaveBeenCalledTimes(1);
        expect(state.town_notes).toBeUndefined();
    });
});

describe('upsertTownNote', () => {
    it('PUTs the note and stores it locally under the mapId', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await upsertTownNote(12, 'ville sympa');

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/town/12', {
            method: 'PUT',
            body: JSON.stringify({ note: 'ville sympa' }),
            headers: { 'Content-Type': 'application/json' }
        });
        expect(state.town_notes?.[12]?.note).toBe('ville sympa');
    });

    it('clears the local entry when the note is blank (mirrors the backend delete-on-blank)', async () => {
        state.town_notes = { 12: { note: 'ancienne note' } };
        fetcherMock.mockResolvedValue(noContentResponse());

        await upsertTownNote(12, '   ');

        expect(state.town_notes?.[12]).toBeUndefined();
    });

    it('reports the error and rejects on failure, without touching state', async () => {
        state.town_notes = { 12: { note: 'ancienne note' } };
        fetcherMock.mockResolvedValue(errorResponse(500));

        await expect(upsertTownNote(12, 'nouvelle note')).rejects.toThrow();

        expect(addErrorMock).toHaveBeenCalledTimes(1);
        expect(state.town_notes[12].note).toBe('ancienne note');
    });
});

describe('getMyUserNotes', () => {
    it('fetches /Note/user/mine and caches the result in state', async () => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { 7: { note: 'payeur fiable' } }));

        const result = await getMyUserNotes();

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/user/mine');
        expect(result).toEqual({ 7: { note: 'payeur fiable' } });
        expect(state.user_notes).toEqual({ 7: { note: 'payeur fiable' } });
    });
});

describe('upsertUserNote', () => {
    it('PUTs the note and stores it locally under the userId', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await upsertUserNote(7, 'payeur fiable');

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/user/7', {
            method: 'PUT',
            body: JSON.stringify({ note: 'payeur fiable' }),
            headers: { 'Content-Type': 'application/json' }
        });
        expect(state.user_notes?.[7]?.note).toBe('payeur fiable');
    });
});

describe('getMyCitizenNotes', () => {
    it('fetches /Note/citizen/mine for the given mapId and caches the result under that mapId', async () => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { 7: { note: 'a ouvert les portes' } }));

        const result = await getMyCitizenNotes(12);

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/citizen/mine?townId=12');
        expect(result).toEqual({ 7: { note: 'a ouvert les portes' } });
        expect(state.citizen_notes).toEqual({ 7: { note: 'a ouvert les portes' } });
        expect(state.citizen_notes_map_id).toBe(12);
    });
});

describe('upsertCitizenNote', () => {
    it('PUTs the note and stores it locally under the userId, tagging the mapId it belongs to', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await upsertCitizenNote(7, 12, 'a ouvert les portes');

        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Note/citizen/7?townId=12', {
            method: 'PUT',
            body: JSON.stringify({ note: 'a ouvert les portes' }),
            headers: { 'Content-Type': 'application/json' }
        });
        expect(state.citizen_notes?.[7]?.note).toBe('a ouvert les portes');
        expect(state.citizen_notes_map_id).toBe(12);
    });
});
