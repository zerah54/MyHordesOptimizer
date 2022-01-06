import { WikiComponent } from './wiki.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

let routes: Routes = [
    { path: 'wiki', component: WikiComponent }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WikiRoutingModule {
}
