import { Route } from '@angular/router';

import { CitizenListComponent } from './citizen-list/citizen-list.component';
import { TownListComponent } from './town-list/town-list.component';

export default [
    { path: '', redirectTo: 'towns', pathMatch: 'full' },
    {
        path: 'towns',
        component: TownListComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Annuaire` + ' - ' + $localize`Villes`
    },
    {
        path: 'citizens',
        component: CitizenListComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Annuaire` + ' - ' + $localize`Citoyens`
    },
] satisfies Route[];
