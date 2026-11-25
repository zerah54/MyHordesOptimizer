import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getRuins } from './ruins';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));
vi.mock('../utils/i18n', () => ({ getI18N: (label: unknown): string => String(label) }));
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

function ruinsBody(): unknown[] {
    return [{ label: 'b', drops: [] }, { label: 'a', drops: [] }];
}

describe('getRuins : déduplication en vol', (): void => {
    beforeEach((): void => {
        fetcherMock.mockReset();
        state.api_url = 'https://api.test';
        state.external_app_id = 'app-id';
        state.ruins = undefined;
    });

    it('deux appels simultanés partagent une seule requête et le même résultat', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, ruinsBody()));

        const [first, second]: unknown[] = await Promise.all([getRuins(), getRuins()]);

        expect(fetcherMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('conserve le cache state.ruins après résolution', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, ruinsBody()));

        await getRuins();
        await getRuins();

        expect(fetcherMock).toHaveBeenCalledTimes(1);
    });

    it('un rejet libère la promesse en vol : l\'appel suivant refait la requête', async (): Promise<void> => {
        fetcherMock.mockRejectedValueOnce(new Error('boom'));
        await expect(getRuins()).rejects.toThrow('boom');

        fetcherMock.mockResolvedValue(jsonResponse(200, ruinsBody()));
        await getRuins();
        expect(fetcherMock).toHaveBeenCalledTimes(2);
    });
});
