import { BreakpointObserver } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { LoadingOverlayService } from './_core/services/loading-overlay.service';
import { AppComponent } from './app.component';
import { FooterComponent } from './structure/footer/footer.component';
import { HeaderComponent } from './structure/header/header.component';
import { MenuComponent } from './structure/menu/menu.component';

/** Remplace mho-header : évite de tirer AdminService/HeaderService/AuthenticationService réels. */
@Component({ selector: 'mho-header', template: '', standalone: true })
class HeaderStubComponent {
    public readonly changeSidenavStatus: OutputEmitterRef<void> = output();
}

/** Remplace mho-footer : évite MatDialog réel. */
@Component({ selector: 'mho-footer', template: '', standalone: true })
class FooterStubComponent {
}

/** Remplace mho-menu : évite AdminService/TownContextService/ChartsThemingService réels. */
@Component({ selector: 'mho-menu', template: '', standalone: true })
class MenuStubComponent {
    public readonly sidenavContainer: InputSignal<MatSidenavContainer> = input.required();
}

describe('AppComponent', (): void => {
    let fixture: ComponentFixture<AppComponent>;
    let breakpointObserver: BreakpointObserver;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        })
            .overrideComponent(AppComponent, {
                remove: { imports: [HeaderComponent, FooterComponent, MenuComponent] },
                add: { imports: [HeaderStubComponent, FooterStubComponent, MenuStubComponent] }
            })
            .compileComponents();

        breakpointObserver = TestBed.inject(BreakpointObserver);
    });

    function create(is_gt_xs: boolean = true): void {
        spyOn(breakpointObserver, 'isMatched').and.returnValue(is_gt_xs);
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

        (breakpointObserver.isMatched as jasmine.Spy).and.returnValue(false);
        window.dispatchEvent(new Event('resize'));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mat-sidenav').classList).toContain('mat-drawer-over');
    });

    it('shows the loading overlay once LoadingOverlayService reports loading past the debounce delay', fakeAsync((): void => {
        create();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.mho-loading')).toBeNull();

        TestBed.inject(LoadingOverlayService).setLoading(true);
        tick(200);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-loading')).not.toBeNull();

        TestBed.inject(LoadingOverlayService).setLoading(false);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.mho-loading')).toBeNull();
    }));
});
