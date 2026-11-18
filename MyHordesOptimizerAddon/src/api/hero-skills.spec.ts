import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { flushPendingHeroSkills } from './hero-skills';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/storage', () => ({ getStorageItem: vi.fn(), setStorageItem: vi.fn() }));
vi.mock('../utils/misc', () => ({ isValidToken: () => true }));
vi.mock('./token', () => ({ getToken: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;
const getStorageMock = getStorageItem as unknown as ReturnType<typeof vi.fn>;
const setStorageMock = setStorageItem as unknown as ReturnType<typeof vi.fn>;

const levels = { S: 1, U: 2, P: 0, E: 4, R: 1 };

beforeEach(() => {
    vi.clearAllMocks();
    state.api_url = 'https://api.test';
    state.mh_user = { id: 7, townDetails: { townId: 42 } } as unknown as typeof state.mh_user;
    getStorageMock.mockResolvedValue({ townId: 42, levels });
});

describe('flushPendingHeroSkills', () => {
    it('envoie les niveaux en attente dans leur ville puis les oublie', async () => {
        fetcherMock.mockResolvedValue({ status: 204 });

        await expect(flushPendingHeroSkills()).resolves.toBe(true);

        expect(fetcherMock.mock.calls[0][0]).toBe('https://api.test/town/42/user/7/heroSkills');
        expect(JSON.parse(fetcherMock.mock.calls[0][1].body)).toEqual(levels);
        expect(setStorageMock).toHaveBeenCalledWith(expect.any(String), null);
    });

    it('garde les niveaux tant que le joueur n\'est pas dans leur ville', async () => {
        state.mh_user = { id: 7, townDetails: { townId: 1 } } as unknown as typeof state.mh_user;

        await expect(flushPendingHeroSkills()).resolves.toBe(false);

        expect(fetcherMock).not.toHaveBeenCalled();
        expect(setStorageMock).not.toHaveBeenCalled();
    });

    it('garde les niveaux si l\'API refuse', async () => {
        fetcherMock.mockResolvedValue({ status: 500, text: () => Promise.resolve('boom') });

        await expect(flushPendingHeroSkills()).resolves.toBe(false);

        expect(setStorageMock).not.toHaveBeenCalled();
    });
});
