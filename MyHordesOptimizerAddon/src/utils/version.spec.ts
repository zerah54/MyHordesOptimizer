import { afterEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { getErrorFromApi, isScriptVersionLastVersion } from './version';

afterEach(() => {
    vi.unstubAllGlobals();
    state.parameters = undefined;
});

describe('isScriptVersionLastVersion', () => {
    it('compares versions on Chrome origin instead of always returning true', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '1.0.0', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '2.0.0' }];

        expect(isScriptVersionLastVersion()).toBe(false);
    });

    it('returns true on Chrome origin when the running version is current', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '2.0.0', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '2.0.0' }];

        expect(isScriptVersionLastVersion()).toBe(true);
    });

    it('compares version parts numerically, not lexicographically', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '1.1.9', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '1.1.54' }];

        expect(isScriptVersionLastVersion()).toBe(false);
    });

    it('returns true when a higher major version compensates a lower minor version', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '2.0.0', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '1.9.9' }];

        expect(isScriptVersionLastVersion()).toBe(true);
    });

    it('returns true when a higher minor version compensates a reset patch', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '1.6.0', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '1.5.23' }];

        expect(isScriptVersionLastVersion()).toBe(true);
    });

    it('still returns false when the running version is genuinely behind', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '1.5.23', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '1.6.0' }];

        expect(isScriptVersionLastVersion()).toBe(false);
    });
});

describe('getErrorFromApi', () => {
    it('links directly to updateURL on script origin when the version is outdated', () => {
        vi.stubGlobal('GM_info', { script: { version: '1.0.0', name: 'MyHordes Optimizer', updateURL: 'https://example.test/script.user.js' } });
        state.parameters = [{ name: 'ScriptVersion', value: '2.0.0' }];

        const html: string = getErrorFromApi({ name: 'Error', status: 500 } as unknown as Error);

        expect(html).toContain('https://example.test/script.user.js');
    });

    it('never renders an "undefined" link on chrome origin when the version is outdated', () => {
        vi.stubGlobal('chrome', {
            runtime: { getManifest: () => ({ version: '1.0.0', name: 'MyHordes Optimizer' }) }
        });
        state.parameters = [{ name: 'ScriptVersion', value: '2.0.0' }];

        const html: string = getErrorFromApi({ name: 'Error', status: 500 } as unknown as Error);

        expect(html).not.toContain('href="undefined"');
    });
});
