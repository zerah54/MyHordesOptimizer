import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ANIMATION_MODULE_TYPE, ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { provideRouter } from '@angular/router';
import type { Mock } from 'vitest';

import { LoadingOverlayService } from './_core/services/loading-overlay.service';
import { AppComponent } from './app.component';
import { HeaderComponent } from './structure/header/header.component';
import { MenuComponent } from './structure/menu/menu.component';

/** Remplace mho-header : évite de tirer AdminService/HeaderService/AuthenticationService réels. */
@Component({ selector: 'mho-header', template: '', changeDetection: ChangeDetectionStrategy.OnPush,
             standalone: true })
class HeaderStubComponent {
    public readonly changeSidenavStatus: OutputEmitterRef<void> = output();
}

/** Remplace mho-menu : évite AdminService/TownContextService/ChartsThemingService réels. */
@Component({ selector: 'mho-menu', template: '', changeDetection: ChangeDetectionStrategy.OnPush,
             standalone: true })
class MenuStubComponent {
    public readonly sidenavContainer: InputSignal<MatSidenavContainer> = input.required();
}

describe('AppComponent', (): void => {
    let fixture: ComponentFixture<AppComponent>;
    let breakpointObserver: BreakpointObserver;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([]), provideHttpClient(withXhr()), provideHttpClientTesting(), { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        })
            .overrideComponent(AppComponent, {
                remove: { imports: [HeaderComponent, MenuComponent] },
                add: { imports: [HeaderStubComponent, MenuStubComponent] }
            })
            .compileComponents();

        breakpointObserver = TestBed.inject(BreakpointObserver);
        vi.useFakeTimers();
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    function create(is_gt_xs: boolean = true): void {
        vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(is_gt_xs);
        fixture = TestBed.createComponent(AppComponent);
    }

    it('shows the router outlet once getMe() resolves (no external app id in test environment)', (): void => {
        create();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    });

    it('renders the sidenav in "side" mode when the gt-xs breakpoint matches', (): void => {
        create(true);
        fixture.detectChanges();

        const sidenav: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav');
        expect(sidenav.classList).toContain('mat-drawer-side');
    });

    it('renders the sidenav in "over" mode when the gt-xs breakpoint does not match', (): void => {
        create(false);
        fixture.detectChanges();

        const sidenav: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav');
        expect(sidenav.classList).toContain('mat-drawer-over');
    });

    it('switches the sidenav mode when the window is resized (HostListener migrated to host binding)', (): void => {
        create(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-side');

        (breakpointObserver.isMatched as Mock).mockReturnValue(false);
        window.dispatchEvent(new Event('resize'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-over');
    });

    it('shows the loading overlay once LoadingOverlayService reports loading past the debounce delay', async (): Promise<void> => {
        create();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.mho-loading')).toBeNull();

        TestBed.inject(LoadingOverlayService).setLoading(true);
        await vi.advanceTimersByTimeAsync(200);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-loading')).not.toBeNull();

        TestBed.inject(LoadingOverlayService).setLoading(false);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-loading')).toBeNull();
    });
});
