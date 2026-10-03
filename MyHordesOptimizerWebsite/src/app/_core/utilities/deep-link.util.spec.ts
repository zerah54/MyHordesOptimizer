import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { deepLinkTargets, parseDeepLinkId } from './deep-link.util';

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
