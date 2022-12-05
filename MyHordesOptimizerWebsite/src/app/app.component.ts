import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { Event, NavigationEnd, NavigationStart, Router } from '@angular/router';
import * as moment from 'moment';
import { filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { ApiServices } from './_abstract_model/services/api.services';

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    @ViewChild(NavbarComponent) navbar!: NavbarComponent;
    
    public readonly theme: string | null = localStorage.getItem('theme');

    constructor(public loading_service: LoadingOverlayService, private api: ApiServices, private router: Router,
        @Inject(LOCALE_ID) private locale_id: string, private overlay_container: OverlayContainer) {

    }

    public ngOnInit(): void {
        moment.locale(this.locale_id);

        if (this.theme) {
            this.overlay_container.getContainerElement().classList.add(this.theme);
        }
        this.loaderOnRouting();
        this.api.getMe();
    }

    /** Mise à jour des outils externes */
    public updateExternalTools() {
        this.api.updateExternalTools();
    }

    private loaderOnRouting(): void {
        this.router.events
            .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd))
            .subscribe((event: Event) => {
                this.loading_service.setLoading(event instanceof NavigationStart ? true : false);
            })
    }
}
