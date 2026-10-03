import { describe, expect, it, vi } from 'vitest';

import type { RefinedAttack } from '../api/estimations';
import { getRefinedAttack } from '../api/estimations';
import { appendRefinedAttacks, refinedAttackRowHtml } from './watchtower';

/** `getScriptInfo()` est appelée au chargement de modules importés ; jsdom n'a ni `GM_info` ni `browser`/`chrome`. */
vi.mock('../utils/version', async (importOriginal: () => Promise<object>) => ({
    ...await importOriginal(),
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MHO', version: '0.0.0', updateURL: 'about:blank' })
}));
vi.mock('../api/estimations', () => ({ getEstimations: vi.fn(), saveEstimations: vi.fn(), getRefinedAttack: vi.fn() }));
const getRefinedAttackMock: ReturnType<typeof vi.fn> = getRefinedAttack as unknown as ReturnType<typeof vi.fn>;

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
