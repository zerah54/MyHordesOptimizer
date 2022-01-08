import { Component, OnInit } from '@angular/core';
import { getExternalAppId, getUserId } from 'src/app/shared/utilities/localstorage-utilities';
import { ApiServices } from './_abstract_model/services/api.services';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(private api: ApiServices) {

    }

    public ngOnInit(): void {
        this.checkUserId();
    }

    private checkUserId() {
        let user_id: number | null = getUserId();
        if (!user_id && getExternalAppId()) {
            this.api.getMe();
        }
    }
}
