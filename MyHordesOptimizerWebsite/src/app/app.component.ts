import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { getExternalAppId, getUserId } from 'src/app/shared/utilities/localstorage.util';
import { NavbarComponent } from './navbar/navbar.component';
import { LoadingOverlayService } from './shared/services/loading-overlay.service';
import { ApiServices } from './_abstract_model/services/api.services';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    @ViewChild(NavbarComponent) navbar!: NavbarComponent;

    constructor(public loading_service: LoadingOverlayService, private api: ApiServices) {

    }

    public ngOnInit(): void {
        moment.locale(navigator.language);
        this.checkUserId();
    }

    private checkUserId() {
        let user_id: number | null = getUserId();
        if (!user_id && getExternalAppId()) {
            this.api.getMe();
        }
    }
}
