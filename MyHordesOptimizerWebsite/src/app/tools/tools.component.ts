import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { skip } from 'rxjs';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { PageWithSidenav } from './../shared/page-with-sidenav/page-with-sidenav.component';
import { SidenavService } from './../shared/services/sidenav.service';

@Component({
    selector: 'mho-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss']
})
export class ToolsComponent extends PageWithSidenav implements OnInit {
    /** L'état d'ouverture de la sidenav */
    public opened_sidenav: boolean = true;

    /** La liste des outils */
    public tools_list: SidenavLinks[] = [
        { label: $localize`Banque`, id: 'bank' },
        { label: $localize`Liste de courses`, id: 'wishlist' },
        { label: $localize`Citoyens`, id: 'citizens' },
        { label: $localize`Camping`, id: 'camping' },
        // { label: $localize`Estimation de l'attaque`, id: 'estimation' }
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
