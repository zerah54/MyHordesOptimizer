import { beforeAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { ApiCitizen, I18nLabel } from '../types';
import type { ApiBuildingPlan, ApiBuildingRef, PlanContent, PlanItem, PlanTask, TownBuildingState } from '../types/building-plan';
import type { BuildingsTabData } from './my-program-buildings';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));
vi.mock('../api/daily-actions', () => ({ saveDailyAction: vi.fn() }));
vi.mock('../api/building-plans', () => ({ saveHomeField: vi.fn() }));
vi.mock('../api/citizens', () => ({ getCitizens: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));

type BuildingsModule = typeof import('./my-program-buildings');

let createBuildingsTab: BuildingsModule['createBuildingsTab'];
let buildingsTabCount: BuildingsModule['buildingsTabCount'];
let toggleTask: BuildingsModule['toggleTask'];
let saveDailyAction: Mock;
let saveHomeField: Mock;
let getCitizens: Mock;
let addError: Mock;

beforeAll(async (): Promise<void> => {
    document.documentElement.lang = 'fr';
    const module: BuildingsModule = await import('./my-program-buildings');
    createBuildingsTab = module.createBuildingsTab;
    buildingsTabCount = module.buildingsTabCount;
    toggleTask = module.toggleTask;
    saveDailyAction = (await import('../api/daily-actions')).saveDailyAction as unknown as Mock;
    saveHomeField = (await import('../api/building-plans')).saveHomeField as unknown as Mock;
    getCitizens = (await import('../api/citizens')).getCitizens as unknown as Mock;
    addError = (await import('../utils/notifications')).addError as unknown as Mock;
});

beforeEach((): void => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    saveDailyAction.mockResolvedValue(undefined);
    saveHomeField.mockResolvedValue(undefined);
});

const DAY: number = 5;
const ME_ID: number = 7;

/** Libellé identique dans les 4 langues. */
const label = (text: string): I18nLabel => ({ fr: text, en: text, de: text, es: text });

const refs: ReadonlyMap<number, ApiBuildingRef> = new Map<number, ApiBuildingRef>([
    [1, { id: 1, uid: 'small_wallimprove_#00', label: label('Mur d\'enceinte'), maxLife: 0 }],
    [2, { id: 2, uid: 'small_water_#00', label: label('Pompe à eau'), maxLife: 0 }],
    [3, { id: 3, uid: 'small_refine_#00', label: label('Atelier'), maxLife: 20 }]
]);

/** Plan effectif du jour, contenu vide sauf ce qui est précisé. */
const planOf = (content: Partial<PlanContent>): ApiBuildingPlan => ({
    id: 1,
    day: DAY,
    isEffective: true,
    content: { eveningVoteBuildingId: null, citizens: [], programs: { banned: [], regular: [] }, instructions: null, ...content }
});

/** Plan dont je porte les consignes `tasks`, programme régulier `regular`. */
const planWith = (tasks: PlanTask[], regular: PlanItem[] = []): ApiBuildingPlan =>
    planOf({ citizens: [{ userId: ME_ID, tasks }], programs: { banned: [], regular } });

/** Mon citoyen, sans action ni maison sauf ce qui est précisé. */
const meOf = (citizen: Partial<ApiCitizen> = {}): ApiCitizen => ({ id: ME_ID, dailyActions: [], home: { content: {} }, ...citizen });

/** Données de l'onglet : citoyen de la ville, sans état de chantier sauf ce qui est précisé. */
const dataOf = (data: Partial<BuildingsTabData>): BuildingsTabData => ({
    access_citizen: true,
    plan: null,
    me: meOf(),
    states: new Map<number, TownBuildingState>(),
    refs,
    day: DAY,
    house_editable: false,
    slavery_built: false,
    ...data
});

const state = (buildingId: number, s: Partial<TownBuildingState>): [number, TownBuildingState] =>
    [buildingId, { buildingId, isBuilt: false, apRemaining: null, life: null, maxLife: null, ...s }];

/** Laisse se terminer les promesses en attente. */
const flush = (): Promise<void> => new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, 0);
});

const stepTexts = (tab: HTMLElement): string[] => Array.from(tab.querySelectorAll<HTMLLIElement>('ol > li')).map((li: HTMLLIElement): string => li.textContent ?? '');
/** Onglet attaché au document : une case détachée ne déclenche pas `change` au clic. */
const mounted = (data: BuildingsTabData, on_changed: () => void): HTMLElement => document.body.appendChild(createBuildingsTab(data, on_changed));
const checkboxes = (tab: HTMLElement): HTMLInputElement[] => Array.from(tab.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));

describe('createBuildingsTab — affichage', (): void => {
    it('affiche consignes du jour, vote, consignes individuelles et programme dans l\'ordre', (): void => {
        const plan: ApiBuildingPlan = planOf({
            instructions: 'Tout le monde au Puits avant 18 h',
            eveningVoteBuildingId: 2,
            eveningSecondVoteBuildingId: 3,
            citizens: [{ userId: ME_ID, tasks: [{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }] }],
            programs: {
                banned: [],
                regular: [
                    { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 },
                    { buildingId: 2, kind: 'build', mode: 'leave', targetRemaining: 10, note: 'avant 18 h' },
                    { buildingId: 3, kind: 'repair', mode: 'survive', targetRemaining: 0 },
                    { kind: 'instruction', text: 'S\'il vous reste des PA : Tour de guet' }
                ]
            }
        });

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan }), vi.fn());

        const text: string = tab.textContent ?? '';
        const order: string[] = [
            'Consignes du jour',
            'Tout le monde au Puits avant 18 h',
            'Évolutions votées ce soir : Pompe à eau, Atelier',
            'Consignes individuelles',
            'Fouiller les déchets (1PA)',
            'Programme chantiers dans l\'ordre'
        ];
        const positions: number[] = order.map((part: string): number => text.indexOf(part));
        expect(positions.every((position: number): boolean => position >= 0)).toBe(true);
        expect([...positions].sort((a: number, b: number): number => a - b)).toEqual(positions);
        expect(stepTexts(tab)).toEqual([
            'Mur d\'enceinte',
            'Laisser Pompe à eau à 10PA — avant 18 h',
            'Réparer Atelier pour passer la nuit',
            'S\'il vous reste des PA : Tour de guet'
        ]);
        expect(text).not.toContain('Rien à faire aujourd\'hui.');
    });

    it('un seul vote : libellé au singulier ; chantier inconnu : #id', (): void => {
        const tab: HTMLElement = createBuildingsTab(dataOf({ plan: planOf({ eveningVoteBuildingId: 42, programs: { banned: [], regular: [{ buildingId: 42, kind: 'build', mode: 'finish', targetRemaining: 0 }] } }) }), vi.fn());

        expect(tab.textContent).toContain('Évolution votée ce soir : #42');
        expect(stepTexts(tab)).toEqual(['#42']);
    });

    it('étape construite : barrée et marquée ; réparer pour passer la nuit : sans état', (): void => {
        const plan: ApiBuildingPlan = planWith([], [
            { buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 },
            { buildingId: 3, kind: 'repair', mode: 'survive', targetRemaining: 0 }
        ]);
        const states: ReadonlyMap<number, TownBuildingState> = new Map<number, TownBuildingState>([state(1, { isBuilt: true }), state(3, { life: 20, maxLife: 20 })]);

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan, states }), vi.fn());

        const items: HTMLLIElement[] = Array.from(tab.querySelectorAll<HTMLLIElement>('ol > li'));
        expect(items[0].classList.contains('done')).toBe(true);
        expect(items[0].textContent).toContain('✔');
        expect(items[1].classList.contains('done')).toBe(false);
        expect(items[1].textContent).not.toContain('✔');
    });

    it('chantier absent de l\'état : ni barré ni marqué', (): void => {
        const plan: ApiBuildingPlan = planWith([], [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }]);
        const states: ReadonlyMap<number, TownBuildingState> = new Map<number, TownBuildingState>([state(9, { isBuilt: true })]);

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan, states }), vi.fn());

        const item: HTMLLIElement | null = tab.querySelector<HTMLLIElement>('ol > li');
        expect(item?.classList.contains('done')).toBe(false);
        expect(item?.textContent).toBe('Mur d\'enceinte');
    });

    it('banni sans Bureau des esclavagistes : seules les réparations de la liste des bannis', (): void => {
        const plan: ApiBuildingPlan = planOf({
            citizens: [{ userId: ME_ID, tasks: [] }],
            programs: {
                banned: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }, { buildingId: 3, kind: 'repair', mode: 'finish', targetRemaining: 0 }],
                regular: [{ buildingId: 2, kind: 'build', mode: 'finish', targetRemaining: 0 }]
            }
        });

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan, me: meOf({ isShunned: true }), slavery_built: false }), vi.fn());

        expect(stepTexts(tab)).toEqual(['Réparer entièrement Atelier']);
    });

    it('consigne relevée : cochée, repère « relevé en jeu » ; maison relevée non modifiable si la ville a une API externe', (): void => {
        const plan: ApiBuildingPlan = planWith([{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }, { id: 'h', kind: 'home', level: 1, pa: 2 }]);
        const me: ApiCitizen = meOf({ dailyActions: [{ day: DAY, actionKey: 'trash' }], home: { content: { houseLevel: 2 } } });

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan, me, house_editable: false }), vi.fn());

        const [action, home]: HTMLInputElement[] = checkboxes(tab);
        expect(action.checked).toBe(true);
        expect(action.disabled).toBe(false);
        expect(action.closest('li')?.textContent).toContain('relevé en jeu');
        expect(home.checked).toBe(true);
        expect(home.disabled).toBe(true);

        const editable: HTMLElement = createBuildingsTab(dataOf({ plan, me, house_editable: true }), vi.fn());
        expect(checkboxes(editable)[1].disabled).toBe(false);
    });

    it('consigne sans id non relevée : case désactivée', (): void => {
        const plan: ApiBuildingPlan = planWith([{ kind: 'free', label: 'Aller au puits', pa: 1 }, { id: 'f', kind: 'free', label: 'Porter de l\'eau', pa: 1 }]);

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan }), vi.fn());

        const [legacy, current]: HTMLInputElement[] = checkboxes(tab);
        expect(legacy.disabled).toBe(true);
        expect(current.disabled).toBe(false);
        expect(tab.textContent).not.toContain('relevé en jeu');
    });

    it('citoyen absent du plan : pas de consignes individuelles, programme affiché ; rien du tout → « Rien à faire aujourd\'hui. »', (): void => {
        const plan: ApiBuildingPlan = planOf({
            citizens: [{ userId: 99, tasks: [{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }] }],
            programs: { banned: [], regular: [{ buildingId: 1, kind: 'build', mode: 'finish', targetRemaining: 0 }] }
        });

        const tab: HTMLElement = createBuildingsTab(dataOf({ plan }), vi.fn());

        expect(tab.textContent).not.toContain('Consignes individuelles');
        expect(checkboxes(tab)).toHaveLength(0);
        expect(stepTexts(tab)).toEqual(['Mur d\'enceinte']);
        expect(tab.textContent).not.toContain('Rien à faire aujourd\'hui.');

        const empty: HTMLElement = createBuildingsTab(dataOf({ plan: planOf({}) }), vi.fn());
        expect(empty.textContent).toBe('Rien à faire aujourd\'hui.');
    });

    it('pas de plan effectif → « Aucun programme effectif pour ce jour. » ; pas citoyen → « Vous n\'êtes pas citoyen de cette ville. »', (): void => {
        expect(createBuildingsTab(dataOf({ plan: null }), vi.fn()).textContent).toBe('Aucun programme effectif pour ce jour.');
        expect(createBuildingsTab(dataOf({ access_citizen: false, plan: planOf({}) }), vi.fn()).textContent).toBe('Vous n\'êtes pas citoyen de cette ville.');
        expect(createBuildingsTab(dataOf({ me: undefined, plan: planOf({}) }), vi.fn()).textContent).toBe('Vous n\'êtes pas citoyen de cette ville.');
    });
});

describe('createBuildingsTab — coches', (): void => {
    it('cocher une action appelle saveDailyAction(clé, true) puis on_changed', async (): Promise<void> => {
        const on_changed: Mock = vi.fn();
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }]) }), on_changed);
        const [box]: HTMLInputElement[] = checkboxes(tab);

        box.click();
        expect(box.disabled).toBe(true);
        await flush();

        expect(saveDailyAction).toHaveBeenCalledWith('trash', true);
        expect(on_changed).toHaveBeenCalledTimes(1);
        expect(box.checked).toBe(true);
        expect(box.disabled).toBe(false);
    });

    it('cocher une consigne libre envoie task_<id>', async (): Promise<void> => {
        const on_changed: Mock = vi.fn();
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'x9', kind: 'free', label: 'Porter de l\'eau', pa: 1 }]) }), on_changed);

        checkboxes(tab)[0].click();
        await flush();

        expect(saveDailyAction).toHaveBeenCalledWith('task_x9', true);
        expect(on_changed).toHaveBeenCalledTimes(1);
    });

    it('cocher une amélioration écrit le niveau visé après relecture du citoyen', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [meOf({ home: { content: { kitchenLevel: 1 } } })] });
        const on_changed: Mock = vi.fn();
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'k', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }]) }), on_changed);

        checkboxes(tab)[0].click();
        await flush();

        expect(getCitizens).toHaveBeenCalledTimes(1);
        expect(getCitizens).toHaveBeenCalledWith(true);
        expect(saveHomeField).toHaveBeenCalledWith('kitchenLevel', 2);
        expect(getCitizens.mock.invocationCallOrder[0]).toBeLessThan(saveHomeField.mock.invocationCallOrder[0]);
        expect(on_changed).toHaveBeenCalledTimes(1);
    });

    it('déjà atteint : rien n\'est écrit', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [meOf({ home: { content: { kitchenLevel: 3 } } })] });
        const on_changed: Mock = vi.fn();
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'k', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }]) }), on_changed);

        checkboxes(tab)[0].click();
        await flush();

        expect(saveHomeField).not.toHaveBeenCalled();
        expect(on_changed).toHaveBeenCalledTimes(1);
    });

    it('échec d\'écriture : la case revient à son état d\'avant, on_changed non appelé', async (): Promise<void> => {
        saveDailyAction.mockRejectedValue(new Error('réseau'));
        const on_changed: Mock = vi.fn();
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }]) }), on_changed);
        const [box]: HTMLInputElement[] = checkboxes(tab);

        box.click();
        await flush();

        expect(box.checked).toBe(false);
        expect(box.disabled).toBe(false);
        expect(on_changed).not.toHaveBeenCalled();
        expect(addError).not.toHaveBeenCalled();
    });

    it('échec d\'écriture d\'une amélioration : erreur notifiée, la case revient à son état d\'avant', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [meOf({ home: { content: { kitchenLevel: 2 } } })] });
        saveHomeField.mockRejectedValue(new Error('réseau'));
        const on_changed: Mock = vi.fn();
        const me: ApiCitizen = meOf({ home: { content: { kitchenLevel: 2 } } });
        const tab: HTMLElement = mounted(dataOf({ plan: planWith([{ id: 'k', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }]), me }), on_changed);
        const [box]: HTMLInputElement[] = checkboxes(tab);
        expect(box.checked).toBe(true);

        box.click();
        await flush();

        expect(saveHomeField).toHaveBeenCalledWith('kitchenLevel', 1);
        expect(addError).toHaveBeenCalledTimes(1);
        expect(box.checked).toBe(true);
        expect(on_changed).not.toHaveBeenCalled();
    });
});

describe('toggleTask', (): void => {
    it('amélioration à un seul niveau : écrit un booléen', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [meOf({ home: { content: { hasAlarm: true } } })] });

        await toggleTask({ id: 'al', kind: 'homeUpgrade', ref: 'hasAlarm', pa: 1 }, meOf(), false, false);

        expect(saveHomeField).toHaveBeenCalledWith('hasAlarm', false);
    });

    it('maison dans une ville sans API externe : écrit le niveau d\'habitation', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [meOf({ home: { content: { houseLevel: 1 } } })] });

        await toggleTask({ id: 'h', kind: 'home', level: 3, pa: 4 }, meOf(), true, true);

        expect(saveHomeField).toHaveBeenCalledWith('houseLevel', 3);
        expect(saveDailyAction).not.toHaveBeenCalled();
    });

    it('citoyen introuvable à la relecture : rejette sans rien écrire', async (): Promise<void> => {
        getCitizens.mockResolvedValue({ citizens: [] });

        await expect(toggleTask({ id: 'k', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }, meOf(), true, false)).rejects.toThrow();

        expect(saveHomeField).not.toHaveBeenCalled();
    });

    it('amélioration hors du référentiel (clé héritée d\'Object) : coche propre, sans relecture ni écriture de la maison', async (): Promise<void> => {
        await toggleTask({ id: 'ts', kind: 'homeUpgrade', ref: 'toString', pa: 1 }, meOf(), true, false);

        expect(getCitizens).not.toHaveBeenCalled();
        expect(saveHomeField).not.toHaveBeenCalled();
        expect(saveDailyAction).toHaveBeenCalledWith('task_ts', true);
    });

    it('action inconnue : rejette sans rien écrire', async (): Promise<void> => {
        await expect(toggleTask({ id: 'z', kind: 'action', ref: 'unknown', pa: 1 }, meOf(), true, false)).rejects.toThrow();

        expect(saveDailyAction).not.toHaveBeenCalled();
    });
});

describe('buildingsTabCount', (): void => {
    it('1 faite sur 2 → « 1/2 » ; aucune consigne → null', (): void => {
        const plan: ApiBuildingPlan = planWith([{ id: 'a', kind: 'action', ref: 'trash', pa: 1 }, { id: 'f', kind: 'free', label: 'Porter de l\'eau', pa: 1 }]);
        const me: ApiCitizen = meOf({ dailyActions: [{ day: DAY, actionKey: 'trash' }] });

        expect(buildingsTabCount(dataOf({ plan, me }))).toBe('1/2');
        expect(buildingsTabCount(dataOf({ plan: planWith([]) }))).toBeNull();
        expect(buildingsTabCount(dataOf({ plan: null }))).toBeNull();
        expect(buildingsTabCount(dataOf({ plan, me: undefined }))).toBeNull();
    });
});
