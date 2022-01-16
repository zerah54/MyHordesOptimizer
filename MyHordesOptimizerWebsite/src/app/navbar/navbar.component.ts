import { SidenavService } from './../shared/services/sidenav.service';
import { Component, EventEmitter, ViewChild } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { getExternalAppId, setExternalAppId } from 'src/app/shared/utilities/localstorage.util';
import { ApiServices } from './../_abstract_model/services/api.services';

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

    /** Informe d'un clic sur le bouton d'ouverture / fermeture de la sidenav */
    public toggle_sidenav_event: EventEmitter<void> = new EventEmitter();

    /** La liste des onglets à afficher */
    public tabs: Tabs[] = [
        { label: 'Script', url: 'script' },
        { label: 'Outils', url: 'tools' },
        { label: 'Wiki', url: 'wiki' }
    ]

    public constructor(public media: MediaObserver, public sidenav: SidenavService, private title_service: Title, private api: ApiServices) {
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
