import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CommonModule, isPlatformBrowser, NgClass, NgOptimizedImage } from '@angular/common';
import {
    Component,
    HostBinding,
    HostListener,
    inject,
    Inject,
    LOCALE_ID,
    OnInit,
    PLATFORM_ID,
    signal,
    ViewChild,
    ViewEncapsulation,
    WritableSignal
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavContainer, MatSidenavModule } from '@angular/material/sidenav';
import { Event, NavigationCancel, NavigationEnd, NavigationSkipped, NavigationStart, Router, RouterOutlet } from '@angular/router';
import moment from 'moment/moment';
import { BehaviorSubject, filter, Subject, takeUntil } from 'rxjs';
import { BREAKPOINTS } from './_abstract_model/const';
import { Theme } from './_abstract_model/interfaces';
import { AuthenticationService } from './_abstract_model/services/authentication.service';
import { Imports } from './_abstract_model/types/_types';
import { AutoDestroy } from './shared/decorators/autodestroy.decorator';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { LocalStorageService } from './shared/services/localstorage.service';
import { FooterComponent } from './structure/footer/footer.component';
import { HeaderComponent } from './structure/header/header.component';
import { MenuComponent } from './structure/menu/menu.component';
import 'moment/min/locales';

const angular_common: Imports = [CommonModule, NgClass, NgOptimizedImage, RouterOutlet];
const components: Imports = [FooterComponent, HeaderComponent, MenuComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatProgressSpinnerModule, MatSidenavModule];

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AppComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('sidenavContainer') sidenav_container!: MatSidenavContainer;

    static isBrowser: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public local_storage: LocalStorageService = inject(LocalStorageService);

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    public is_loading: boolean = false;
    public ready: boolean = false;
    public theme: WritableSignal<Theme | undefined> = signal(undefined);

    private platform_id: object = inject(PLATFORM_ID);

    private loading_service: LoadingOverlayService = inject(LoadingOverlayService);
    private authentication_api: AuthenticationService = inject(AuthenticationService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    constructor(private router: Router, private overlay_container: OverlayContainer, private breakpoint_observer: BreakpointObserver,
                @Inject(LOCALE_ID) private locale_id: string) {
        moment.updateLocale(this.locale_id, {});
        AppComponent.isBrowser.next(isPlatformBrowser(this.platform_id));
    }

    public ngOnInit(): void {

        this.loading_service.is_loading_obs
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (is_loading: boolean) => {
                    this.is_loading = is_loading;
                }
            });

        this.router.events.subscribe(() => {
            if (!this.is_gt_xs) {
                this.sidenav_container.close();
            }
        });

        this.changeTheme(this.theme());

        this.loaderOnRouting();

        this.authentication_api.getMe()
            .pipe(takeUntil(this.destroy_sub))
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

    protected changeTheme(theme: Theme | undefined): void {
        if (theme) {
            if (this.overlay_container.getContainerElement().classList.contains(this.theme()?.class ?? '')) {
                this.overlay_container.getContainerElement().classList.remove(this.theme()?.class ?? '');
            }
            if (theme.class !== '') {
                this.overlay_container.getContainerElement().classList.add(theme.class);
            }
            this.theme.set({ ...theme });
        }
    }

    private loaderOnRouting(): void {
        this.router.events
            .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationSkipped), takeUntil(this.destroy_sub))
            .subscribe((event: Event) => {
                this.loading_service.setLoading(event instanceof NavigationStart);
            });
    }
}
