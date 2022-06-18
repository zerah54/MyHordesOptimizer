import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { skip } from 'rxjs';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { PageWithSidenav } from './../shared/page-with-sidenav/page-with-sidenav.component';
import { SidenavService } from './../shared/services/sidenav.service';
import { BankComponent } from './bank/bank.component';
import { CampingComponent } from './camping/camping.component';
import { CitizensComponent } from './citizens/citizens.component';
import { WishlistComponent } from './wishlist/wishlist.component';

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
        { label: $localize`Banque`, id: 'bank', component: BankComponent, selected: true },
        { label: $localize`Liste de courses`, id: 'wishlist', component: WishlistComponent, selected: false },
        { label: $localize`Citoyens`, id: 'citizens', component: CitizensComponent, selected: false },
        { label: $localize`Camping`, id: 'camping', component: CampingComponent, selected: false },
        // { label: $localize`Estimation de l'attaque`, id: 'estimation', component: EstimationComponent, selected: false }
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

    /**
     * Change l'outil affiché
     *
     * @param {SidenavLinks} selected_tool
     */
    public changeSelected(selected_tool: SidenavLinks): void {
        this.tools_list.forEach((tool: SidenavLinks) => tool.selected = selected_tool.id === tool.id);
    }
}
