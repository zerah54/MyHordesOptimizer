import { Route } from '@angular/router';
import { IrlComponent } from './irl/irl.component';

export default [
    { path: '', redirectTo: 'irl', pathMatch: 'full' },
    {
        path: 'irl',
        component: IrlComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Divers` + ' - ' + $localize`IRL`
    },
    // La liste des villes a rejoint l'annuaire : /miscellaneous/towns reste redirigé le temps que
    // les liens externes et les favoris suivent.
    { path: 'towns', redirectTo: '/directory/towns', pathMatch: 'full' },
] satisfies Route[];
