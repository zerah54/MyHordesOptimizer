import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { ApiCitizen, ApiExpedition } from '../types';
import type { ApiBuildingPlan, ApiBuildingPlans, PlanTask } from '../types/building-plan';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
vi.mock('../api/expeditions', () => ({ getMyExpeditions: vi.fn() }));
vi.mock('../api/citizens', () => ({ getCitizens: vi.fn() }));
vi.mock('../api/building-plans', () => ({ loadBuildingPlans: vi.fn(), loadBuildingStates: vi.fn(), loadBuildingRefs: vi.fn(), saveHomeField: vi.fn() }));
vi.mock('../api/daily-actions', () => ({ saveDailyAction: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));
vi.mock('./update-button', () => ({ createSmallUpdateExternalToolsButton: vi.fn((): HTMLElement => document.createElement('button')) }));
vi.mock('./expedition-route', () => ({
    formatCell: (point: { x: number; y: number }): string => `[${point.x} / ${point.y}]`,
    townPosition: (): { x: number; y: number } => ({ x: 10, y: 10 })
}));

type ProgramModule = typeof import('./my-program');

/** Appels simulés d'un test (recréés à chaque rechargement des modules) */
interface Mocks {
    getMyExpeditions: Mock;
    getCitizens: Mock;
    loadBuildingPlans: Mock;
    loadBuildingStates: Mock;
    loadBuildingRefs: Mock;
    saveDailyAction: Mock;
    addError: Mock;
    createSmallUpdateExternalToolsButton: Mock;
}

const ME_ID: number = 7;
const DAY: number = 5;

let openMyProgram: ProgramModule['openMyProgram'];
let mocks: Mocks;

/** Laisse passer les promesses en attente */
const flush = (): Promise<void> => new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve);
});

/** Plan effectif du jour où j'ai la consigne libre `a` (id) puis une consigne libre sans id (`p12u7t1` une fois dérivée). */
const plan: ApiBuildingPlan = {
    id: 12,
    day: DAY,
    isEffective: true,
    content: {
        eveningVoteBuildingId: null,
        citizens: [{ userId: ME_ID, tasks: [{ id: 'a', kind: 'free', label: 'Faire A', pa: 1 }, { kind: 'free', label: 'Faire B', pa: 2 } as PlanTask] }],
        programs: { banned: [], regular: [] },
        instructions: null
    }
};

/** Mon citoyen : la consigne sans id a été cochée sur le site sous sa clé dérivée. */
const me: ApiCitizen = { id: ME_ID, name: 'Moi', dailyActions: [{ day: DAY, actionKey: 'task_p12u7t1' }] };

/** Expédition où je suis inscrit */
const expedition: ApiExpedition = { label: 'Nord', parts: [{ id: 1, citizens: [{ idUser: ME_ID }], orders: [] }] };

/** Recharge les modules (onglet ouvert remis à zéro), efface les appels simulés et prépare des réponses qui réussissent. */
async function load(day: number | undefined): Promise<void> {
    document.documentElement.lang = 'fr';
    vi.resetModules();
    vi.clearAllMocks();
    const { state }: typeof import('../state') = await import('../state');
    state.mh_user = { id: ME_ID, townDetails: { townId: 1, day } };
    openMyProgram = (await import('./my-program')).openMyProgram;
    mocks = {
        getMyExpeditions: (await import('../api/expeditions')).getMyExpeditions as unknown as Mock,
        getCitizens: (await import('../api/citizens')).getCitizens as unknown as Mock,
        loadBuildingPlans: (await import('../api/building-plans')).loadBuildingPlans as unknown as Mock,
        loadBuildingStates: (await import('../api/building-plans')).loadBuildingStates as unknown as Mock,
        loadBuildingRefs: (await import('../api/building-plans')).loadBuildingRefs as unknown as Mock,
        saveDailyAction: (await import('../api/daily-actions')).saveDailyAction as unknown as Mock,
        addError: (await import('../utils/notifications')).addError as unknown as Mock,
        createSmallUpdateExternalToolsButton: (await import('./update-button')).createSmallUpdateExternalToolsButton as unknown as Mock
    };
    mocks.getMyExpeditions.mockResolvedValue([expedition]);
    mocks.getCitizens.mockResolvedValue({ citizens: [me] });
    mocks.loadBuildingPlans.mockResolvedValue({ access: { isCitizen: true }, plans: [plan] } satisfies ApiBuildingPlans);
    mocks.loadBuildingStates.mockResolvedValue([]);
    mocks.loadBuildingRefs.mockResolvedValue([]);
    mocks.saveDailyAction.mockResolvedValue(undefined);
}

/** Contenu de la fenêtre */
const content = (): HTMLElement => document.getElementById('mho-expeditions-window-content') as HTMLElement;

/** Onglets, dans l'ordre */
const tabs = (): HTMLLIElement[] => Array.from(content().querySelectorAll<HTMLLIElement>('#tabs > ul > li'));

/** Libellé de l'onglet ouvert */
const selectedLabel = (): string | null | undefined => content().querySelector('#tabs > ul > li.selected')?.textContent;

beforeEach((): void => {
    document.body.innerHTML = '<div id="mho-expeditions-window-content"></div>';
});

describe('openMyProgram', (): void => {
    it('affiche le titre du jour et les onglets Expédition puis Chantiers', async (): Promise<void> => {
        await load(DAY);

        await openMyProgram();

        expect(content().querySelector('.mho-program-title')?.textContent).toBe('Mon programme — J5');
        expect(tabs().map((tab: HTMLLIElement): HTMLElement | null => tab.querySelector(':scope > div')).every((div: HTMLElement | null): boolean => div !== null)).toBe(true);
        expect(tabs().map((tab: HTMLLIElement): string | null => tab.textContent)).toEqual(['Expédition', 'Chantiers · 1/2']);
        expect(selectedLabel()).toBe('Expédition');
        expect(content().querySelector('table.mho-table')).not.toBeNull();
    });

    it('lit les citoyens sans cache HTTP', async (): Promise<void> => {
        await load(DAY);

        await openMyProgram();

        expect(mocks.getCitizens).toHaveBeenCalledWith(true);
    });

    it('sans jour connu, le titre n\'a pas de jour', async (): Promise<void> => {
        await load(undefined);

        await openMyProgram();

        expect(content().querySelector('.mho-program-title')?.textContent).toBe('Mon programme');
    });

    it('l\'onglet Chantiers affiche le compte de consignes faites', async (): Promise<void> => {
        await load(DAY);
        await openMyProgram();

        tabs()[1].click();

        expect(tabs()[1].textContent).toBe('Chantiers · 1/2');
        expect(selectedLabel()).toBe('Chantiers · 1/2');
        const boxes: HTMLInputElement[] = Array.from(content().querySelectorAll<HTMLInputElement>('.mho-program-buildings input[type=checkbox]'));
        expect(boxes.map((box: HTMLInputElement): boolean => box.checked)).toEqual([false, true]);
    });

    it('Actualiser relit les données et garde l\'onglet ouvert', async (): Promise<void> => {
        await load(DAY);
        await openMyProgram();
        tabs()[1].click();

        const reload: HTMLElement | null = content().querySelector('div[role=button].mho-expedition-route-reload');
        expect(reload?.textContent).toBe('🗘');
        expect(reload?.title).toBe('Actualiser');
        reload?.click();
        await flush();

        expect(mocks.getMyExpeditions).toHaveBeenCalledTimes(2);
        expect(mocks.loadBuildingPlans).toHaveBeenCalledTimes(2);
        expect(selectedLabel()).toBe('Chantiers · 1/2');
        expect(content().querySelector('.mho-program-buildings')).not.toBeNull();
    });

    it('après le choix de la seconde expédition, Actualiser la garde ; l\'en-tête revient à la première', async (): Promise<void> => {
        await load(DAY);
        mocks.getMyExpeditions.mockResolvedValue([
            { id: 1, label: 'A', parts: [{ id: 1, label: 'Partie A', citizens: [{ idUser: ME_ID }], orders: [] }] },
            { id: 2, label: 'B', parts: [{ id: 2, label: 'Partie B', citizens: [{ idUser: ME_ID }], orders: [] }] }
        ] satisfies ApiExpedition[]);
        await openMyProgram(true);
        const select: HTMLSelectElement = content().querySelector('select.mho-program-expedition-choice') as HTMLSelectElement;
        select.value = '1';
        select.dispatchEvent(new Event('change'));

        (content().querySelector('.mho-expedition-route-reload') as HTMLElement).click();
        await flush();

        expect(content().querySelector('h2')?.textContent).toBe('Partie B');
        expect(content().querySelector<HTMLSelectElement>('select.mho-program-expedition-choice')?.value).toBe('1');

        await openMyProgram(true);

        expect(content().querySelector('h2')?.textContent).toBe('Partie A');
    });

    it('une ouverture depuis le bouton de l\'en-tête revient sur l\'onglet Expédition', async (): Promise<void> => {
        await load(DAY);
        await openMyProgram(true);
        tabs()[1].click();

        await openMyProgram(true);

        expect(selectedLabel()).toBe('Expédition');
    });

    it('une coche dans l\'onglet Chantiers relit les données et garde l\'onglet ouvert', async (): Promise<void> => {
        await load(DAY);
        await openMyProgram();
        tabs()[1].click();

        const box: HTMLInputElement = content().querySelector('.mho-program-buildings input[type=checkbox]') as HTMLInputElement;
        box.click();
        await flush();

        expect(mocks.saveDailyAction).toHaveBeenCalledWith('task_a', true);
        expect(mocks.getMyExpeditions).toHaveBeenCalledTimes(2);
        expect(selectedLabel()).toBe('Chantiers · 1/2');
    });

    it('un plan indisponible n\'empêche pas l\'onglet Expédition', async (): Promise<void> => {
        await load(DAY);
        const error: Error = new Error('plans');
        mocks.loadBuildingPlans.mockRejectedValue(error);

        await openMyProgram();

        expect(content().querySelector('table.mho-table')).not.toBeNull();
        expect(tabs()[1].textContent).toBe('Chantiers');
        expect(mocks.addError).toHaveBeenCalledWith(error);
        tabs()[1].click();
        expect(content().querySelector('.mho-program-buildings')).toBeNull();
    });

    it('seul le dernier chargement s\'affiche', async (): Promise<void> => {
        await load(DAY);
        let finish_first: (expeditions: ApiExpedition[]) => void = (): void => undefined;
        mocks.getMyExpeditions.mockReturnValueOnce(new Promise<ApiExpedition[]>((resolve: (expeditions: ApiExpedition[]) => void): void => {
            finish_first = resolve;
        }));

        const first: Promise<void> = openMyProgram();
        await openMyProgram();
        finish_first([]);
        await first;

        expect(content().querySelector('table.mho-table')).not.toBeNull();
    });

    it('le bouton Mettre à jour est créé une fois et relit les données une fois la mise à jour finie', async (): Promise<void> => {
        await load(DAY);
        await openMyProgram();
        await openMyProgram();

        expect(mocks.createSmallUpdateExternalToolsButton).toHaveBeenCalledTimes(1);
        const options: { id?: string | null; tooltip_id?: string; on_done?: () => void } = mocks.createSmallUpdateExternalToolsButton.mock.calls[0][1];
        expect(options.id).toBeNull();
        expect(options.tooltip_id).toBe('mho-program-update-tooltip');
        expect(content().querySelectorAll('.mho-program-header button')).toHaveLength(1);

        options.on_done?.();
        await flush();

        expect(mocks.getMyExpeditions).toHaveBeenCalledTimes(3);
    });
});
