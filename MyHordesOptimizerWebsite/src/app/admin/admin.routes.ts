import { Route } from '@angular/router';
import { isAdminGuard } from '../_core/guards/is-admin.guard';
import { AdminTownsComponent } from './admin-towns/admin-towns.component';
import { AdminComponent } from './admin.component';
import { DataImportComponent } from './data-import/data-import.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';

export default [
    {
        path: '', component: AdminComponent, title: 'MyHordes Optimizer' + ' - ' + $localize`Outils` + ' - ' + $localize`Administration`,
        canActivate: [isAdminGuard],
        children: [
            { path: '', redirectTo: 'logs', pathMatch: 'full' },
            {
                path: 'logs',
                component: LogViewerComponent,
            },
            {
                path: 'data-import',
                component: DataImportComponent,
            },
            {
                path: 'towns',
                component: AdminTownsComponent,
            }
        ]
    },
] satisfies Route[];
