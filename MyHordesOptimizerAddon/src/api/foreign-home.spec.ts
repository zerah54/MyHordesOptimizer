import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { saveCitizenHome } from './foreign-home';
import { getToken } from './token';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('./token', () => ({ getToken: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));
vi.mock('../utils/version', () => ({ convertResponsePromiseToError: vi.fn() }));

const fetcherMock: Mock = fetcher as unknown as Mock;
const getTokenMock: Mock = getToken as unknown as Mock;

describe('saveCitizenHome', (): void => {
    beforeEach((): void => {
        state.api_url = 'https://api';
        state.mh_user = undefined;
        fetcherMock.mockReset().mockResolvedValue({ status: 200 });
        getTokenMock.mockReset();
    });

    it('attend l\'authentification quand mh_user n\'est pas encore résolu', async (): Promise<void> => {
        getTokenMock.mockImplementation(async (): Promise<void> => {
            state.mh_user = { id: 1, townDetails: { townId: 42 } } as typeof state.mh_user;
        });
        await saveCitizenHome(321, {} as never);
        expect(fetcherMock.mock.calls[0][0]).toBe('https://api/ExternalTools/Home?townId=42');
    });

    it('rejette sans appeler l\'API quand la ville reste inconnue', async (): Promise<void> => {
        await expect(saveCitizenHome(321, {} as never)).rejects.toThrow();
        expect(fetcherMock).not.toHaveBeenCalled();
    });
});
