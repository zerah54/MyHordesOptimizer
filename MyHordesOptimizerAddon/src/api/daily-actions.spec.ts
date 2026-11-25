import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { saveDailyAction } from './daily-actions';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

describe('saveDailyAction', (): void => {
    beforeEach((): void => {
        fetcherMock.mockReset();
        fetcherMock.mockResolvedValue({ status: 200, json: (): Promise<object> => Promise.resolve({}) } as unknown as Response);
        state.api_url = 'https://api.test';
        state.mh_user = { id: 42, townDetails: { townId: 7, day: 5 } } as unknown as typeof state.mh_user;
    });

    it('attend le jeton pour chacun des envois simultanés', async (): Promise<void> => {
        await Promise.all(Array.from({ length: 9 }, (_: unknown, i: number): Promise<void> => saveDailyAction(`a${i}`, true)));

        expect(fetcherMock).toHaveBeenCalledTimes(9);
        fetcherMock.mock.calls.forEach((call: unknown[]): void => {
            expect(call[2]).toEqual({ wait_for_token: true });
        });
    });
});
