import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mho_camping_predict_id } from '../config/constants';
import { state } from '../state';
import type { ApiMhUser } from '../types';
import { displayCampingPredict } from './camping-predict';

/**
 * `texts.ts` appelle `getScriptInfo()` au chargement du module : en jsdom (Vitest),
 * `GM_info`/`browser`/`chrome` n'existent pas, ce qui fait planter l'import avant même
 * le début des tests (cf. cell-details.spec.ts).
 */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock: not used by this spec')),
    getErrorFromApi: (error: unknown): unknown => error,
    isScriptVersionLastVersion: (): boolean => true,
    isNewVersion: (): boolean => false,
    toggleNewChangelog: (): undefined => undefined,
    toggleNewVersion: (): undefined => undefined,
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' }),
    getChangelog: (): string => ''
}));

/** `pageIsDesert()` lit `document.URL` : mocké pour ne pas dépendre de l'URL jsdom par défaut */
vi.mock('../utils/page', () => ({
    pageIsDesert: (): boolean => true
}));

function buildZoneCampDom(): void {
    document.body.innerHTML = '<div class="zone-camp"><div class="zone-camp-info"></div><label></label></div>';
}

describe('displayCampingPredict', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        state.mho_parameters = { display_camping_predict: true };
        state.ruins = [];
    });

    it('ne plante pas et ne construit rien tant que state.mh_user n\'a pas résolu (options "sans connexion" rejouées avant le premier getToken())', async () => {
        state.mh_user = undefined;
        buildZoneCampDom();

        expect(() => displayCampingPredict()).not.toThrow();
        await Promise.resolve();
        await Promise.resolve();

        expect(document.getElementById(mho_camping_predict_id)).toBeNull();
    });

    it('construit le calculateur une fois state.mh_user disponible, au rejeu suivant', async () => {
        state.mh_user = undefined;
        buildZoneCampDom();
        displayCampingPredict();
        await Promise.resolve();
        await Promise.resolve();

        state.mh_user = { townDetails: { townType: 'classic', isDevaste: false }, jobDetails: { uid: 'none' } } as ApiMhUser;
        displayCampingPredict();
        await Promise.resolve();
        await Promise.resolve();

        expect(document.getElementById(mho_camping_predict_id)).not.toBeNull();
    });
});
