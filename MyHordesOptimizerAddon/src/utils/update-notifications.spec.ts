import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const addWarningMock = vi.fn();
vi.mock('./notifications', () => ({ addWarning: addWarningMock }));

const showChangelogModalMock = vi.fn();
vi.mock('../ui/window', () => ({ showChangelogModal: showChangelogModalMock }));

let stored_version: Record<string, boolean> = {};
vi.mock('./storage', () => ({
    getStorageItem: (): Promise<Record<string, boolean>> => Promise.resolve(stored_version),
    setStorageItem: (_key: string, value: Record<string, boolean>): Promise<void> => {
        stored_version = value;
        return Promise.resolve();
    }
}));

function setupOrigin(origin: 'script' | 'firefox' | 'chrome'): void {
    vi.unstubAllGlobals();
    if (origin === 'script') {
        vi.stubGlobal('GM_info', { script: { version: '2.0.0', name: 'MyHordes Optimizer', updateURL: 'https://example.test/update' } });
    } else if (origin === 'firefox') {
        vi.stubGlobal('browser', { runtime: { getManifest: () => ({ version: '2.0.0', name: 'MyHordes Optimizer' }) } });
    } else {
        vi.stubGlobal('chrome', {
            runtime: {
                getManifest: () => ({ version: '2.0.0', name: 'MyHordes Optimizer' }),
                sendMessage: vi.fn()
            }
        });
    }
}

beforeEach(() => {
    addWarningMock.mockClear();
    showChangelogModalMock.mockClear();
    stored_version = {};
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
});

describe('notifyUpdateAvailable', () => {
    it('shows a toast with a direct link action on script origin', async () => {
        setupOrigin('script');
        const { notifyUpdateAvailable } = await import('./update-notifications');

        notifyUpdateAvailable();

        expect(addWarningMock).toHaveBeenCalledTimes(1);
        expect(addWarningMock.mock.calls[0][1]).toBeInstanceOf(Function);
    });

    it('shows a toast with a direct link action on firefox origin', async () => {
        setupOrigin('firefox');
        const { notifyUpdateAvailable } = await import('./update-notifications');

        notifyUpdateAvailable();

        expect(addWarningMock).toHaveBeenCalledTimes(1);
        expect(addWarningMock.mock.calls[0][1]).toBeInstanceOf(Function);
    });

    it('does not notify twice within the same page load', async () => {
        setupOrigin('chrome');
        const { notifyUpdateAvailable } = await import('./update-notifications');

        notifyUpdateAvailable();
        notifyUpdateAvailable();

        expect(addWarningMock).toHaveBeenCalledTimes(1);
    });
});

describe('checkForUpdateOnChrome', () => {
    it('reports "no_update_yet" when the store has nothing new yet', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = (_message: unknown, callback: (response: { status: string }) => void) => callback({ status: 'no_update' });
        const { checkForUpdateOnChrome } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);

        expect(onResult).toHaveBeenCalledWith('no_update_yet');
    });

    it('reports "ready" when the background signals the update is applied', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = (_message: unknown, callback: (response: { status: string }) => void) => callback({ status: 'ready' });
        const { checkForUpdateOnChrome } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);

        expect(onResult).toHaveBeenCalledWith('ready');
    });

    it('reports "unknown" when the background sends no response (service worker recycled)', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = (_message: unknown, callback: (response?: { status: string }) => void) => callback(undefined);
        const { checkForUpdateOnChrome } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);

        expect(onResult).toHaveBeenCalledWith('unknown');
    });

    it('reports "unknown" after a timeout when the background never answers at all (service worker killed before responding, unlike a synchronous undefined response)', async () => {
        vi.useFakeTimers();
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = vi.fn(); // ne rappelle jamais le callback
        const { checkForUpdateOnChrome, CHECK_FOR_UPDATE_TIMEOUT_MS } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);
        expect(onResult).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(CHECK_FOR_UPDATE_TIMEOUT_MS);

        expect(onResult).toHaveBeenCalledTimes(1);
        expect(onResult).toHaveBeenCalledWith('unknown');
    });

    it('does not report twice when the background answers after the timeout has already fired', async () => {
        vi.useFakeTimers();
        setupOrigin('chrome');
        let late_callback: ((response?: { status: string }) => void) | undefined;
        (globalThis as any).chrome.runtime.sendMessage = vi.fn((_message: unknown, callback: (response?: { status: string }) => void) => {
            late_callback = callback;
        });
        const { checkForUpdateOnChrome, CHECK_FOR_UPDATE_TIMEOUT_MS } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);
        await vi.advanceTimersByTimeAsync(CHECK_FOR_UPDATE_TIMEOUT_MS);
        late_callback?.({ status: 'ready' });

        expect(onResult).toHaveBeenCalledTimes(1);
        expect(onResult).toHaveBeenCalledWith('unknown');
    });

    it('reports "no_update_yet" only when the store explicitly signals no_update', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = (_message: unknown, callback: (response?: { status: string }) => void) => callback({ status: 'no_update' });
        const { checkForUpdateOnChrome } = await import('./update-notifications');
        const onResult = vi.fn();

        checkForUpdateOnChrome(onResult);

        expect(onResult).toHaveBeenCalledWith('no_update_yet');
    });
});

describe('triggerChromeUpdateCheck', () => {
    it('ignores a second call while a check is already in flight', async () => {
        setupOrigin('chrome');
        /** Ne répond jamais : simule une vérification encore en cours */
        (globalThis as any).chrome.runtime.sendMessage = vi.fn();
        const { triggerChromeUpdateCheck } = await import('./update-notifications');

        triggerChromeUpdateCheck();
        triggerChromeUpdateCheck();

        expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('accepts a new call once the previous check has resolved', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = vi.fn((_message: unknown, callback: (response: { status: string }) => void) => callback({ status: 'no_update' }));
        const { triggerChromeUpdateCheck } = await import('./update-notifications');

        triggerChromeUpdateCheck();
        triggerChromeUpdateCheck();

        expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('releases the guard even when the background sends no response (Task 7 not shipped)', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = vi.fn((_message: unknown, callback: (response?: { status: string }) => void) => callback(undefined));
        const { triggerChromeUpdateCheck } = await import('./update-notifications');

        triggerChromeUpdateCheck();
        triggerChromeUpdateCheck();

        expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('releases the guard on timeout when the background never answers at all (real hang, not a synchronous undefined response)', async () => {
        vi.useFakeTimers();
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = vi.fn(); // ne rappelle jamais le callback
        const { triggerChromeUpdateCheck, CHECK_FOR_UPDATE_TIMEOUT_MS } = await import('./update-notifications');

        triggerChromeUpdateCheck();
        await vi.advanceTimersByTimeAsync(CHECK_FOR_UPDATE_TIMEOUT_MS);
        triggerChromeUpdateCheck();

        expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('shows the "unknown" toast when the background sends no response', async () => {
        setupOrigin('chrome');
        (globalThis as any).chrome.runtime.sendMessage = vi.fn((_message: unknown, callback: (response?: { status: string }) => void) => callback(undefined));
        const { triggerChromeUpdateCheck } = await import('./update-notifications');
        const { texts } = await import('../i18n/texts');
        const { getI18N } = await import('./i18n');

        triggerChromeUpdateCheck();

        expect(addWarningMock).toHaveBeenCalledWith(getI18N(texts.update_check_unknown_toast));
    });
});

describe('notifyJustUpdated', () => {
    it('shows a toast when the running version has never been seen', async () => {
        setupOrigin('chrome');
        stored_version = {};
        const { notifyJustUpdated } = await import('./update-notifications');

        notifyJustUpdated(stored_version);

        expect(addWarningMock).toHaveBeenCalledTimes(1);
    });

    it('shows nothing when the running version was already seen', async () => {
        setupOrigin('chrome');
        stored_version = { '2.0.0': true };
        const { notifyJustUpdated } = await import('./update-notifications');

        notifyJustUpdated(stored_version);

        expect(addWarningMock).not.toHaveBeenCalled();
    });
});

describe('openChangelogAndMarkSeen', () => {
    it('opens the changelog modal', async () => {
        setupOrigin('chrome');
        const { openChangelogAndMarkSeen } = await import('./update-notifications');

        openChangelogAndMarkSeen();
        await Promise.resolve();

        expect(showChangelogModalMock).toHaveBeenCalledTimes(1);
    });
});
