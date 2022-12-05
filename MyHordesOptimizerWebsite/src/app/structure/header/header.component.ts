import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatToolbar } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { getExternalAppId, setExternalAppId } from 'src/app/shared/utilities/localstorage.util';
import { ApiServices } from '../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    @Output() changeSidenavStatus: EventEmitter<void> = new EventEmitter();

    /** Le titre de l'application */
    public title: string = '';

    /** La valeur du champ d'identifiant d'app externe */
    public external_app_id_field_value: string | null = getExternalAppId();
    /** L'idendifiant d'app externe si il existe */
    public saved_external_app_id: string | null = getExternalAppId();

    public constructor(public media: MediaObserver, private title_service: Title, private api: ApiServices) {
        this.title = this.title_service.getTitle();
    }

    /** Enregistre le nouvel id d'app externe */
    public saveExternalAppId() {
        setExternalAppId(this.external_app_id_field_value);
        this.saved_external_app_id = getExternalAppId();
        this.api.getMe();
    }

    /** Mise à jour des outils externes */
    public updateExternalTools() {
        this.api.updateExternalTools();
    }
}
