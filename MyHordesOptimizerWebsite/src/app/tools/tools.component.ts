import { Component } from '@angular/core';
import { SidenavLinks } from '../_abstract_model/types/_types';
import { BankComponent } from './bank/bank.component';
import { CitizensComponent } from './citizens/citizens.component';
import { WishlistComponent } from './wishlist/wishlist.component';

@Component({
    selector: 'mho-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss']
})
export class ToolsComponent {
    /** La liste des outils */
    public tools_list: SidenavLinks[] = [
        { label: 'Banque', id: 'bank', component: BankComponent, selected: true },
        { label: 'Liste de courses', id: 'wishlist', component: WishlistComponent, selected: false },
        { label: 'Citoyens', id: 'citizens', component: CitizensComponent, selected: false }
    ]

    /**
     * Change l'outil affiché
     *
     * @param {SidenavLinks} selected_tool
     */
    public changeSelected(selected_tool: SidenavLinks): void {
        this.tools_list.forEach((tool: SidenavLinks) => tool.selected = selected_tool.id === tool.id);
    }
}
