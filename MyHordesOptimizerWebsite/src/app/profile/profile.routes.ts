import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Route, Router, UrlTree } from '@angular/router';

import { getTokenWithMeWithExpirationDate, getUserId } from '../_core/utilities/localstorage.util';

/** N'autorise la route que sur son propre profil ; sinon renvoie vers les villes du profil visité. */
export const profileSelfOnlyGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
    const user_id: string | null = route.parent?.paramMap.get('userId') ?? null;
    const own_id: number | null | undefined = getUserId() ?? getTokenWithMeWithExpirationDate()?.simple_me?.id;
    return user_id !== null && own_id !== null && own_id !== undefined && Number(user_id) === Number(own_id) ? true : inject(Router).createUrlTree(['/profile', user_id, 'towns']);
};

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
            },
            {
                path: 'theme',
                canActivate: [profileSelfOnlyGuard],
                loadComponent: () => import('./profile-map-theme/profile-map-theme.component')
                    .then((m: typeof import('./profile-map-theme/profile-map-theme.component')) => m.ProfileMapThemeComponent)
            }
        ]
    }
];

export default PROFILE_ROUTES;
