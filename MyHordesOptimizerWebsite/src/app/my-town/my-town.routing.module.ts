import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IsInTownGuard } from '../shared/guards/has-app-key.guard';
import { BankComponent } from './bank/bank.component';
import { CitizensComponent } from './citizens/citizens.component';
import { MapComponent } from './map/map.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { WishlistComponent } from './wishlist/wishlist.component';

let routes: Routes = [
    { path: '', redirectTo: 'my-town/citizens', pathMatch: 'full' },
    { path: 'my-town', redirectTo: 'my-town/citizens' },
    {
        path: 'my-town', children: [
            { path: 'bank', component: BankComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Banque`, canActivate: [IsInTownGuard] },
            { path: 'citizens', component: CitizensComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`, canActivate: [IsInTownGuard] },
            { path: 'map', component: MapComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Carte des fouilles`, canActivate: [IsInTownGuard] },
            { path: 'stats', component: StatisticsComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`, canActivate: [IsInTownGuard] },
            { path: 'wishlist', component: WishlistComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Liste de courses`, canActivate: [IsInTownGuard] },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyTownRoutingModule {
}