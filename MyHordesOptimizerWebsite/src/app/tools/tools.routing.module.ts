import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BankComponent } from './bank/bank.component';
import { CampingComponent } from './camping/camping.component';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { WishlistComponent } from './wishlist/wishlist.component';

let routes: Routes = [
    {path: 'tools', redirectTo: 'tools/bank'},
    {
        path: 'tools', children: [
            {path: 'bank', component: BankComponent},
            {path: 'camping', component: CampingComponent},
            {path: 'citizens', component: CitizensComponent},
            {path: 'estimation', component: EstimationComponent},
            {path: 'wishlist', component: WishlistComponent},
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ToolsRoutingModule {
}
