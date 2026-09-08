import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { getStorageItem } from '../utils/storage';
import { bootstrap } from './bootstrap';
import { gm_mh_external_app_id_key, mho_parameters_key, mho_token_key } from './constants';

vi.mock('../utils/storage', () => ({ getStorageItem: vi.fn() }));

const getStorageItemMock = getStorageItem as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
    getStorageItemMock.mockReset();
    state.mho_parameters = undefined;
    state.mh_user = undefined;
    state.external_app_id = undefined;
    state.token = undefined;
});

describe('bootstrap()', () => {
    /**
     * `mh_user` (identité + ville) est une donnée de jeu, pas un credential : le website
     * a supprimé sa persistance (getUser()/getTown() en mémoire pure, remis à zéro à chaque
     * rechargement). `bootstrap()` ne doit donc plus la restaurer depuis le stockage — elle
     * ne doit être peuplée que par un `getToken()` frais, après résolution.
     */
    it('ne restaure pas mh_user depuis le stockage, même si une valeur y est encore persistée (résidu d\'une version antérieure)', async () => {
        const persisted_user = { id: 42, townDetails: { townId: 7, day: 3 } };
        getStorageItemMock.mockImplementation((key: string) => {
            if (key === mho_parameters_key) return Promise.resolve({});
            if (key === mho_token_key) return Promise.resolve(undefined);
            if (key === gm_mh_external_app_id_key) return Promise.resolve(undefined);
            return Promise.resolve(persisted_user);
        });

        await bootstrap();

        expect(state.mh_user).toBeUndefined();
    });

    it('restaure toujours les paramètres, le token (credential) et la clé d\'app depuis le stockage', async () => {
        const params = { display_map: true };
        const token = { token: { accessToken: 'abc', validTo: new Date().toISOString() }, simpleMe: { id: 1 } };
        getStorageItemMock.mockImplementation((key: string) => {
            if (key === mho_parameters_key) return Promise.resolve(params);
            if (key === mho_token_key) return Promise.resolve(token);
            if (key === gm_mh_external_app_id_key) return Promise.resolve('app-id');
            return Promise.resolve(undefined);
        });

        await bootstrap();

        expect(state.mho_parameters).toEqual(params);
        expect(state.token).toEqual(token);
        expect(state.external_app_id).toBe('app-id');
    });
});
