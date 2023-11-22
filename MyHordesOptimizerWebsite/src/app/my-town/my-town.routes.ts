import { Route } from '@angular/router';
import { IsInTownGuard } from '../shared/guards/has-app-key.guard';
import { BankComponent } from './bank/bank.component';
import { BuildingsComponent } from './buildings/buildings.component';
import { CampingsComponent } from './campings/campings.component';
import { CitizensDigsComponent } from './citizens/citizens-digs/citizens-digs.component';
import { CitizensDispoComponent } from './citizens/citizens-dispo/citizens-dispo.component';
import { CitizensListComponent } from './citizens/citizens-list/citizens-list.component';
import { CitizensComponent } from './citizens/citizens.component';
import { ExpeditionsComponent } from './expeditions/expeditions.component';
import { MapComponent } from './map/map.component';
import { NightwatchComponent } from './nightwatch/nightwatch.component';
import { EstimationsComponent } from './statistics/estimations/estimations.component';
import { RegistryComponent } from './statistics/registry/registry.component';
import { ScrutateurComponent } from './statistics/scrutateur/scrutateur.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { WishlistComponent } from './wishlist/wishlist.component';

export default [
    { path: '', redirectTo: 'citizens/list', pathMatch: 'full' },
    { path: 'citizens', redirectTo: 'citizens/list', pathMatch: 'full' },
    { path: 'stats', redirectTo: 'stats/estimations', pathMatch: 'full' },
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
            }, {
                path: 'dispo',
                component: CitizensDispoComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`,
                canActivate: [IsInTownGuard],
            }
        ]
    },
    {
        path: 'expeditions',
        component: ExpeditionsComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Expéditions`,
        canActivate: []
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
        canActivate: [IsInTownGuard],
        children: [
            {
                path: 'estimations',
                component: EstimationsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`,
                canActivate: [IsInTownGuard],
            },
            {
                path: 'scrutateur',
                component: ScrutateurComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`,
                canActivate: [IsInTownGuard],
            },
            {
                path: 'registry',
                component: RegistryComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`,
                canActivate: [IsInTownGuard],
            }
        ]
    },
    {
        path: 'wishlist',
        component: WishlistComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Liste de courses`,
        canActivate: [IsInTownGuard]
    },
] satisfies Route[];
