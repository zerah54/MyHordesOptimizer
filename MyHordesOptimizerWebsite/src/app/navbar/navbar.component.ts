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

    /** La liste des onglets à afficher */
    public tabs: Tabs[] = [
        { label: 'Script', url: 'script' },
        { label: 'Wiki', url: 'wiki' }
    ]

    public constructor(private title_service: Title) {
        this.title = this.title_service.getTitle();
    }
}

/** Les informations d'un onglet */
interface Tabs {
    label: string;
    url: string;
}
