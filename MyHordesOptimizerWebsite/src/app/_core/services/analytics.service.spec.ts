import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import type { MockedObject } from 'vitest';

import { AnalyticsService } from './analytics.service';
import { FIREBASE_ANALYTICS_SDK, FirebaseAnalyticsSdk } from './firebase-analytics-sdk';

@Component({ selector: 'mho-test-stub', template: '', changeDetection: ChangeDetectionStrategy.OnPush,
             standalone: true })
class StubComponent {
}

describe('AnalyticsService', (): void => {
    let service: AnalyticsService;
    let router: Router;
    let sdk: MockedObject<FirebaseAnalyticsSdk>;
    const fakeApp: FirebaseApp = {} as FirebaseApp;
    const fakeAnalytics: Analytics = { name: 'fake-analytics' } as unknown as Analytics;

    beforeEach((): void => {
        sdk = {
            getAnalytics: vi.fn().mockReturnValue(fakeAnalytics),
            isSupported: vi.fn().mockResolvedValue(true),
            logEvent: vi.fn()
        } as unknown as MockedObject<FirebaseAnalyticsSdk>;

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                provideRouter([{ path: 'wiki/items', component: StubComponent }]),
                { provide: FIREBASE_ANALYTICS_SDK, useValue: sdk }
            ]
        });
        service = TestBed.inject(AnalyticsService);
        router = TestBed.inject(Router);
        TestBed.inject(Title).setTitle('Ma page');
    });

    it('does nothing when logEvent is called before init() resolves', (): void => {
        service.logEvent('custom_event');

        expect(sdk.logEvent).not.toHaveBeenCalled();
    });

    it('does nothing when Analytics is not supported by the environment', async (): Promise<void> => {
        sdk.isSupported.mockResolvedValue(false);

        await service.init(fakeApp);
        service.logEvent('custom_event');

        expect(sdk.getAnalytics).not.toHaveBeenCalled();
        expect(sdk.logEvent).not.toHaveBeenCalled();
    });

    it('resolves without throwing when getAnalytics fails (ex. config Firebase absente), pour ne jamais bloquer le bootstrap via provideAppInitializer', async (): Promise<void> => {
        sdk.getAnalytics.mockImplementation(() => {
            throw new Error('Installations: Missing App configuration value: "projectId"');
        });

        await expect(service.init(fakeApp)).resolves.toBeUndefined();
        service.logEvent('custom_event');

        expect(sdk.logEvent).not.toHaveBeenCalled();
    });

    it('initializes Analytics from the given app once supported', async (): Promise<void> => {
        await service.init(fakeApp);

        expect(sdk.getAnalytics).toHaveBeenCalledWith(fakeApp);
    });

    it('forwards logEvent calls to the underlying Analytics instance once initialized', async (): Promise<void> => {
        await service.init(fakeApp);

        service.logEvent('custom_event', { foo: 'bar' });

        expect(sdk.logEvent).toHaveBeenCalledWith(fakeAnalytics, 'custom_event', { foo: 'bar' });
    });

    it('logs a screen_view event with the route path and page title on navigation', async (): Promise<void> => {
        await service.init(fakeApp);

        await router.navigateByUrl('/wiki/items');

        expect(sdk.logEvent).toHaveBeenCalledWith(fakeAnalytics, 'screen_view', {
            page_path: '/wiki/items',
            page_title: 'Ma page'
        });
    });
});
