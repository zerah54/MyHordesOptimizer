import { Route } from '@angular/router';
import { CampingComponent } from './camping/camping.component';
import { ProbabilitiesComponent } from './probabilities/probabilities.component';
import { ThirstManagementComponent } from './thirst-management/thirst-management.component';

export default [
    {path: '', redirectTo: 'camping', pathMatch: 'full'},
    {path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping`},
    {
        path: 'probabilities',
        component: ProbabilitiesComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Chances de survie`
    },
    {
        path: 'status-management',
        component: ThirstManagementComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Gestion des états`
    },
] satisfies Route[];
