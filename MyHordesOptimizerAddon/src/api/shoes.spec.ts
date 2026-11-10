import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addError } from '../utils/notifications';
import { saveShoesEquipped } from './shoes';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;
const addErrorMock = addError as unknown as ReturnType<typeof vi.fn>;

/** Réponse 204 de l'API, sans corps. */
function noContentResponse(): Response {
    return { status: 204, text: () => Promise.resolve('') } as unknown as Response;
}

/** Réponse d'erreur de l'API avec le statut donné. */
function errorResponse(status: number): Response {
    return { status, text: () => Promise.resolve('boom') } as unknown as Response;
}

beforeEach(() => {
    fetcherMock.mockReset();
    addErrorMock.mockReset();
    state.api_url = 'https://api.test';
    state.mh_user = { id: 7, townDetails: { townId: 42 } } as unknown as typeof state.mh_user;
});

describe('saveShoesEquipped', () => {
    it('ne fait rien sans conclusion de la détection', () => {
        expect(saveShoesEquipped(undefined)).toBeUndefined();
        expect(fetcherMock).not.toHaveBeenCalled();
    });

    it('ne fait rien sans ville connue', () => {
        state.mh_user = { id: 7 } as unknown as typeof state.mh_user;

        expect(saveShoesEquipped(true)).toBeUndefined();
        expect(fetcherMock).not.toHaveBeenCalled();
    });

    it('envoie les chaussures équipées en POST vers la ville et le joueur courants', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await saveShoesEquipped(true);

        expect(fetcherMock).toHaveBeenCalledTimes(1);
        const url: string = fetcherMock.mock.calls[0][0];
        const options: RequestInit = fetcherMock.mock.calls[0][1];
        expect(url).toBe('https://api.test/town/42/user/7/shoesEquipped');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({ shoesEquipped: true });
        expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('envoie aussi l\'absence de chaussures équipées', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await saveShoesEquipped(false);

        expect(JSON.parse(fetcherMock.mock.calls[0][1].body)).toEqual({ shoesEquipped: false });
    });

    it('accepte une réponse sans contenu (204) sans signaler d\'erreur', async () => {
        fetcherMock.mockResolvedValue(noContentResponse());

        await expect(saveShoesEquipped(true)).resolves.toBeUndefined();
        expect(addErrorMock).not.toHaveBeenCalled();
    });

    it('signale l\'erreur et rejette sur une réponse en échec', async () => {
        fetcherMock.mockResolvedValue(errorResponse(500));

        await expect(saveShoesEquipped(true)).rejects.toThrow();
        expect(addErrorMock).toHaveBeenCalledTimes(1);
    });

    it('signale l\'erreur et rejette sur une coupure réseau', async () => {
        fetcherMock.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(saveShoesEquipped(false)).rejects.toThrow('Failed to fetch');
        expect(addErrorMock).toHaveBeenCalledTimes(1);
    });
});
