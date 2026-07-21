import { Route } from '@angular/router';

const ACCOUNT_ROUTES: Route[] = [
    {
        path: ':userId',
        loadComponent: () => import('./account.component').then((m: typeof import('./account.component')) => m.AccountComponent),
        children: [
            { path: '', redirectTo: 'towns', pathMatch: 'full' },
            {
                path: 'towns',
                loadComponent: () => import('./account-towns/account-towns.component')
                    .then((m: typeof import('./account-towns/account-towns.component')) => m.AccountTownsComponent)
            },
            {
                path: 'pictos',
                loadComponent: () => import('./account-pictos/account-pictos.component')
                    .then((m: typeof import('./account-pictos/account-pictos.component')) => m.AccountPictosComponent)
            }
        ]
    }
];

export default ACCOUNT_ROUTES;
