import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IsInTownGuard } from '../shared/guards/has-app-key.guard';
import { BankComponent } from './bank/bank.component';
import { CampingComponent } from './camping/camping.component';
import { CitizensComponent } from './citizens/citizens.component';
import { EstimationComponent } from './estimation/estimation.component';
import { MapComponent } from './map/map.component';
import { WishlistComponent } from './wishlist/wishlist.component';

let routes: Routes = [
    { path: '', redirectTo: 'tools/bank', pathMatch: 'full' },
    { path: 'tools', redirectTo: 'tools/bank' },
    {
        path: 'tools', children: [
            { path: 'bank', component: BankComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Banque`, canActivate: [IsInTownGuard] },
            { path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping` },
            { path: 'citizens', component: CitizensComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Citoyens`, canActivate: [IsInTownGuard] },
            // { path: 'estimation', component: EstimationComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Estimations` },
            { path: 'map', component: MapComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Carte des fouilles`, canActivate: [IsInTownGuard] },
            { path: 'wishlist', component: WishlistComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Liste de courses`, canActivate: [IsInTownGuard] },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ToolsRoutingModule {
}
