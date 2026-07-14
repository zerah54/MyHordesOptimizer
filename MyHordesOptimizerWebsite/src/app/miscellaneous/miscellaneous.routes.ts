import { Route } from '@angular/router';
import { IrlComponent } from './irl/irl.component';
import { TownListComponent } from './town-list/town-list.component';

export default [
    { path: '', redirectTo: 'towns', pathMatch: 'full' },
    {
        path: 'towns',
        component: TownListComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Divers` + ' - ' + $localize`Villes`
    },
    {
        path: 'irl',
        component: IrlComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Divers` + ' - ' + $localize`IRL`
    },
] satisfies Route[];

