import { describe, expect, it, vi } from 'vitest';

import { readTownCitizenRefs } from './citizens';

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
