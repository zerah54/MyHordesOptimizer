import { Route } from '@angular/router';
import { isAdminGuard } from '../_core/guards/is-admin.guard';
import { AdminComponent } from './admin.component';

export default [
    {
        path: '', component: AdminComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Administration`,
        canActivate: [isAdminGuard]
    },
] satisfies Route[];
