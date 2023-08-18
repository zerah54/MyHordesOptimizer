import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IsInTownGuard } from '../shared/guards/has-app-key.guard';
import { BankComponent } from './bank/bank.component';
import { BuildingsComponent } from './buildings/buildings.component';
import { CampingsComponent } from './campings/campings.component';
import { CitizensDigsComponent } from './citizens/citizens-digs/citizens-digs.component';
import { CitizensListComponent } from './citizens/citizens-list/citizens-list.component';
import { CitizensComponent } from './citizens/citizens.component';
import { MapComponent } from './map/map.component';
import { NightwatchComponent } from './nightwatch/nightwatch.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { WishlistComponent } from './wishlist/wishlist.component';

const routes: Routes = [
    { path: '', redirectTo: 'my-town/citizens/list', pathMatch: 'full' },
    { path: 'my-town', redirectTo: 'my-town/citizens/list', pathMatch: 'full' },
    { path: 'my-town/citizens', redirectTo: 'my-town/citizens/list', pathMatch: 'full' },
    {
        path: 'my-town', children: [
            {
                path: 'bank',
                component: BankComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Banque`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'buildings',
                component: BuildingsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Chantiers`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'campings',
                component: CampingsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Campings`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'citizens',
                component: CitizensComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`,
                canActivate: [IsInTownGuard],
                children: [
                    {
                        path: 'list',
                        component: CitizensListComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`,
                        canActivate: [IsInTownGuard],
                    }, {
                        path: 'digs',
                        component: CitizensDigsComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`,
                        canActivate: [IsInTownGuard],
                    }
                ]
            },
            {
                path: 'map',
                component: MapComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Carte des fouilles`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'nightwatch',
                component: NightwatchComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Veilles`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'stats',
                component: StatisticsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`,
                canActivate: [IsInTownGuard]
            },
            {
                path: 'wishlist',
                component: WishlistComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Liste de courses`,
                canActivate: [IsInTownGuard]
            },
        ]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyTownRoutingModule {
}
