import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampingComponent } from './camping/camping.component';

let routes: Routes = [
    { path: '', redirectTo: 'tools/bank', pathMatch: 'full' },
    { path: 'tools', redirectTo: 'tools/bank' },
    {
        path: 'tools', children: [
            { path: 'camping', component: CampingComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Camping` },
            // { path: 'estimation', component: EstimationComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Estimations` },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ToolsRoutingModule {
}
