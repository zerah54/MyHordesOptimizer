import { Route } from '@angular/router';
import { CampingComponent } from './camping/camping.component';
import { ProbabilitiesComponent } from './probabilities/probabilities.component';

export default [
    { path: 'tools', redirectTo: 'tools/bank', pathMatch: 'full' },
    { path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping` },
    {
        path: 'probabilities',
        component: ProbabilitiesComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Chances de survie`
    },
] satisfies Route[];
