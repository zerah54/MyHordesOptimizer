import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMap } from '../api/map';
import { repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { getCellDetailsByPosition } from '../utils/position';
import { clearRuinSubBlockIfNoRuin, digLevelIcon, displayCellDetailsOnPage, ensureRuinSubBlock, formatRemainingDigs } from './cell-details';

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
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MHO Test', version: '0.0.0', updateURL: 'about:blank' }),
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

describe('formatRemainingDigs', () => {
    it('shows the remaining digs kept by MHO, rounded and never negative', () => {
        expect(formatRemainingDigs(6.4)).toBe(6);
        expect(formatRemainingDigs(-3)).toBe(0);
        expect(formatRemainingDigs(null)).toBe(0);
        expect(formatRemainingDigs(undefined)).toBe(0);
    });
});

describe('digLevelIcon', () => {
    it('suit les paliers du jeu : épuisée, presque épuisée, à moitié vide, abondante', () => {
        expect(digLevelIcon(0)).toBe('icons/Small_broken.gif');
        expect(digLevelIcon(1)).toBe('icons/collec_lv1.gif');
        expect(digLevelIcon(2)).toBe('icons/collec_lv1.gif');
        expect(digLevelIcon(3)).toBe('icons/collec_lv2.gif');
        expect(digLevelIcon(6)).toBe('icons/collec_lv2.gif');
        expect(digLevelIcon(7)).toBe('icons/collec_lv3.gif');
    });
});

describe('ensureRuinSubBlock (icône)', () => {
    it('affiche une icône de bâtiment en préfixe, sans titre de section', () => {
        const cell_informations: HTMLDivElement = createCellInformationsFixture();

        ensureRuinSubBlock(cell_informations, 42);

        expect(cell_informations.querySelector('#cell-ruin-header')).toBeNull();
        expect(cell_informations.querySelector('#cell-ruin > img').getAttribute('src')).toBe(`${repo_img_hordes_url}/icons/small_enter.gif`);
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

    it('monte sa section dans le bloc commun, sans bloc ni icône propres', () => {
        displayCellDetailsOnPage();

        const section: HTMLElement = document.querySelector('#mho-block-content > #cell-informations');
        expect(section).not.toBeNull();
        expect(document.querySelector('#cell-informations-content #cell-note')).not.toBeNull();
        expect(document.querySelector('#cell-informations-header').textContent).toContain('🗘');
        const own_icons: number = document.querySelectorAll('#mho-block img').length - document.querySelectorAll('#cell-informations-content img').length;
        expect(own_icons).toBe(1);
        expect(document.querySelectorAll('#cell-informations')).toHaveLength(1);
    });

    it('représente le niveau 3 par une icône en préfixe, sans titre de sous-section', () => {
        displayCellDetailsOnPage();

        expect(document.querySelector('#cell-note-header')).toBeNull();
        expect(document.querySelector('#cell-digs-header')).toBeNull();
        expect(document.querySelector('#cell-note > img').getAttribute('src')).toBe(`${repo_img_hordes_url}/icons/small_talk.gif`);
    });

    it('montre les fouilles sur une ligne, avec l\'icône du palier (6 restantes : à moitié vide)', () => {
        displayCellDetailsOnPage();

        expect(document.querySelector('#cell-digs > img').getAttribute('src')).toBe(`${repo_img_hordes_url}/icons/collec_lv2.gif`);
        expect(document.querySelector('#cell-digs-content').textContent)
            .toBe(`10 ${getI18N(texts.digs_max_short)} · 6 ${getI18N(texts.digs_average_short)}`);
    });

    it('prend l\'icône « vide » quand la zone est épuisée', () => {
        getCellDetailsByPositionMock.mockReturnValue(cellFixture({ maxPotentialRemainingDig: 0, averagePotentialRemainingDig: 0 }));

        displayCellDetailsOnPage();

        expect(document.querySelector('#cell-digs > img').getAttribute('src')).toBe(`${repo_img_hordes_url}/icons/Small_broken.gif`);
    });

    it('garde la ligne de note visible : phrase « pas de note » sans note, la note sinon', () => {
        displayCellDetailsOnPage();
        expect((document.querySelector('#cell-note') as HTMLElement).style.display).not.toBe('none');
        expect(document.querySelector('#cell-note-content').textContent).toBe(getI18N(texts.no_note));

        getCellDetailsByPositionMock.mockReturnValue(cellFixture({ note: 'RAS' }));
        displayCellDetailsOnPage();

        expect(document.querySelector('#cell-note-content').textContent).toBe('RAS');
    });
});
