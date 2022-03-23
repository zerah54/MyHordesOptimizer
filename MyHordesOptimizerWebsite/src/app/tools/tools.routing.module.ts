import { WishlistComponent } from './wishlist/wishlist.component';
import { CitizensComponent } from './citizens/citizens.component';
import { BankComponent } from './bank/bank.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ToolsComponent } from './tools.component';

let routes: Routes = [
    {
        path: 'tools', component: ToolsComponent, children: [
            {path: 'bank', component: BankComponent},
            {path: 'citizens', component: CitizensComponent},
            {path: 'wishlist', component: WishlistComponent},
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WikiRoutingModule {
}
