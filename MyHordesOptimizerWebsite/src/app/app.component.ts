import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, HostListener, inject, LOCALE_ID, OnInit, Signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { Event, NavigationCancel, NavigationEnd, NavigationSkipped, NavigationStart, Router, RouterOutlet } from '@angular/router';
import moment from 'moment';
import { filter } from 'rxjs';

import { BREAKPOINTS } from './_abstract_model/const';
import { AuthenticationService } from './_abstract_model/services/authentication.service';
import { Imports } from './_abstract_model/types/_types';
import { LoadingOverlayService } from './_core/services/loading-overlay.service';
import { FooterComponent } from './structure/footer/footer.component';
import { HeaderComponent } from './structure/header/header.component';
import { MenuComponent } from './structure/menu/menu.component';

const angular_common: Imports = [CommonModule, NgOptimizedImage, RouterOutlet];
const components: Imports = [FooterComponent, HeaderComponent, MenuComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatProgressSpinnerModule, MatSidenavModule];

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AppComponent implements OnInit {
    private router: Router = inject(Router);
    private overlay_container: OverlayContainer = inject(OverlayContainer);
    private breakpoint_observer: BreakpointObserver = inject(BreakpointObserver);
    private locale_id: string = inject(LOCALE_ID);


    protected readonly sidenav_container: Signal<MatSidenavContainer> = viewChild.required<MatSidenavContainer>('sidenavContainer');

    protected is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    protected is_loading: boolean = false;
    protected ready: boolean = false;
    protected readonly theme: string | null = localStorage.getItem('theme');

    private loading_service: LoadingOverlayService = inject(LoadingOverlayService);
    private authentication_api: AuthenticationService = inject(AuthenticationService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    constructor() {
        moment.locale(this.locale_id);
    }

    public ngOnInit(): void {

        this.loading_service.is_loading_obs
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (is_loading: boolean) => {
                    this.is_loading = is_loading;
                }
            });

        this.router.events.subscribe(() => {
            if (!this.is_gt_xs) {
                this.sidenav_container().close();
            }
        });

        if (this.theme) {
            this.overlay_container.getContainerElement().classList.add(this.theme);
        }
        this.loaderOnRouting();

        this.authentication_api.getMe()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: () => {
                    this.ready = true;
                },
                error: () => {
                    this.ready = true;
                },
                complete: () => {
                    this.ready = true;
                }
            });
    }

    private loaderOnRouting(): void {
        this.router.events
            .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationSkipped), takeUntilDestroyed(this.destroy_ref))
            .subscribe((event: Event) => {
                this.loading_service.setLoading(event instanceof NavigationStart);
            });
    }
}
