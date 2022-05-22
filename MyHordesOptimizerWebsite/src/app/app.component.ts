import { Event, NavigationEnd, NavigationStart, Router, RouterEvent } from '@angular/router';
import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { getExternalAppId, getUserId } from 'src/app/shared/utilities/localstorage.util';
import { NavbarComponent } from './navbar/navbar.component';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { ApiServices } from './_abstract_model/services/api.services';
import { filter } from 'rxjs';

@Component({
    selector: 'mho-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    @ViewChild(NavbarComponent) navbar!: NavbarComponent;

    constructor(public loading_service: LoadingOverlayService, private api: ApiServices, private router: Router,
        @Inject(LOCALE_ID) private locale_id: string) {

    }

    public ngOnInit(): void {
        moment.locale(this.locale_id);
        this.loaderOnRouting();
        this.checkUserId();
    }

    private checkUserId(): void {
        let user_id: number | null = getUserId();
        if (!user_id && getExternalAppId()) {
            this.api.getMe();
        }
    }

    private loaderOnRouting(): void {
        this.router.events
        .pipe(filter((event: Event) => event instanceof NavigationStart || event instanceof NavigationEnd))
        .subscribe((event: Event) => {
            this.loading_service.setLoading(event instanceof NavigationStart ? true : false);
        })
    }
}
