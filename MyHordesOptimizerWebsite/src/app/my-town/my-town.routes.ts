import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { InDevModeGuard } from '../shared/guards/in-dev-mode.guard';
import { BankComponent } from './bank/bank.component';
import { BuildingsComponent } from './buildings/buildings.component';
import { CampingsComponent } from './campings/campings.component';
import { CitizensDigsComponent } from './citizens/citizens-digs/citizens-digs.component';
import { CitizensDispoComponent } from './citizens/citizens-dispo/citizens-dispo.component';
import { CitizensImmuneComponent } from './citizens/citizens-immune/citizens-immune.component';
import { CitizensListComponent } from './citizens/citizens-list/citizens-list.component';
import { CitizensWatchComponent } from './citizens/citizens-watch/citizens-watch.component';
import { CitizensComponent } from './citizens/citizens.component';
import { ExpeditionsComponent } from './expeditions/expeditions.component';
import { MapComponent } from './map/map.component';
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
    },
    {
        path: 'buildings',
        component: BuildingsComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Chantiers`,
        canActivate: [(): boolean => inject(InDevModeGuard).canActivate()]
    },
    {
        path: 'campings',
        component: CampingsComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Campings`,
        canActivate: [(): boolean => inject(InDevModeGuard).canActivate()]
    },
    {
        path: 'citizens',
        component: CitizensComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Citoyens`,
        children: [
            {
                path: 'list',
                component: CitizensListComponent,
                canActivate: [],
            },
            {
                path: 'digs',
                component: CitizensDigsComponent,
            },
            {
                path: 'watch',
                component: CitizensWatchComponent,
                canActivate: [],
            },
            {
                path: 'immune',
                component: CitizensImmuneComponent,
                canActivate: [],
            },
            {
                path: 'dispo',
                component: CitizensDispoComponent,
                canActivate: [(): boolean => inject(InDevModeGuard).canActivate()],
            }
        ]
    },
    {
        path: 'expeditions',
        component: ExpeditionsComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Expéditions`
    },
    {
        path: 'map',
        component: MapComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Carte des fouilles`,
    },
    {
        path: 'stats',
        component: StatisticsComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Statistiques`,
        children: [
            {
                path: 'estimations',
                component: EstimationsComponent,
            },
            {
                path: 'scrutateur',
                component: ScrutateurComponent,
            },
            {
                path: 'registry',
                component: RegistryComponent,
            }
        ]
    },
    {
        path: 'wishlist',
        component: WishlistComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Ma ville` + ' - ' + $localize`Liste de courses`,
    }
] satisfies Route[];
