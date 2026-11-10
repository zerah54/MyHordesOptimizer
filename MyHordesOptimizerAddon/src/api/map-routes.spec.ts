import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { loadRoutesWithoutExpedition } from './map-routes';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
/** `getScriptInfo()` est appelée au chargement de modules importés ; jsdom n'a ni `GM_info` ni `browser`/`chrome`. */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

function route(id: number, linked_parts: unknown[] | null | undefined): Record<string, unknown> {
    return { id, label: `Tracé ${id}`, color: 'teal', cells: [], length: 0, version: 1, linkedParts: linked_parts };
}

describe('loadRoutesWithoutExpedition', (): void => {
    beforeEach((): void => {
        fetcherMock.mockReset();
        state.api_url = 'https://api.test';
        state.mh_user = { id: 42, townDetails: { townId: 7, day: 5 } } as unknown as typeof state.mh_user;
    });

    it('garde les tracés de la ville liés à aucune partie, quel que soit le jour', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, {
            access: { isCitizen: true },
            routes: [route(1, []), route(2, [{ partId: 12, day: 3 }]), route(3, null), route(4, undefined)],
            gameRoutes: []
        }));

        const ids: number[] = (await loadRoutesWithoutExpedition()).map((candidate: { id: number }): number => candidate.id);

        expect(ids).toEqual([1, 3, 4]);
        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/MapRoutes/7', expect.anything(), { wait_for_token: true });
    });

    it('sans ville connue : aucun appel', async (): Promise<void> => {
        state.mh_user = { id: 42 } as unknown as typeof state.mh_user;

        expect(await loadRoutesWithoutExpedition()).toEqual([]);
        expect(fetcherMock).not.toHaveBeenCalled();
    });

    it('réponse sans tracés (simple observateur) : aucun', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { access: { isCitizen: false } }));

        expect(await loadRoutesWithoutExpedition()).toEqual([]);
    });

    it('échec de l\'appel : rejet, à l\'appelant de décider', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(500, {}));

        await expect(loadRoutesWithoutExpedition()).rejects.toThrow();
    });
});
