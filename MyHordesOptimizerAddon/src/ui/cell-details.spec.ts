import { describe, expect, it, vi } from 'vitest';

import { clearRuinSubBlockIfNoRuin, ensureRuinSubBlock } from './cell-details';

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
