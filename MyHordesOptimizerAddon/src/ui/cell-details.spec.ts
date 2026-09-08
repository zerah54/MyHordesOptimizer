import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMap } from '../api/map';
import { state } from '../state';
import { getCellDetailsByPosition } from '../utils/position';
import { clearRuinSubBlockIfNoRuin, displayCellDetailsOnPage, ensureRuinSubBlock } from './cell-details';

/**
 * `texts.ts` appelle `getScriptInfo()` au chargement du module pour construire le lien de
 * mise à jour : en environnement Tampermonkey/extension réel, `GM_info`/`browser`/`chrome`
 * existent toujours. En jsdom (Vitest), aucun des trois n'est défini, ce qui fait planter
 * l'import de `texts.ts` avant même le début des tests.
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

/** `pageIsDesert()` lit `document.URL` : mocké pour ne pas dépendre de l'URL jsdom par défaut */
vi.mock('../utils/page', () => ({
    pageIsDesert: (): boolean => true
}));

/** Évite le `MutationObserver`/timeout 15s de `waitForElement` : hors-sujet pour ce test */
vi.mock('../utils/render-watch', () => ({
    watchMap: vi.fn(),
    unwatchRendered: vi.fn()
}));

/** Position lue directement, sans dépendre du parsing DOM/`innerText` de `.current-location` */
vi.mock('../utils/position', () => ({
    getCellDetailsByPosition: vi.fn()
}));

vi.mock('../api/map', () => ({
    getMap: vi.fn(() => Promise.resolve({}))
}));

const getMapMock = getMap as unknown as ReturnType<typeof vi.fn>;
const getCellDetailsByPositionMock = getCellDetailsByPosition as unknown as ReturnType<typeof vi.fn>;

/** Laisse s'écouler les micro-tâches de la chaîne `.then().catch().finally()` de `getMap()` */
async function flushMapFetch(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
}

/** Reproduit `.map-box` avec ses deux niveaux de parents attendus par `displayCellDetailsOnPage` */
function buildMapBoxFixture(): void {
    document.body.innerHTML = '';
    const grandparent: HTMLDivElement = document.createElement('div');
    const parent: HTMLDivElement = document.createElement('div');
    const map_box: HTMLDivElement = document.createElement('div');
    map_box.classList.add('map-box');
    parent.appendChild(map_box);
    grandparent.appendChild(parent);
    document.body.appendChild(grandparent);
}

function cellFixture(overrides: Record<string, unknown> = {}): any {
    return {
        displayX: 3,
        displayY: 5,
        idRuin: null,
        note: '',
        maxPotentialRemainingDig: 10,
        totalSucces: 2,
        averagePotentialRemainingDig: 6,
        ...overrides
    };
}

/** Reproduit la structure minimale attendue par `ensureRuinSubBlock` : un conteneur de contenu identifié. */
function createCellInformationsFixture(): HTMLDivElement {
    const cell_informations: HTMLDivElement = document.createElement('div');
    const content: HTMLDivElement = document.createElement('div');
    content.id = 'cell-informations-content';
    cell_informations.appendChild(content);
    return cell_informations;
}

describe('ensureRuinSubBlock', () => {
    it('creates the ruin sub-block when idRuin is known and the block is missing', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        ensureRuinSubBlock(cell_informations, 42);

        expect(cell_informations.querySelector('#cell-ruin')).not.toBeNull();
        expect(cell_informations.querySelector('#cell-ruin-content')).not.toBeNull();
    });

    it('does nothing when idRuin is null or undefined', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        ensureRuinSubBlock(cell_informations, null);
        ensureRuinSubBlock(cell_informations, undefined);

        expect(cell_informations.querySelector('#cell-ruin')).toBeNull();
    });

    it('does not duplicate the block on repeated calls', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        ensureRuinSubBlock(cell_informations, 42);
        ensureRuinSubBlock(cell_informations, 42);

        expect(cell_informations.querySelectorAll('#cell-ruin').length).toBe(1);
    });

    it('creates the block on a later call even when the first call had no ruin (regression: cell-informations built before the real position is known)', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        ensureRuinSubBlock(cell_informations, null);
        expect(cell_informations.querySelector('#cell-ruin')).toBeNull();

        ensureRuinSubBlock(cell_informations, 42);
        expect(cell_informations.querySelector('#cell-ruin')).not.toBeNull();
    });
});

describe('clearRuinSubBlockIfNoRuin', () => {
    it('clears stale ruin content and returns true when the current cell has no ruin (regression: content from a previously visited ruin stayed forever)', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();
        ensureRuinSubBlock(cell_informations, 42);
        const ruin_content = cell_informations.querySelector('#cell-ruin-content') as HTMLDivElement;
        ruin_content.innerHTML = '<div>stale drops from ruin 42</div>';

        const cleared: boolean = clearRuinSubBlockIfNoRuin(cell_informations, null);

        expect(cleared).toBe(true);
        expect(ruin_content.innerHTML).toBe('');
    });

    it('does nothing and returns false when the current cell has a ruin', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();
        ensureRuinSubBlock(cell_informations, 42);
        const ruin_content = cell_informations.querySelector('#cell-ruin-content') as HTMLDivElement;
        ruin_content.innerHTML = '<div>current drops</div>';

        const cleared: boolean = clearRuinSubBlockIfNoRuin(cell_informations, 42);

        expect(cleared).toBe(false);
        expect(ruin_content.innerHTML).toBe('<div>current drops</div>');
    });

    it('does nothing when the sub-block does not exist yet', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        const cleared: boolean = clearRuinSubBlockIfNoRuin(cell_informations, null);

        expect(cleared).toBe(true);
        expect(cell_informations.querySelector('#cell-ruin')).toBeNull();
    });
});

describe('displayCellDetailsOnPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        buildMapBoxFixture();
        state.mho_parameters = { display_more_informations_from_mho: true } as any;
        state.mh_user = { townDetails: { townId: 12 } } as any;
        state.map = { cells: [cellFixture()] } as any;
        state.current_cell = undefined;
        getCellDetailsByPositionMock.mockReturnValue(cellFixture());
    });

    it('refetches the map on every render trigger instead of freezing after the first load (regression: getMap() was only called while state.map was still empty, never again once a cell was found)', async () => {
        displayCellDetailsOnPage();
        await flushMapFetch();

        displayCellDetailsOnPage();
        await flushMapFetch();

        displayCellDetailsOnPage();
        await flushMapFetch();

        expect(getMapMock).toHaveBeenCalledTimes(3);
    });

    it('does not stack a second fetch while one is still in flight for the same render burst', async () => {
        let resolveFetch: (value: unknown) => void = () => undefined;
        getMapMock.mockReturnValueOnce(new Promise((resolve) => { resolveFetch = resolve; }));

        displayCellDetailsOnPage();
        displayCellDetailsOnPage();
        displayCellDetailsOnPage();

        expect(getMapMock).toHaveBeenCalledTimes(1);

        resolveFetch({});
        await flushMapFetch();
    });
});
