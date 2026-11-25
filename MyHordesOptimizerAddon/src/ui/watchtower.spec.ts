import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RefinedAttack } from '../api/estimations';
import { getEstimations, getRefinedAttack } from '../api/estimations';
import { mho_watchtower_estim_id } from '../config/constants';
import { state } from '../state';
import { pageIsWatchtower } from '../utils/page';
import { appendRefinedAttacks, displayEstimationsOnWatchtower, refinedAttackRowHtml } from './watchtower';

/** `getScriptInfo()` est appelée au chargement de modules importés ; jsdom n'a ni `GM_info` ni `browser`/`chrome`. */
vi.mock('../utils/version', async (importOriginal: () => Promise<object>) => ({
    ...await importOriginal(),
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MHO', version: '0.0.0', updateURL: 'about:blank' })
}));
vi.mock('../api/estimations', () => ({ getEstimations: vi.fn(), saveEstimations: vi.fn(), getRefinedAttack: vi.fn() }));
vi.mock('../utils/page', async (importOriginal: () => Promise<object>) => ({ ...await importOriginal(), pageIsWatchtower: vi.fn() }));
const getEstimationsMock: ReturnType<typeof vi.fn> = getEstimations as unknown as ReturnType<typeof vi.fn>;
const pageIsWatchtowerMock: ReturnType<typeof vi.fn> = pageIsWatchtower as unknown as ReturnType<typeof vi.fn>;
const getRefinedAttackMock: ReturnType<typeof vi.fn> = getRefinedAttack as unknown as ReturnType<typeof vi.fn>;
/** Sous-ensemble de `process` (Node) utilisé ici, sans `@types/node` qui typerait `setTimeout` en Node dans tout le programme du build. */
type NodeProcess = { on(event: string, listener: (reason: unknown) => void): void; off(event: string, listener: (reason: unknown) => void): void };
const node_process: NodeProcess = (globalThis as unknown as { process: NodeProcess }).process;

describe('refinedAttackRowHtml', () => {
    it('affiche la plage affinée', () => {
        const html: string = refinedAttackRowHtml({ min: 3736, max: 3757 });
        expect(html).toContain('3736');
        expect(html).toContain('3757');
        expect(html).toContain('refined-attack');
    });

    it('n\'affiche rien sans affinage valide', () => {
        expect(refinedAttackRowHtml(null)).toBe('');
    });
});

describe('appendRefinedAttacks', () => {
    it('garde la plage de la lecture la plus récente même si une lecture plus ancienne répond après', async (): Promise<void> => {
        const container: HTMLElement = document.createElement('div');
        let resolveOlder: (refined: RefinedAttack | null) => void = (): undefined => undefined;
        let resolveNewer: (refined: RefinedAttack | null) => void = (): undefined => undefined;
        getRefinedAttackMock
            .mockReturnValueOnce(new Promise<RefinedAttack | null>((resolve: (refined: RefinedAttack | null) => void): void => {
                resolveOlder = resolve;
            }))
            .mockReturnValueOnce(new Promise<RefinedAttack | null>((resolve: (refined: RefinedAttack | null) => void): void => {
                resolveNewer = resolve;
            }));

        appendRefinedAttacks([{ container, day: 16 }]);
        appendRefinedAttacks([{ container, day: 16 }]);
        resolveNewer({ min: 3740, max: 3750 });
        await Promise.resolve();
        resolveOlder({ min: 3700, max: 3800 });
        await Promise.resolve();

        expect(container.querySelectorAll('.refined-attack').length).toBe(1);
        expect(container.textContent).toContain('3740');
    });
});

describe('displayEstimationsOnWatchtower', () => {
    const estimationsResult: object = {
        estimations: { day: 5, estim: {}, planif: {} },
        today_attack: { result: { min: 1, max: 2 } },
        tomorrow_attack: { result: { min: 3, max: 4 } }
    };

    /** Résout la promesse de getEstimations() en attente. */
    function pendingEstimations(): () => void {
        let resolveEstimations: (value: object) => void = (): undefined => undefined;
        getEstimationsMock.mockReturnValue(new Promise<object>((resolve: (value: object) => void): void => {
            resolveEstimations = resolve;
        }));
        return (): void => resolveEstimations(estimationsResult);
    }

    beforeEach((): void => {
        document.body.innerHTML = '<div id="root"><div class="block watchtower"></div><div class="block"></div><div class="small-note"></div></div>';
        getEstimationsMock.mockReset();
        getRefinedAttackMock.mockReset();
        getRefinedAttackMock.mockResolvedValue(null);
        pageIsWatchtowerMock.mockReset();
        pageIsWatchtowerMock.mockReturnValue(true);
        state.mho_parameters = { display_estimations_on_watchtower: true } as unknown as typeof state.mho_parameters;
        state.mh_user = { townDetails: { townId: 42, day: 5 } } as unknown as typeof state.mh_user;
    });

    it('ne lance qu\'une chaîne de requêtes pour deux appels avant résolution', async (): Promise<void> => {
        const resolve: () => void = pendingEstimations();

        displayEstimationsOnWatchtower();
        displayEstimationsOnWatchtower();
        resolve();
        await new Promise<void>((r: () => void): void => { setTimeout(r, 0); });

        expect(getEstimationsMock).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll(`#${mho_watchtower_estim_id}`).length).toBe(1);
    });

    it('n\'insère aucun bloc si la page est quittée avant la résolution', async (): Promise<void> => {
        const resolve: () => void = pendingEstimations();

        displayEstimationsOnWatchtower();
        pageIsWatchtowerMock.mockReturnValue(false);
        resolve();
        await new Promise<void>((r: () => void): void => { setTimeout(r, 0); });

        expect(document.querySelector(`#${mho_watchtower_estim_id}`)).toBeNull();
    });

    it('n\'insère rien dans une note détachée puis insère au rejeu suivant', async (): Promise<void> => {
        const resolve: () => void = pendingEstimations();

        displayEstimationsOnWatchtower();
        const old_note: Element = document.querySelector('.small-note') as Element;
        const old_parent: Element = old_note.parentElement as Element;
        old_parent.remove();
        resolve();
        await new Promise<void>((r: () => void): void => { setTimeout(r, 0); });

        expect(old_parent.querySelector(`#${mho_watchtower_estim_id}`)).toBeNull();

        document.body.innerHTML = '<div id="root"><div class="block watchtower"></div><div class="block"></div><div class="small-note"></div></div>';
        const resolve_again: () => void = pendingEstimations();
        displayEstimationsOnWatchtower();
        resolve_again();
        await new Promise<void>((r: () => void): void => { setTimeout(r, 0); });

        expect(document.querySelectorAll(`#${mho_watchtower_estim_id}`).length).toBe(1);
    });

    it('n\'émet aucun rejet non intercepté quand getEstimations échoue', async (): Promise<void> => {
        const unhandled: Mock<(reason: unknown) => void> = vi.fn<(reason: unknown) => void>();
        node_process.on('unhandledRejection', unhandled);
        getEstimationsMock.mockReturnValue(Promise.reject(new Error('boom')));

        displayEstimationsOnWatchtower();
        await new Promise<void>((r: () => void): void => { setTimeout(r, 10); });
        node_process.off('unhandledRejection', unhandled);

        expect(unhandled).not.toHaveBeenCalled();
    });

    it('ne lève rien si .block.watchtower est absent', () => {
        document.body.innerHTML = '<div><div class="small-note"></div></div>';

        expect(() => displayEstimationsOnWatchtower()).not.toThrow();
        expect(getEstimationsMock).not.toHaveBeenCalled();
    });
});
