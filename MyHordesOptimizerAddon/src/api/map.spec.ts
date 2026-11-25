import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getMap } from './map';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('getMap : déduplication en vol', (): void => {
    beforeEach((): void => {
        fetcherMock.mockReset();
        state.api_url = 'https://api.test';
        state.mh_user = { id: 1, townDetails: { townId: 7, day: 1 } } as unknown as typeof state.mh_user;
    });

    it('deux appels simultanés partagent une seule requête et le même résultat', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { cells: [1] }));

        const [first, second]: unknown[] = await Promise.all([getMap(), getMap()]);

        expect(fetcherMock).toHaveBeenCalledTimes(1);
        expect(first).toEqual({ cells: [1] });
        expect(second).toBe(first);
    });

    it('un appel après la résolution refait la requête (pas de cache)', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { cells: [] }));

        await getMap();
        await getMap();

        expect(fetcherMock).toHaveBeenCalledTimes(2);
    });

    it('un rejet libère la promesse en vol : l\'appel suivant refait la requête', async (): Promise<void> => {
        fetcherMock.mockRejectedValueOnce(new Error('boom'));
        await expect(getMap()).rejects.toThrow('boom');

        fetcherMock.mockResolvedValue(jsonResponse(200, { cells: [2] }));
        await expect(getMap()).resolves.toEqual({ cells: [2] });
        expect(fetcherMock).toHaveBeenCalledTimes(2);
    });
});
