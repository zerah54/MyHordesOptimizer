import { Route } from '@angular/router';

import { CampingComponent } from './camping/camping.component';
import { OverflowComponent } from './overflow/overflow.component';
import { ProbabilitiesComponent } from './probabilities/probabilities.component';

export default [
    { path: '', redirectTo: 'camping', pathMatch: 'full' },
    { path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping` },
    {
        path: 'probabilities',
        component: ProbabilitiesComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Chances de survie`
    },
    {
        path: 'overflow',
        component: OverflowComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Simulateur de débordement`
    },
] satisfies Route[];
