import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { BackgroundComponent } from './background/background.component';
import { RoutingGuard } from './shared/guards/routing.guard';
import { ToolboxComponent } from './toolbox/toolbox.component';

const routes: Routes = [
    { path: 'toolbox', component: ToolboxComponent },
    { path: 'background', component: BackgroundComponent },
    { path: '**', component: AppComponent, canActivate: [RoutingGuard] }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
    
}
