import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import type { MockInstance } from 'vitest';

import { currentDeepLinkId, deepLinkTargets, linkedDay, parseDeepLinkId, replaceDeepLinkParams } from './deep-link.util';

describe('deep-link.util', (): void => {
    describe('parseDeepLinkId', (): void => {
        it('reads an integer identifier', (): void => {
            expect(parseDeepLinkId('42')).toBe(42);
            expect(parseDeepLinkId('-1')).toBe(-1);
        });

        it('rejects a missing, blank or non-integer value', (): void => {
            expect(parseDeepLinkId(null)).toBeNull();
            expect(parseDeepLinkId(undefined)).toBeNull();
            expect(parseDeepLinkId(' ')).toBeNull();
            expect(parseDeepLinkId('abc')).toBeNull();
            expect(parseDeepLinkId('4.2')).toBeNull();
        });
    });

    describe('currentDeepLinkId', (): void => {
        it('reads the parameter of the current URL', async (): Promise<void> => {
            TestBed.configureTestingModule({ providers: [provideRouter([])] });
            const router: Router = TestBed.inject(Router);
            await router.navigateByUrl('/?day=24&plan=abc');

            expect(currentDeepLinkId(router, 'day')).toBe(24);
            expect(currentDeepLinkId(router, 'plan')).toBeNull();
            expect(currentDeepLinkId(router, 'item')).toBeNull();
        });
    });

    describe('linkedDay', (): void => {
        it('reads a day from the first one, ignores the others', async (): Promise<void> => {
            TestBed.configureTestingModule({ providers: [provideRouter([])] });
            const router: Router = TestBed.inject(Router);

            await router.navigateByUrl('/?day=3');
            expect(linkedDay(router)).toBe(3);
            await router.navigateByUrl('/?day=0');
            expect(linkedDay(router)).toBeNull();
            await router.navigateByUrl('/');
            expect(linkedDay(router)).toBeNull();
        });
    });

    describe('replaceDeepLinkParams', (): void => {
        it('writes the parameters into the current URL, keeps the others, removes the null ones', async (): Promise<void> => {
            TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'page', children: [] }])] });
            const router: Router = TestBed.inject(Router);
            await router.navigateByUrl('/page?plan=3&tab=x');

            replaceDeepLinkParams(router, { day: 12, plan: null });
            await Promise.resolve();
            await new Promise<void>((resolve: () => void): void => {
                setTimeout(resolve);
            });

            expect(router.url).toBe('/page?tab=x&day=12');
        });

        it('does nothing when the URL already carries the values', async (): Promise<void> => {
            TestBed.configureTestingModule({ providers: [provideRouter([])] });
            const router: Router = TestBed.inject(Router);
            await router.navigateByUrl('/?day=12');
            const navigate: MockInstance = vi.spyOn(router, 'navigateByUrl');

            replaceDeepLinkParams(router, { day: 12, plan: null });

            expect(navigate).not.toHaveBeenCalled();
        });
    });

    describe('deepLinkTargets', (): void => {
        let router: Router;
        let targets: number[];
        let subscription: Subscription;

        beforeEach((): void => {
            TestBed.configureTestingModule({ providers: [provideRouter([])] });
            router = TestBed.inject(Router);
            targets = [];
        });

        afterEach((): void => {
            subscription?.unsubscribe();
        });

        it('emits the target already in the URL when subscribing', async (): Promise<void> => {
            await router.navigateByUrl('/?item=7');

            subscription = deepLinkTargets(router, 'item').subscribe((id: number): number => targets.push(id));

            expect(targets).toEqual([7]);
        });

        it('emits again at every navigation, the same link followed twice included', async (): Promise<void> => {
            subscription = deepLinkTargets(router, 'item').subscribe((id: number): number => targets.push(id));

            await router.navigateByUrl('/?item=7');
            await router.navigateByUrl('/?item=7', { onSameUrlNavigation: 'reload' });
            await router.navigateByUrl('/?item=8');

            expect(targets).toEqual([7, 7, 8]);
        });

        it('ignores navigations without the parameter or with another one', async (): Promise<void> => {
            subscription = deepLinkTargets(router, 'item').subscribe((id: number): number => targets.push(id));

            await router.navigateByUrl('/?building=3');
            await router.navigateByUrl('/?item=oops');

            expect(targets).toEqual([]);
        });
    });
});
