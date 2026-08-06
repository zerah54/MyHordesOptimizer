import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJsonp } from './jsonp';

describe('fetchJsonp', () => {
    afterEach(() => {
        document.head.querySelectorAll('script').forEach((script: HTMLScriptElement) => script.remove());
        vi.useRealTimers();
    });

    it('injects a <script> tag with a callback param appended to the URL', () => {
        fetchJsonp('https://example.com/oembed?url=x');

        const script: HTMLScriptElement | null = document.head.querySelector('script');
        expect(script).not.toBeNull();
        expect(script?.src).toMatch(/^https:\/\/example\.com\/oembed\?url=x&callback=mho_jsonp_\d+$/);
    });

    it('resolves with the payload passed to the generated callback, and cleans up', async () => {
        const promise: Promise<unknown> = fetchJsonp('https://example.com/oembed?url=x');
        const script: HTMLScriptElement = document.head.querySelector('script') as HTMLScriptElement;
        const callback_name: string = new URL(script.src).searchParams.get('callback') as string;

        (window as unknown as Record<string, (data: unknown) => void>)[callback_name]({ thumbnail_url: 'https://x' });

        await expect(promise).resolves.toEqual({ thumbnail_url: 'https://x' });
        expect(document.head.querySelector('script')).toBeNull();
        expect(callback_name in window).toBe(false);
    });

    it('resolves with undefined after the timeout if the callback never fires', async () => {
        vi.useFakeTimers();
        const promise: Promise<unknown> = fetchJsonp('https://example.com/oembed?url=x', 5000);

        await vi.advanceTimersByTimeAsync(5000);

        await expect(promise).resolves.toBeUndefined();
        expect(document.head.querySelector('script')).toBeNull();
    });

    it('resolves with undefined if the script fails to load (network error)', () => {
        const promise: Promise<unknown> = fetchJsonp('https://example.com/oembed?url=x');
        const script: HTMLScriptElement = document.head.querySelector('script') as HTMLScriptElement;

        script.dispatchEvent(new Event('error'));

        return expect(promise).resolves.toBeUndefined();
    });

    it('appends the callback param with & when the URL already has a query string, ? otherwise', () => {
        fetchJsonp('https://example.com/oembed');

        const script: HTMLScriptElement | null = document.head.querySelector('script');
        expect(script?.src).toMatch(/^https:\/\/example\.com\/oembed\?callback=mho_jsonp_\d+$/);
    });
});
