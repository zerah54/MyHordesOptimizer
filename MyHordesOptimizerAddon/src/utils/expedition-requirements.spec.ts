import { describe, expect, it } from 'vitest';

import type { ApiExpeditionCitizen } from '../types';
import { requirementCells } from './expedition-requirements';

describe('requirementCells', () => {
    it('affiche « au plus » pour l\'opérateur max', () => {
        const place: ApiExpeditionCitizen = { nombrePeDepart: 2, nombrePeDepartOperator: 'max' };
        expect(requirementCells(place).sp).toBe('≤ 2');
    });

    it('affiche « exactement » pour l\'opérateur exact', () => {
        const place: ApiExpeditionCitizen = { nombrePeDepart: 2, nombrePeDepartOperator: 'exact' };
        expect(requirementCells(place).sp).toBe('= 2');
    });

    it('affiche « au moins » pour l\'opérateur min', () => {
        const place: ApiExpeditionCitizen = { nombrePeDepart: 2, nombrePeDepartOperator: 'min' };
        expect(requirementCells(place).sp).toBe('≥ 2');
    });

    it('affiche « au moins » quand l\'opérateur est absent, null ou inconnu', () => {
        expect(requirementCells({ nombrePeDepart: 2 }).sp).toBe('≥ 2');
        expect(requirementCells({ nombrePeDepart: 2, nombrePeDepartOperator: null }).sp).toBe('≥ 2');
        const unknown: ApiExpeditionCitizen = { nombrePeDepart: 2, nombrePeDepartOperator: 'foo' as unknown as 'min' };
        expect(requirementCells(unknown).sp).toBe('≥ 2');
    });

    it('affiche 0 comme une exigence', () => {
        expect(requirementCells({ nombrePeDepart: 0, nombrePeDepartOperator: 'exact' }).sp).toBe('= 0');
    });

    it('reste vide sans exigence de PE', () => {
        expect(requirementCells({}).sp).toBe('');
        expect(requirementCells({ nombrePeDepart: null, nombrePeDepartOperator: 'max' }).sp).toBe('');
    });

    it('marque les chaussures exigées, interdites ou indifférentes', () => {
        expect(requirementCells({ isPreinscritChaussures: true }).shoes).toBe('✓');
        expect(requirementCells({ isPreinscritChaussures: false }).shoes).toBe('✗');
        expect(requirementCells({ isPreinscritChaussures: null }).shoes).toBe('');
        expect(requirementCells({}).shoes).toBe('');
    });
});
