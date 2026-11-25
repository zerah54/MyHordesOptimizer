import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { state } from '../state';
import type { MhoState } from '../types';
import { fetcher } from '../utils/fetch';
import { fetchCitizenHomeRows, fetchTownCitizenRefs, getCitizens, readTownCitizenRefs } from './citizens';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));

describe('readTownCitizenRefs', () => {
    it('garde l\'identifiant, le pseudo et le métier des citoyens de Fetcher/citizens', () => {
        const body: unknown = {
            lastUpdateInfo: null,
            citizens: [
                { id: 12, name: 'Parti', jobUid: 'dig', dead: false },
                { id: 13, name: 'Sans métier', jobUid: null },
                { id: '14', name: 'Identifiant texte' },
                { name: 'Sans identifiant' },
                null
            ]
        };

        expect(readTownCitizenRefs(body)).toEqual([
            { id: 12, name: 'Parti', job: 'dig' },
            { id: 13, name: 'Sans métier', job: null }
        ]);
    });

    it('rend une liste vide pour une réponse inattendue', () => {
        expect(readTownCitizenRefs(null)).toEqual([]);
        expect(readTownCitizenRefs({ citizens: {} })).toEqual([]);
    });
});

describe('fetchCitizenHomeRows', () => {
    let saved: Pick<MhoState, 'api_url' | 'mh_user' | 'citizens'>;

    beforeEach(() => {
        saved = { api_url: state.api_url, mh_user: state.mh_user, citizens: state.citizens };
        state.api_url = 'https://api';
        state.mh_user = { id: 1, townDetails: { townId: 2 } };
        (fetcher as unknown as Mock).mockReset();
    });

    afterEach(() => {
        Object.assign(state, saved);
    });

    it('renvoie les lignes lues sans toucher à state.citizens', async () => {
        const body: unknown = { citizens: [{ id: 12, name: 'Parti', home: { content: { houseLevel: 3 } } }] };
        (fetcher as unknown as Mock).mockResolvedValue({ status: 200, json: (): Promise<unknown> => Promise.resolve(body) });

        const rows = await fetchCitizenHomeRows();

        expect(fetcher).toHaveBeenCalledWith('https://api/Fetcher/citizens?userId=1&townId=2');
        expect(rows).toHaveLength(1);
        expect(rows[0].name).toBe('Parti');
        expect(rows[0].home['houseLevel']).toBe(3);
        expect(state.citizens).toBe(saved.citizens);
    });

    it('rejette sur un statut différent de 200', async () => {
        (fetcher as unknown as Mock).mockResolvedValue({ status: 500, text: (): Promise<string> => Promise.resolve('boom'), json: (): Promise<unknown> => Promise.resolve({}) });

        await expect(fetchCitizenHomeRows()).rejects.toBeDefined();
    });
});

describe('fetchTownCitizenRefs', () => {
    let saved: Pick<MhoState, 'api_url' | 'mh_user'>;

    beforeEach(() => {
        saved = { api_url: state.api_url, mh_user: state.mh_user };
        state.api_url = 'https://api';
        state.mh_user = { id: 1, townDetails: { townId: 2 } };
        (fetcher as unknown as Mock).mockReset();
        (fetcher as unknown as Mock).mockResolvedValue({ status: 200, json: (): Promise<unknown> => Promise.resolve({ citizens: [] }) });
    });

    afterEach(() => {
        Object.assign(state, saved);
    });

    it('attend le jeton : appelée pendant la mise à jour, qui peut tomber sur un renouvellement', async () => {
        await fetchTownCitizenRefs();

        expect(fetcher).toHaveBeenCalledWith('https://api/Fetcher/citizens?userId=1&townId=2', undefined, { wait_for_token: true });
    });
});

describe('getCitizens', () => {
    let saved: Pick<MhoState, 'api_url' | 'mh_user' | 'citizens'>;

    beforeEach(() => {
        saved = { api_url: state.api_url, mh_user: state.mh_user, citizens: state.citizens };
        state.api_url = 'https://api';
        state.mh_user = { id: 1, townDetails: { townId: 2 } };
        (fetcher as unknown as Mock).mockReset();
        (fetcher as unknown as Mock).mockResolvedValue({ status: 200, json: (): Promise<unknown> => Promise.resolve({ citizens: {} }) });
    });

    afterEach(() => {
        Object.assign(state, saved);
    });

    it('lecture fraîche : passe cache no-store à fetcher', async () => {
        await getCitizens(true);

        expect(fetcher).toHaveBeenCalledWith('https://api/Fetcher/citizens?userId=1&townId=2', { cache: 'no-store' });
    });

    it('sans argument : aucune option, cache HTTP du navigateur conservé', async () => {
        await getCitizens();

        const calls: unknown[][] = (fetcher as unknown as Mock).mock.calls;
        expect(calls).toHaveLength(1);
        expect(calls[0][0]).toBe('https://api/Fetcher/citizens?userId=1&townId=2');
        expect(calls[0][1]).toBeUndefined();
    });
});
