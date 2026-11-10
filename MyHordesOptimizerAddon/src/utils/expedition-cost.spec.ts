import { describe, expect, it, vi } from 'vitest';

import type { ApiExpeditionCitizen, ApiExpeditionOrder, ApiExpeditionPart } from '../types';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

type CostModule = typeof import('./expedition-cost');

/** Module rechargé en français (`lang` est lu au chargement). */
async function frenchModule(): Promise<CostModule> {
    document.documentElement.lang = 'fr';
    vi.resetModules();
    return import('./expedition-cost');
}

function explore(): ApiExpeditionOrder {
    return { kind: 'explore', type: 'checkbox', isDone: false, position: 0 } as ApiExpeditionOrder;
}

/** Partie avec ses consignes générales, puis une liste de consignes par place. */
function part(part_orders: ApiExpeditionOrder[], ...citizen_orders: ApiExpeditionOrder[][]): ApiExpeditionPart {
    return { orders: part_orders, citizens: citizen_orders.map((orders: ApiExpeditionOrder[]): ApiExpeditionCitizen => ({ orders })) };
}

describe('expedition-cost', (): void => {
    it('partRuinAp : le plus de visites d\'une place, une visite pour n\'importe qui comptant pour chacune', async (): Promise<void> => {
        const { partRuinAp }: CostModule = await frenchModule();

        expect(partRuinAp(part([], [], []))).toBe(0);
        expect(partRuinAp(part([], [explore()], []))).toBe(1);
        expect(partRuinAp(part([], [explore()], [explore()]))).toBe(1);
        expect(partRuinAp(part([explore()], [explore()], []))).toBe(2);
        expect(partRuinAp({})).toBe(0);
    });

    it('partApLabel : le coût total, détaillé quand des ruines sont visitées', async (): Promise<void> => {
        const { partApLabel }: CostModule = await frenchModule();

        expect(partApLabel(10, 0)).toBe('10 PA');
        expect(partApLabel(10, 1)).toBe('11 PA (10 + 1)');
    });
});
