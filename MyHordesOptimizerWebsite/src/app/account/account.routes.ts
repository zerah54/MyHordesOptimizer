import { Route } from '@angular/router';

const ACCOUNT_ROUTES: Route[] = [
    {
        path: ':userId',
        loadComponent: () => import('./account.component').then((m: typeof import('./account.component')) => m.AccountComponent)
    }
];

export default ACCOUNT_ROUTES;
