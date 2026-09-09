import { describe, expect, it } from 'vitest';

import type { Lang } from '../types';
import { getChangelogTable } from './changelogs';

describe('getChangelogTable', () => {
    const tables: Record<Lang, Record<string, string>> = {
        fr: { '1.0.0': 'fr-1.0.0', '1.1.0': 'fr-1.1.0' },
        en: { '1.1.0': 'en-1.1.0' },
        de: {},
        es: {},
    };

    it('returns the french table as-is when the language is french', () => {
        expect(getChangelogTable('fr', tables)).toEqual(tables.fr);
    });

    it('uses the requested language entry when it exists', () => {
        expect(getChangelogTable('en', tables)['1.1.0']).toBe('en-1.1.0');
    });

    it('falls back to the french entry when the version is missing in the requested language', () => {
        expect(getChangelogTable('en', tables)['1.0.0']).toBe('fr-1.0.0');
    });

    it('falls back entirely to french when the language has no translation at all', () => {
        expect(getChangelogTable('de', tables)).toEqual(tables.fr);
    });
});
