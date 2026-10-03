import { describe, expect, it } from 'vitest';

import { params_categories } from '../data/params';
import type { ParamCategory } from '../types';
import { collectParamIds, purgeUnknownParameters } from './params-purge';

describe('collectParamIds()', () => {
    it('collecte les options à toute profondeur', () => {
        const categories: ParamCategory[] = [{
            id: 'category',
            label: { en: '', fr: '', de: '', es: '' },
            params: [{ id: 'parent', children: [{ id: 'child', children: [{ id: 'grandchild' }] }] }, { id: 'sibling' }]
        }];

        expect([...collectParamIds(categories)].sort()).toEqual(['child', 'grandchild', 'parent', 'sibling']);
    });

    it('ne contient pas les options commentées dans params.ts', () => {
        const ids: Set<string> = collectParamIds(params_categories);

        expect(ids.has('update_mho')).toBe(true);
        expect(ids.has('refresh_mho_after_update')).toBe(true);
        expect(ids.has('display_map')).toBe(false);
        expect(ids.has('update_mho_souls')).toBe(false);
    });
});

describe('purgeUnknownParameters()', () => {
    const known_ids: ReadonlySet<string> = new Set<string>(['a', 'b']);

    it('garde les options déclarées, quelle que soit leur valeur', () => {
        expect(purgeUnknownParameters({ a: true, b: false }, known_ids)).toEqual({ parameters: { a: true, b: false }, removed: [] });
    });

    it('retire les options inconnues et les liste', () => {
        expect(purgeUnknownParameters({ a: true, old: true, older: false }, known_ids)).toEqual({ parameters: { a: true }, removed: ['old', 'older'] });
    });

    it('renvoie des paramètres vides pour une valeur absente ou invalide, sans rien à écrire', () => {
        expect(purgeUnknownParameters(undefined, known_ids)).toEqual({ parameters: {}, removed: [] });
        expect(purgeUnknownParameters('corrompu', known_ids)).toEqual({ parameters: {}, removed: [] });
        expect(purgeUnknownParameters([true], known_ids)).toEqual({ parameters: {}, removed: [] });
    });
});
