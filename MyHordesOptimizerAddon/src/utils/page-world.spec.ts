import { afterEach, describe, expect, it, vi } from 'vitest';

import { toPageWorld } from './page-world';

describe('toPageWorld', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('clones the value into the page window when cloneInto exists (Firefox content script)', () => {
        const cloned: object = { cloned: true };
        const clone_into: ReturnType<typeof vi.fn> = vi.fn(() => cloned);
        vi.stubGlobal('cloneInto', clone_into);
        const value: { html: string } = { html: 'x' };

        expect(toPageWorld(value)).toBe(cloned);
        expect(clone_into).toHaveBeenCalledWith(value, document.defaultView);
    });

    it('returns the value unchanged when cloneInto does not exist', () => {
        const value: { html: string } = { html: 'x' };

        expect(toPageWorld(value)).toBe(value);
    });
});
