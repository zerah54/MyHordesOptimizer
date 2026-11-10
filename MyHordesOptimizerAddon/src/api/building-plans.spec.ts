import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetcher } from '../utils/fetch';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
/** `getScriptInfo()` est appelée au chargement de modules importés ; jsdom n'a ni `GM_info` ni `browser`/`chrome`. */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
const fetcherMock: ReturnType<typeof vi.fn> = fetcher as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('building-plans', (): void => {
    /** Charge un module neuf (cache de référentiel vierge) avec son propre `state`. */
    async function load(user: unknown = { id: 42, townDetails: { townId: 7, day: 5 } }): Promise<typeof import('./building-plans')> {
        vi.resetModules();
        const { state }: typeof import('../state') = await import('../state');
        state.api_url = 'https://api.test';
        state.mh_user = user as typeof state.mh_user;
        return import('./building-plans');
    }

    beforeEach((): void => {
        fetcherMock.mockReset();
    });

    it('loadBuildingPlans appelle /BuildingPlans/7 et renvoie le corps', async (): Promise<void> => {
        const body: unknown = { access: { isCitizen: true }, plans: [] };
        fetcherMock.mockResolvedValue(jsonResponse(200, body));
        const { loadBuildingPlans }: typeof import('./building-plans') = await load();

        expect(await loadBuildingPlans()).toEqual(body);
        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/BuildingPlans/7', expect.anything(), { wait_for_token: true });
    });

    it('loadBuildingPlans renvoie null sans ville', async (): Promise<void> => {
        const { loadBuildingPlans }: typeof import('./building-plans') = await load({ id: 42 });

        expect(await loadBuildingPlans()).toBeNull();
        expect(fetcherMock).not.toHaveBeenCalled();
    });

    it('loadBuildingStates renvoie la liste buildings de /BuildingPlans/7/state', async (): Promise<void> => {
        const buildings: unknown[] = [{ buildingId: 3, isBuilt: true, apRemaining: 0, life: 10, maxLife: 10 }];
        fetcherMock.mockResolvedValue(jsonResponse(200, { buildings, defense: null }));
        const { loadBuildingStates }: typeof import('./building-plans') = await load();

        expect(await loadBuildingStates()).toEqual(buildings);
        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/BuildingPlans/7/state', expect.anything(), { wait_for_token: true });
    });

    it('loadBuildingRefs n\'appelle /Fetcher/Buildings qu\'une fois', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, [{ id: 1, uid: 'a', label: {}, maxLife: 5 }]));
        const { loadBuildingRefs }: typeof import('./building-plans') = await load();

        await loadBuildingRefs();
        await loadBuildingRefs();

        expect(fetcherMock).toHaveBeenCalledTimes(1);
        expect(fetcherMock).toHaveBeenCalledWith('https://api.test/Fetcher/Buildings', expect.anything(), { wait_for_token: true });
    });

    it('saveHomeField poste le champ de maison du joueur', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(200, {}));
        const { saveHomeField }: typeof import('./building-plans') = await load();

        await saveHomeField('kitchenLevel', 2);

        expect(fetcherMock).toHaveBeenCalledWith(
            'https://api.test/ExternalTools/home?townId=7',
            expect.objectContaining({ method: 'POST', body: '{"userId":42,"home":{"kitchenLevel":2}}' }),
            { wait_for_token: true }
        );
    });

    it('une réponse 500 rejette', async (): Promise<void> => {
        fetcherMock.mockResolvedValue(jsonResponse(500, {}));
        const { loadBuildingPlans }: typeof import('./building-plans') = await load();

        await expect(loadBuildingPlans()).rejects.toThrow();
    });
});
