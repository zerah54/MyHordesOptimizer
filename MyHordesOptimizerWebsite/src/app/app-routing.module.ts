import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {path: '**', redirectTo: 'wiki/items'},
];
const extra_options: ExtraOptions = {
    useHash: false, anchorScrolling: 'enabled', onSameUrlNavigation: 'reload', scrollPositionRestoration: 'enabled', initialNavigation: 'enabledBlocking'
};

@NgModule({
    imports: [RouterModule.forRoot(routes, extra_options)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
