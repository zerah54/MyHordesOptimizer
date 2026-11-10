import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTownCitizenRefs } from '../api/citizens';
import { loadMyExpeditions, myExpeditionsKey } from '../api/expeditions';
import { loadRoutesWithoutExpedition } from '../api/map-routes';
import { state } from '../state';
import type { ApiExpedition, ApiExpeditionOrder, ApiMapRoute } from '../types';
import { routeChoice, setRouteChoice } from '../utils/expedition-route-selection';
import { unwatchRendered, watchMap } from '../utils/render-watch';
import {
    clearExpeditionRoute,
    displayExpeditionRouteOnPage,
    expedition_route_block_id,
    renderExpeditionRoute,
    route_directions_attribute,
    route_mode_attribute
} from './expedition-route';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

vi.mock('../utils/page', () => ({
    pageIsDesert: (): boolean => true
}));

vi.mock('../utils/render-watch', () => ({
    watchMap: vi.fn(),
    unwatchRendered: vi.fn()
}));

vi.mock('../api/expeditions', () => ({
    loadMyExpeditions: vi.fn((): Promise<ApiExpedition[]> => Promise.resolve([])),
    myExpeditionsKey: vi.fn((): string => '1:5')
}));

vi.mock('../api/map-routes', () => ({
    loadRoutesWithoutExpedition: vi.fn((): Promise<ApiMapRoute[]> => Promise.resolve([]))
}));

vi.mock('../api/citizens', () => ({
    fetchTownCitizenRefs: vi.fn((): Promise<unknown[]> => Promise.resolve([{ id: 7, name: 'Lead', job: null }]))
}));

/** Choix enregistré simulé ; la liste et le choix par défaut sont les vrais */
vi.mock('../utils/expedition-route-selection', async (importOriginal: () => Promise<object>) => ({
    ...await importOriginal(),
    routeChoice: vi.fn((): string | undefined => undefined),
    loadRouteChoice: vi.fn((): Promise<void> => Promise.resolve()),
    setRouteChoice: vi.fn((): Promise<void> => Promise.resolve())
}));

const loadMyExpeditionsMock: ReturnType<typeof vi.fn> = loadMyExpeditions as unknown as ReturnType<typeof vi.fn>;
const loadRoutesMock: ReturnType<typeof vi.fn> = loadRoutesWithoutExpedition as unknown as ReturnType<typeof vi.fn>;
const myExpeditionsKeyMock: ReturnType<typeof vi.fn> = myExpeditionsKey as unknown as ReturnType<typeof vi.fn>;
const fetchTownCitizenRefsMock: ReturnType<typeof vi.fn> = fetchTownCitizenRefs as unknown as ReturnType<typeof vi.fn>;
const routeChoiceMock: ReturnType<typeof vi.fn> = routeChoice as unknown as ReturnType<typeof vi.fn>;
const setRouteChoiceMock: ReturnType<typeof vi.fn> = setRouteChoice as unknown as ReturnType<typeof vi.fn>;

/** Ville en (10, 10) : case relative (x, y) = absolue (10 + x, 10 - y) */
function absolute(x: number, y: number): { x: number; y: number } {
    return { x: 10 + x, y: 10 - y };
}

function order(overrides: Partial<ApiExpeditionOrder>): ApiExpeditionOrder {
    return { type: 'checkbox', text: '', isDone: false, position: 0, kind: null, ...overrides };
}

function expedition(citizen_orders: ApiExpeditionOrder[] = []): ApiExpedition {
    return {
        id: 1,
        label: 'Nord',
        parts: [{
            id: 12,
            orders: [order({ id: 1, ...absolute(0, 1), kind: 'camp' }), order({ id: 2, ...absolute(0, 2), text: '<p>Fouiller</p>' })],
            citizens: [{ idUser: 42, orders: [] }, { idUser: 7, orders: citizen_orders }],
            mapRoute: { id: 3, label: 'Boucle', color: 'teal', cells: [absolute(0, 0), absolute(0, 1), absolute(0, 2), absolute(0, 3)], length: 3, version: 1 }
        }]
    };
}

/** Tracé sans expédition, vers l'est à partir de la case relative (0, 1) */
function townRoute(): ApiMapRoute {
    return { id: 5, label: 'Est', color: 'violet', cells: [absolute(0, 1), absolute(1, 1), absolute(2, 1)], length: 2, version: 1, linkedParts: [] };
}

function routeSelect(): HTMLSelectElement | null {
    return document.querySelector<HTMLSelectElement>(`#${expedition_route_block_id} select.mho-expedition-route-choice`);
}

/** Ville et jour encore jamais vus : les tracés de la ville y sont chargés à neuf */
function useFreshDay(day: number): void {
    myExpeditionsKeyMock.mockReturnValue(`1:${day}`);
    state.mh_user = { id: 42, townDetails: { townId: 1, day, townX: 10, townY: 10 } };
    state.my_expeditions_key = `1:${day}`;
}

/** `.map-box` et ses deux parents (où le bloc s'insère), la carte du désert et la position affichée */
function buildDesert(position: string): HTMLElement {
    document.body.innerHTML = '';
    const grandparent: HTMLDivElement = document.createElement('div');
    const parent: HTMLDivElement = document.createElement('div');
    const map_box: HTMLDivElement = document.createElement('div');
    map_box.classList.add('map-box');
    const map: HTMLElement = document.createElement('hordes-map');
    map.id = 'beyond-map';
    const location: HTMLDivElement = document.createElement('div');
    location.classList.add('current-location');
    location.textContent = position;
    map.appendChild(location);
    map_box.appendChild(map);
    parent.appendChild(map_box);
    grandparent.appendChild(parent);
    document.body.appendChild(grandparent);
    return map;
}

function setPosition(position: string): void {
    document.querySelector('.current-location').textContent = position;
}

function blockText(selector: string): string | undefined {
    return document.querySelector(`#${expedition_route_block_id} ${selector}`)?.textContent ?? undefined;
}

async function flush(): Promise<void> {
    for (let i: number = 0; i < 5; i++) {
        await Promise.resolve();
    }
}

describe('expedition-route', (): void => {
    beforeEach((): void => {
        state.mho_parameters = { display_my_expeditions: true, display_expedition_route: true };
        state.mh_user = { id: 42, townDetails: { townId: 1, day: 5, townX: 10, townY: 10 } };
        state.my_expeditions = [expedition()];
        state.my_expeditions_key = '1:5';
        state.my_expeditions_loaded_at = Date.now();
        loadMyExpeditionsMock.mockClear();
        fetchTownCitizenRefsMock.mockClear();
        myExpeditionsKeyMock.mockReturnValue('1:5');
        loadRoutesMock.mockReset();
        loadRoutesMock.mockResolvedValue([]);
        routeChoiceMock.mockReturnValue(undefined);
        setRouteChoiceMock.mockClear();
    });

    afterEach(async (): Promise<void> => {
        /** Le chargement lancé par le rendu se termine avant de vider l'état */
        await flush();
        clearExpeditionRoute();
        state.my_expeditions = undefined;
        state.my_expeditions_key = undefined;
        state.my_expeditions_loaded_at = undefined;
    });

    it('sur le tracé : désigne la flèche de la case suivante et donne les consignes de la case', (): void => {
        routeChoiceMock.mockReturnValue('part:12');
        const map: HTMLElement = buildDesert('Position : 0 / 1');

        displayExpeditionRouteOnPage();

        expect(watchMap).toHaveBeenCalledWith('expedition-route', renderExpeditionRoute);
        expect(map.getAttribute(route_directions_attribute)).toBe('north');
        expect(map.getAttribute(route_mode_attribute)).toBe('on_route');
        expect(routeSelect().value).toBe('part:12');
        expect(routeSelect().selectedOptions[0].textContent).toBe('Nord');
        expect(blockText('.mho-expedition-route-name')).toBe('Boucle · 3 AP');
        expect(blockText('.mho-expedition-route-status')).toBe('Follow the route: north ⇧');
        expect(blockText('.mho-order strong')).toBe('Camp');
        expect(blockText('.mho-expedition-route-next')).toBe('Next zone with instructions: [0 / 2] · 1 AP');
        expect(document.querySelector<HTMLElement>('.mho-expedition-route-swatch').style.backgroundColor).toBe('rgb(70, 214, 224)');
    });

    it('case traversée deux fois : consignes groupées par passage, sans ligne « prochaine case »', (): void => {
        routeChoiceMock.mockReturnValue('part:12');
        const cells: { x: number; y: number }[] = [absolute(0, 0), absolute(0, 1), absolute(0, 2), absolute(0, 1), absolute(0, 0)];
        state.my_expeditions = [{
            id: 1,
            label: 'Nord',
            parts: [{
                id: 12,
                orders: [order({ id: 1, ...absolute(0, 1), text: '<p>Aller</p>', passage: 1 }), order({ id: 2, ...absolute(0, 1), text: '<p>Retour</p>', passage: 2 })],
                citizens: [{ idUser: 42, orders: [] }],
                mapRoute: { id: 3, label: 'Boucle', color: 'teal', cells, length: 4, version: 1 }
            }]
        }];
        buildDesert('Position : 0 / 1');

        renderExpeditionRoute();

        const labels: string[] = [...document.querySelectorAll('.mho-expedition-route-passage')].map((line: Element): string => line.textContent);
        expect(labels).toEqual(['Pass 1 · 1 AP', 'Pass 2 · 3 AP']);
        expect(document.querySelectorAll('.mho-order').length).toBe(2);
        expect(blockText('.mho-expedition-route-next')).toBeUndefined();
    });

    it('hors du tracé : la flèche qui le rejoint, et la distance', (): void => {
        routeChoiceMock.mockReturnValue('part:12');
        const map: HTMLElement = buildDesert('Position : 2 / 1');

        renderExpeditionRoute();

        expect(map.getAttribute(route_directions_attribute)).toBe('west');
        expect(map.getAttribute(route_mode_attribute)).toBe('back');
        expect(blockText('.mho-expedition-route-status')).toBe('Off the route, go back: west ⇦ (2 AP)');
        expect(blockText('.mho-expedition-route-empty')).toBe('No instruction for this zone');
    });

    it('suit les déplacements : le bloc se met à jour, la fin du tracé retire la couleur', (): void => {
        routeChoiceMock.mockReturnValue('part:12');
        const map: HTMLElement = buildDesert('Position : 0 / 1');
        renderExpeditionRoute();

        setPosition('Position : 0 / 3');
        renderExpeditionRoute();

        expect(map.hasAttribute(route_directions_attribute)).toBe(false);
        expect(blockText('.mho-expedition-route-status')).toBe('End of the route');
    });

    it('consignes des autres membres : à part, avec leur nom (chargé une fois)', async (): Promise<void> => {
        routeChoiceMock.mockReturnValue('part:12');
        state.my_expeditions = [expedition([order({ id: 9, ...absolute(0, 1), kind: 'wait' })])];
        buildDesert('Position : 0 / 1');

        renderExpeditionRoute();
        await flush();

        expect(fetchTownCitizenRefsMock).toHaveBeenCalledTimes(1);
        expect(blockText('.mho-expedition-route-others .mho-order-owner')).toBe('— Lead');
    });

    it('sans tracé choisi : rien sur la carte ni dans le détail, la liste reste pour en choisir un', (): void => {
        const map: HTMLElement = buildDesert('Position : 0 / 1');

        renderExpeditionRoute();

        expect(map.hasAttribute(route_directions_attribute)).toBe(false);
        expect(routeSelect().value).toBe('');
        expect(document.querySelector(`#${expedition_route_block_id} .mho-expedition-route-content`).childElementCount).toBe(0);
    });

    it('recharge les expéditions à chaque changement de case, pas à chaque rendu', async (): Promise<void> => {
        buildDesert('Position : 0 / 1');
        renderExpeditionRoute();
        await flush();
        loadMyExpeditionsMock.mockClear();

        renderExpeditionRoute();
        await flush();
        expect(loadMyExpeditionsMock).not.toHaveBeenCalled();

        setPosition('Position : 0 / 2');
        renderExpeditionRoute();
        await flush();
        expect(loadMyExpeditionsMock).toHaveBeenCalledTimes(1);

        document.querySelector<HTMLElement>('.mho-expedition-route-reload').click();
        await flush();
        expect(loadMyExpeditionsMock).toHaveBeenCalledTimes(2);
    });

    it('expéditions d\'un autre jour : rien d\'affiché en attendant leur chargement', (): void => {
        state.my_expeditions_key = '1:4';
        buildDesert('Position : 0 / 4');

        renderExpeditionRoute();

        expect(document.getElementById(expedition_route_block_id)).toBeNull();
    });

    it('« aucun tracé » choisi : plus de flèche, la liste reste pour en choisir un autre', (): void => {
        routeChoiceMock.mockReturnValue('');
        const map: HTMLElement = buildDesert('Position : 0 / 1');

        renderExpeditionRoute();

        expect(routeChoiceMock).toHaveBeenCalledWith('1:5');
        expect(map.hasAttribute(route_directions_attribute)).toBe(false);
        expect(routeSelect().value).toBe('');
        expect(blockText('.mho-expedition-route-status')).toBeUndefined();
    });

    it('liste : mes expéditions, puis les tracés sans expédition', async (): Promise<void> => {
        useFreshDay(6);
        loadRoutesMock.mockResolvedValue([townRoute()]);
        buildDesert('Position : 0 / 1');

        renderExpeditionRoute();
        await flush();

        expect(loadRoutesMock).toHaveBeenCalledTimes(1);
        const groups: string[] = [...routeSelect().querySelectorAll('optgroup')].map((group: HTMLOptGroupElement): string => group.label);
        expect(groups).toEqual(['My expeditions', 'Routes without expedition']);
        const values: string[] = [...routeSelect().options].map((option: HTMLOptionElement): string => option.value);
        expect(values).toEqual(['', 'part:12', 'route:5']);
    });

    it('choisir un tracé sans expédition : enregistré, suivi, sans consignes', async (): Promise<void> => {
        useFreshDay(7);
        loadRoutesMock.mockResolvedValue([townRoute()]);
        setRouteChoiceMock.mockImplementation((key: string, value: string): Promise<void> => {
            routeChoiceMock.mockReturnValue(value);
            return Promise.resolve();
        });
        const map: HTMLElement = buildDesert('Position : 0 / 1');
        renderExpeditionRoute();
        await flush();

        routeSelect().value = 'route:5';
        routeSelect().dispatchEvent(new Event('change'));

        expect(setRouteChoiceMock).toHaveBeenCalledWith('1:7', 'route:5');
        expect(map.getAttribute(route_directions_attribute)).toBe('east');
        expect(blockText('.mho-expedition-route-name')).toBe('Est · 2 AP');
        expect(blockText('.mho-expedition-route-subtitle')).toBeUndefined();
        expect(blockText('.mho-expedition-route-empty')).toBeUndefined();
    });

    it('sans expédition ce jour mais avec des tracés sans expédition : la liste, aucun suivi par défaut', async (): Promise<void> => {
        useFreshDay(8);
        state.my_expeditions = [];
        loadRoutesMock.mockResolvedValue([townRoute()]);
        const map: HTMLElement = buildDesert('Position : 0 / 1');

        renderExpeditionRoute();
        await flush();

        expect(routeSelect().value).toBe('');
        expect(map.hasAttribute(route_directions_attribute)).toBe(false);
    });

    it('tracés de la ville : chargés une fois par jour, et au rechargement demandé', async (): Promise<void> => {
        useFreshDay(9);
        buildDesert('Position : 0 / 1');
        renderExpeditionRoute();
        await flush();

        setPosition('Position : 0 / 2');
        renderExpeditionRoute();
        await flush();
        expect(loadRoutesMock).toHaveBeenCalledTimes(1);

        document.querySelector<HTMLElement>('.mho-expedition-route-reload').click();
        await flush();
        expect(loadRoutesMock).toHaveBeenCalledTimes(2);
    });

    it('s\'affiche sans « Mon programme » : l\'option est indépendante', (): void => {
        state.mho_parameters = { display_my_expeditions: false, display_expedition_route: true };
        buildDesert('Position : 0 / 1');

        displayExpeditionRouteOnPage();

        expect(document.getElementById(expedition_route_block_id)).not.toBeNull();
    });

    it('sans expédition ce jour, ou option décochée : rien', (): void => {
        const map: HTMLElement = buildDesert('Position : 0 / 1');
        renderExpeditionRoute();
        expect(document.getElementById(expedition_route_block_id)).not.toBeNull();

        state.mho_parameters = { display_my_expeditions: true, display_expedition_route: false };
        displayExpeditionRouteOnPage();

        expect(unwatchRendered).toHaveBeenCalledWith('expedition-route');
        expect(map.hasAttribute(route_directions_attribute)).toBe(false);
        expect(document.getElementById(expedition_route_block_id)).toBeNull();
    });
});
