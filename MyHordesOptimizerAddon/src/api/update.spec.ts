import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mho_token_key } from '../config/constants';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { setStorageItem } from '../utils/storage';
import { updateExternalTools } from './update';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn(), normalizeString: (value: string): string => value }));
vi.mock('../utils/storage', () => ({ setStorageItem: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./wishlist', () => ({ getWishlist: vi.fn() }));
vi.mock('./map', () => ({ getMap: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;
const setStorageItemMock = setStorageItem as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

beforeEach(() => {
    fetcherMock.mockReset();
    setStorageItemMock.mockReset();
    setStorageItemMock.mockResolvedValue(undefined);
    document.body.innerHTML = '';
    state.api_url = 'https://api.test';
    state.external_app_id = 'app-id';
    state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'none' } } as any;
    state.mho_parameters = {} as any;
    state.token = undefined;
});

describe('updateExternalTools', () => {
    it('range le token renouvelé reçu du job dans state et le persiste', async () => {
        const renewed_token = { token: { accessToken: 'renewed-jwt', validTo: new Date(Date.now() + 3600000).toISOString() }, simpleMe: { id: 1, townDetails: { townId: 42 } } };
        fetcherMock.mockResolvedValue(jsonResponse(200, {
            jobId: 'job-1', isRunning: false, tools: [], renewedToken: renewed_token
        }));

        await updateExternalTools();

        expect(state.token).toEqual(renewed_token);
        // `mh_user` (donnée de jeu) reste à jour en mémoire, mais n'est plus persisté (cf. bootstrap.ts)
        expect(state.mh_user).toEqual(renewed_token.simpleMe);
        expect(setStorageItemMock).not.toHaveBeenCalledWith(expect.stringContaining('mh_user'), expect.anything());
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_token_key, renewed_token);
    });

    it('range le token renouvelé reçu pendant le polling (pas seulement à la réponse initiale)', async () => {
        const renewed_token = { token: { accessToken: 'renewed-jwt-2', validTo: new Date(Date.now() + 3600000).toISOString() }, simpleMe: { id: 1, townDetails: { townId: 43 } } };
        fetcherMock
            .mockResolvedValueOnce(jsonResponse(200, { jobId: 'job-1', isRunning: true, tools: [] }))
            .mockResolvedValueOnce(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [], renewedToken: renewed_token }));

        await updateExternalTools();

        expect(state.token).toEqual(renewed_token);
        expect(state.mh_user).toEqual(renewed_token.simpleMe);
        expect(setStorageItemMock).not.toHaveBeenCalledWith(expect.stringContaining('mh_user'), expect.anything());
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_token_key, renewed_token);
    });

    /**
     * C1 (revue finale du chantier cycle de vie de session) : ExternalTools/Update/Start refuse
     * (403) tout appel sans Bearer valide. L'attente d'un jeton frais quand isValidToken() est faux
     * n'est plus un patch local à update.ts : elle est centralisée dans fetcher()/
     * updateFetchRequestOptions() (src/utils/fetch.ts, cf. fetch.spec.ts) pour couvrir tous les
     * appelants, pas seulement Update/Start. fetcher() étant mocké ici, ce comportement n'est plus
     * observable depuis ce fichier.
     */
});
