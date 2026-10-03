import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getRefinedAttack } from './estimations';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
/** `getScriptInfo()` est appelée au chargement de modules importés ; jsdom n'a ni `GM_info` ni `browser`/`chrome`. */
vi.mock('../utils/version', async (importOriginal: () => Promise<object>) => ({
    ...await importOriginal(),
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MHO', version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('getRefinedAttack', () => {
    beforeEach(() => {
        fetcherMock.mockReset();
        state.api_url = 'https://api.test';
        state.mh_user = { townDetails: { townId: 42 } } as unknown as typeof state.mh_user;
    });

    it('renvoie la plage d\'un affinage valide', async () => {
        fetcherMock.mockResolvedValue(jsonResponse(200, { status: 'Valid', attackMin: 3736, attackMax: 3757 }));

        expect(await getRefinedAttack(16)).toEqual({ min: 3736, max: 3757 });
        expect(fetcherMock.mock.calls[0][0]).toBe('https://api.test/AttaqueEstimation/Refinement/16?townId=42');
    });

    it('renvoie null sans affinage, s\'il est à relancer ou si l\'appel échoue', async () => {
        fetcherMock.mockResolvedValueOnce(jsonResponse(200, { status: 'None', attackMin: null, attackMax: null }));
        expect(await getRefinedAttack(16)).toBeNull();
        fetcherMock.mockResolvedValueOnce(jsonResponse(200, { status: 'Invalid', attackMin: 3736, attackMax: 3757 }));
        expect(await getRefinedAttack(16)).toBeNull();
        fetcherMock.mockRejectedValueOnce(new Error('réseau'));
        expect(await getRefinedAttack(16)).toBeNull();
    });
});
