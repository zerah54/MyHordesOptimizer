import { afterEach, describe, expect, it, vi } from 'vitest';

import { addWarning } from './notifications';

vi.mock('./version', () => ({
    getScriptInfo: (): { name: string } => ({ name: 'MyHordes Optimizer' }),
    getErrorFromApi: (error: unknown): unknown => error
}));

function setupNotificationsContainer(): HTMLElement {
    const container: HTMLDivElement = document.createElement('div');
    container.id = 'notifications';
    document.body.appendChild(container);
    return container;
}

describe('addWarning', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });
    it('calls onClick then removes the notification when clicked, if onClick is provided', () => {
        const container: HTMLElement = setupNotificationsContainer();
        const onClick = vi.fn();

        addWarning('test message', onClick);
        const notification: HTMLElement = container.querySelector('.warning') as HTMLElement;
        notification.click();

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.warning')).toBeNull();
    });

    it('removes the notification when clicked, without error, when onClick is omitted', () => {
        const container: HTMLElement = setupNotificationsContainer();

        addWarning('test message');
        const notification: HTMLElement = container.querySelector('.warning') as HTMLElement;

        expect(() => notification.click()).not.toThrow();
        expect(container.querySelector('.warning')).toBeNull();
    });

    it('does not auto-dismiss after 5 seconds when onClick is provided', () => {
        vi.useFakeTimers();
        const container: HTMLElement = setupNotificationsContainer();

        addWarning('test message', vi.fn());
        vi.advanceTimersByTime(5000);

        expect(container.querySelector('.warning')).not.toBeNull();
        vi.useRealTimers();
    });

    it('auto-dismisses after 5 seconds when onClick is omitted', () => {
        vi.useFakeTimers();
        const container: HTMLElement = setupNotificationsContainer();

        addWarning('test message');
        vi.advanceTimersByTime(5000);

        expect(container.querySelector('.warning')).toBeNull();
        vi.useRealTimers();
    });
});
