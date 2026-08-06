import { describe, expect, it } from 'vitest';

import { isConflictingDoubleInstall } from './double-install-conflict';

describe('isConflictingDoubleInstall', () => {
    it('returns false when no marker is present yet (first instance on the page)', () => {
        expect(isConflictingDoubleInstall(null, 'script')).toBe(false);
    });

    it('returns false when the existing marker matches the current origin (self re-injection: update, tab wake)', () => {
        expect(isConflictingDoubleInstall('script', 'script')).toBe(false);
    });

    it('returns true when the existing marker is a different origin (real Tampermonkey + extension conflict)', () => {
        expect(isConflictingDoubleInstall('script', 'chrome')).toBe(true);
    });

    it('returns true when a chrome extension marker is found and the current origin is firefox', () => {
        expect(isConflictingDoubleInstall('chrome', 'firefox')).toBe(true);
    });
});
