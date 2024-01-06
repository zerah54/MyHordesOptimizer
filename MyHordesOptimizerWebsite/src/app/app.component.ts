import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, HostListener, inject, Inject, LOCALE_ID, OnInit, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Event, NavigationCancel, NavigationEnd, NavigationSkipped, NavigationStart, Router, RouterOutlet } from '@angular/router';
import * as moment from 'moment/moment';
import { filter, Subject, takeUntil } from 'rxjs';
import { BREAKPOINTS } from './_abstract_model/const';
import { AuthenticationService } from './_abstract_model/services/authentication.service';
import { AutoDestroy } from './shared/decorators/autodestroy.decorator';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { FooterComponent } from './structure/footer/footer.component';
import { HeaderComponent } from './structure/header/header.component';
import { MenuComponent } from './structure/menu/menu.component';

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [NgClass, HeaderComponent, CommonModule, NgOptimizedImage, MatSidenavModule, MenuComponent, MatCardModule, RouterOutlet, FooterComponent, MatProgressSpinnerModule]
})
export class AppComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    public is_loading: boolean = false;
    public ready: boolean = false;
    public readonly theme: string | null = localStorage.getItem('theme');

    private loading_service: LoadingOverlayService = inject(LoadingOverlayService);
    private authentication_api: AuthenticationService = inject(AuthenticationService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    constructor(private router: Router, private overlay_container: OverlayContainer, private breakpoint_observer: BreakpointObserver, @Inject(LOCALE_ID) private locale_id: string) {
        moment.locale(this.locale_id);
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
