import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, HostBinding, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationSkipped, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { BREAKPOINTS } from './_abstract_model/const';
import { AuthenticationService } from './_abstract_model/services/authentication.service';
import { AutoDestroy } from './shared/decorators/autodestroy.decorator';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FooterComponent } from './structure/footer/footer.component';
import { MatCardModule } from '@angular/material/card';
import { MenuComponent } from './structure/menu/menu.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderComponent } from './structure/header/header.component';
import { NgClass, NgIf, NgFor, NgOptimizedImage, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [NgClass, HeaderComponent, NgIf, NgFor, NgOptimizedImage, MatSidenavModule, MenuComponent, MatCardModule, RouterOutlet, FooterComponent, NgSwitch, NgSwitchCase, NgSwitchDefault, MatProgressSpinnerModule]
})
export class AppComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    public is_loading: boolean = false;
    public ready: boolean = false;
    public readonly theme: string | null = localStorage.getItem('theme');

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    constructor(public loading_service: LoadingOverlayService, private authentication_api: AuthenticationService,
                private router: Router, private overlay_container: OverlayContainer,
                private breakpoint_observer: BreakpointObserver) {
    }

    public ngOnInit(): void {

        this.loading_service.is_loading_obs
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((is_loading: boolean) => {
                this.is_loading = is_loading;
            });

        if (this.theme) {
            this.overlay_container.getContainerElement().classList.add(this.theme);
        }
        this.loaderOnRouting();

        this.authentication_api.getMe()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.ready = true;
            });
    }

    private loaderOnRouting(): void {
        this.router.events
            .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationSkipped), takeUntil(this.destroy_sub))
            .subscribe((event: Event) => {
                this.loading_service.setLoading(event instanceof NavigationStart);
            });
    }
}
