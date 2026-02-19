import { Route } from '@angular/router';
import { CampingComponent } from './camping/camping.component';
import { ProbabilitiesComponent } from './probabilities/probabilities.component';
import { StatesManagementComponent } from './states-management/states-management.component';

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
        component: StatesManagementComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Gestion des états`
    },
] satisfies Route[];
