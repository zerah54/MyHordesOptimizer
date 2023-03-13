import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';
import { Event, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { getAnalytics } from 'firebase/analytics';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { filter, Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AutoDestroy } from './shared/decorators/autodestroy.decorator';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { BREAKPOINTS } from './_abstract_model/const';
import { ApiServices } from './_abstract_model/services/api.services';

// Initialize Firebase
const app: FirebaseApp | undefined = environment.production ? initializeApp(environment.firebase_config) : undefined;
// Initialize Analytics and get a reference to the service
const analytics: Analytics | undefined = app ? getAnalytics(app) : undefined;

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
    @HostListener('window:resize', ['$event'])
    onResize() {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    public is_loading: boolean = false;

    public readonly theme: string | null = localStorage.getItem('theme');

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(public loading_service: LoadingOverlayService, private api: ApiServices, private router: Router,
        private overlay_container: OverlayContainer, private breakpoint_observer: BreakpointObserver) {
    }

    public ngOnInit(): void {

        if (this.theme) {
            this.overlay_container.getContainerElement().classList.add(this.theme);
        }
        this.loaderOnRouting();
        this.api.getMe()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe();

        this.loading_service.is_loading_obs
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((is_loading: boolean) => {
                this.is_loading = is_loading;
            })
    }

    private loaderOnRouting(): void {
        this.router.events
            .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd), takeUntil(this.destroy_sub))
            .subscribe((event: Event) => {
                this.loading_service.setLoading(event instanceof NavigationStart ? true : false);
            })
    }
}
