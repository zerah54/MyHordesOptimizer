import { Route } from '@angular/router';

const PROFILE_ROUTES: Route[] = [
    {
        path: ':userId',
        loadComponent: () => import('./profile.component').then((m: typeof import('./profile.component')) => m.ProfileComponent),
        children: [
            { path: '', redirectTo: 'towns', pathMatch: 'full' },
            {
                path: 'towns',
                loadComponent: () => import('./profile-towns/profile-towns.component')
                    .then((m: typeof import('./profile-towns/profile-towns.component')) => m.ProfileTownsComponent)
            },
            {
                path: 'pictos',
                loadComponent: () => import('./profile-pictos/profile-pictos.component')
                    .then((m: typeof import('./profile-pictos/profile-pictos.component')) => m.ProfilePictosComponent)
            }
        ]
    }
];

export default PROFILE_ROUTES;
