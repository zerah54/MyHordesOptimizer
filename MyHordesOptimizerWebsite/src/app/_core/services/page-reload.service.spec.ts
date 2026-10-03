import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouteReuseStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { PageReloadService, ReloadableRouteReuseStrategy } from './page-reload.service';

let created: number = 0;

@Component({ selector: 'mho-test-page', template: '' })
class TestPageComponent {
    public constructor() {
        created++;
    }
}

describe('PageReloadService', (): void => {
    beforeEach((): void => {
        created = 0;
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'page', component: TestPageComponent }]),
                { provide: RouteReuseStrategy, useExisting: ReloadableRouteReuseStrategy }
            ]
        });
    });

    it('recreates the displayed page on the same URL, and only when asked', async (): Promise<void> => {
        const harness: RouterTestingHarness = await RouterTestingHarness.create();
        await harness.navigateByUrl('/page?x=1', TestPageComponent);
        expect(created).toBe(1);

        await TestBed.inject(PageReloadService).reloadCurrentPage();

        expect(TestBed.inject(Router).url).toBe('/page?x=1');
        expect(created).toBe(2);

        // Une navigation ordinaire vers la même page réutilise de nouveau le composant
        await TestBed.inject(Router).navigateByUrl('/page?x=1', { onSameUrlNavigation: 'reload' });
        expect(created).toBe(2);
    });
});
