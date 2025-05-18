import { Route } from '@angular/router';
import { CampingComponent } from './camping/camping.component';
import { ProbabilitiesComponent } from './probabilities/probabilities.component';
import { WatchmenComponent } from './watchmen/watchmen.component';

export default [
    { path: '', redirectTo: 'camping', pathMatch: 'full' },
    { path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping` },
    { path: 'probabilities', component: ProbabilitiesComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Chances de survie`},
    { path: 'watchmen', component: WatchmenComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Veilles`}

] satisfies Route[];
