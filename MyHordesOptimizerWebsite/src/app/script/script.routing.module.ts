import { ScriptComponent } from './script.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

let routes: Routes = [
    { path: '', redirectTo: 'script', pathMatch: 'full'},
    { path: 'script', component: ScriptComponent }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ScriptRoutingModule {
}
