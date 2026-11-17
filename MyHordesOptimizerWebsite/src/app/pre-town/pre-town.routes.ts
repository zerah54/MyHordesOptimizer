import { Route } from '@angular/router';

import { MY_TOWN_ROUTES } from '../my-town/my-town.routes';
import { PreTownDetailComponent } from './pre-town-detail/pre-town-detail.component';
import { PreTownListComponent } from './pre-town-list/pre-town-list.component';
import { PreTownShellComponent } from './pre-town-shell/pre-town-shell.component';

/** Pages de planification de la ville réutilisées telles quelles sur une pré-ville. */
const REUSED_PATHS: readonly string[] = ['buildings', 'nightwatch', 'wishlist'];

export default [
    {
        path: '',
        component: PreTownListComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Mes pré-villes`
    },
    {
        path: ':preTownId',
        component: PreTownShellComponent,
        children: [
            {
                path: '',
                component: PreTownDetailComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Pré-ville`
            },
            ...MY_TOWN_ROUTES.filter((route: Route): boolean => REUSED_PATHS.includes(route.path ?? ''))
        ]
    },
] satisfies Route[];
