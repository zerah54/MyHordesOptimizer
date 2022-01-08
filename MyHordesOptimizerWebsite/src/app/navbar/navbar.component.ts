import { ApiServices } from './../_abstract_model/services/api.services';
import { getExternalAppId, setExternalAppId } from 'src/app/shared/utilities/localstorage-utilities';
import { Component, ViewChild } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'mho-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
    @ViewChild(MatToolbar) mat_toolbar!: MatToolbar;

    /** Le titre de l'application */
    public title: string = '';

    /** La valeur du champ d'identifiant d'app externe */
    public external_app_id_field_value: string | null = getExternalAppId();
    /** L'idendifiant d'app externe si il existe */
    public saved_external_app_id: string | null = getExternalAppId();

    /** La liste des onglets à afficher */
    public tabs: Tabs[] = [
        { label: 'Script', url: 'script' },
        { label: 'Wiki', url: 'wiki' }
    ]

    public constructor(private title_service: Title, private api: ApiServices) {
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

/** Les informations d'un onglet */
interface Tabs {
    label: string;
    url: string;
}
