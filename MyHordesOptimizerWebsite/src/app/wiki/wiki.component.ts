import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { skip } from 'rxjs';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { PageWithSidenav } from './../shared/page-with-sidenav/page-with-sidenav.component';
import { SidenavService } from './../shared/services/sidenav.service';

@Component({
    selector: 'mho-wiki',
    templateUrl: './wiki.component.html',
    styleUrls: ['./wiki.component.scss']
})
export class WikiComponent extends PageWithSidenav implements OnInit {
    /** L'état d'ouverture de la sidenav */
    public opened_sidenav: boolean = true;

    /** La liste des pages du wiki */
    public wiki_list: SidenavLinks[] = [
        { label: $localize`Objets`, id: 'items'},
        { label: $localize`Recettes`, id: 'recipes'},
        { label: $localize`Pouvoirs`, id: 'hero-skills'},
        { label: $localize`Bâtiments`, id: 'ruins'}
    ]

    constructor(public media: MediaObserver, private sidenav: SidenavService) {
        super();
    }

    public ngOnInit(): void {
        this.sidenav.toggle_sidenav_obs
            .pipe(skip(1))
            .subscribe(() => {
                this.opened_sidenav = !this.opened_sidenav;
            })
    }
}
