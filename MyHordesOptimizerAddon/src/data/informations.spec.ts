import { afterEach, describe, expect, it, vi } from 'vitest';

const openChangelogAndMarkSeenMock = vi.fn();
const triggerChromeUpdateCheckMock = vi.fn();
vi.mock('../utils/update-notifications', () => ({
    openChangelogAndMarkSeen: openChangelogAndMarkSeenMock,
    triggerChromeUpdateCheck: triggerChromeUpdateCheckMock
}));

function setupOrigin(origin: 'script' | 'firefox' | 'chrome'): void {
    vi.unstubAllGlobals();
    if (origin === 'script') {
        vi.stubGlobal('GM_info', { script: { version: '1.0.0', name: 'MyHordes Optimizer', updateURL: 'https://example.test/update' } });
    } else if (origin === 'firefox') {
        vi.stubGlobal('browser', { runtime: { getManifest: () => ({ version: '1.0.0', name: 'MyHordes Optimizer' }) } });
    } else {
        vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: '1.0.0', name: 'MyHordes Optimizer' }) } });
    }
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe('informations — entrée "version"', () => {
    it('delegates to openChangelogAndMarkSeen on click', async () => {
        setupOrigin('script');
        const { informations } = await import('./informations');

        informations.find((info) => info.id === 'version').action();

        expect(openChangelogAndMarkSeenMock).toHaveBeenCalledTimes(1);
    });
});

describe('informations — entrée "update"', () => {
    it('has a direct src link and no action on script origin', async () => {
        setupOrigin('script');
        const { informations } = await import('./informations');
        const entry = informations.find((info) => info.id === 'update');

        expect(entry.src).toBe('https://example.test/update');
        expect(entry.action).toBeUndefined();
    });

    it('has no src but a checkForUpdate action on chrome origin', async () => {
        setupOrigin('chrome');
        const { informations } = await import('./informations');
        const entry = informations.find((info) => info.id === 'update');

        expect(entry.src).toBeUndefined();
        entry.action();

        expect(triggerChromeUpdateCheckMock).toHaveBeenCalledTimes(1);
    });

    it('links to the AMO page and has no action on firefox origin', async () => {
        setupOrigin('firefox');
        const { informations } = await import('./informations');
        const entry = informations.find((info) => info.id === 'update');

        expect(entry.src).toContain('addons.mozilla.org');
        expect(entry.action).toBeUndefined();
    });
});
