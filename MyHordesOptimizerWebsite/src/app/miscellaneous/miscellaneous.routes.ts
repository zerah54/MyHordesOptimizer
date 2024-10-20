import { Route } from '@angular/router';
import { IrlComponent } from './irl/irl.component';

export default [
    { path: '', redirectTo: 'irl', pathMatch: 'full' },
    {
        path: 'irl',
        component: IrlComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Divers` + ' - ' + $localize`IRL`
    },
] satisfies Route[];

