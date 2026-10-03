import { describe, expect, it, vi } from 'vitest';

import { texts } from '../i18n/texts';
import type { I18nLabel } from '../types';
import { getI18N } from '../utils/i18n';
import { formatCampingResult } from './camping';

/**
 * `texts.ts` appelle `getScriptInfo()` au chargement du module : en jsdom (Vitest),
 * `GM_info`/`browser`/`chrome` n'existent pas (cf. camping-predict.spec.ts).
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

const LABEL: I18nLabel = { en: 'Label', fr: 'Libellé', de: 'Label', es: 'Etiqueta' };

describe('formatCampingResult', () => {
    it('shows only the real chance when neither the cap nor the floor changed it', () => {
        expect(formatCampingResult({ probability: 42, boundedProbability: 42, label: LABEL }))
            .toBe(`${getI18N(LABEL)} - 42%`);
    });

    it('adds the raw chance when the cap lowered it', () => {
        expect(formatCampingResult({ probability: 130, boundedProbability: 90, label: LABEL }))
            .toBe(`${getI18N(LABEL)} - 90% (${getI18N(texts.camping_raw_probability)} 130%)`);
    });

    it('adds the raw chance when the floor raised it', () => {
        expect(formatCampingResult({ probability: -80, boundedProbability: 0, label: LABEL }))
            .toBe(`${getI18N(LABEL)} - 0% (${getI18N(texts.camping_raw_probability)} -80%)`);
    });
});
