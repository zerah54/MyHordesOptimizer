import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ExtraOptions, Route } from '@angular/router';

import { HeaderService } from './structure/header/header.service';

export const ROUTES: Route[] = [
    { path: 'admin', loadChildren: () => import('./admin/admin.routes') },
    { path: 'profile', loadChildren: () => import('./profile/profile.routes') },
    { path: 'my-town', loadChildren: () => import('./my-town/my-town.routes') },
    { path: 'town/:mapId', loadChildren: () => import('./my-town/town-observer.routes') },
    { path: 'tools', loadChildren: () => import('./tools/tools.routes') },
    { path: 'tutorials', loadChildren: () => import('./tutorials/tutorials.routes') },
    { path: 'wiki', loadChildren: () => import('./wiki/wiki.routes') },
    { path: 'directory', loadChildren: () => import('./directory/directory.routes') },
    { path: 'miscellaneous', loadChildren: () => import('./miscellaneous/miscellaneous.routes') },
    { path: 'games', loadChildren: () => import('./games/games.routes') },
    {
        path: 'login',
        pathMatch: 'full',
        redirectTo: (redirect_data: Pick<ActivatedRouteSnapshot, 'routeConfig' | 'url' | 'params' | 'queryParams' | 'fragment' | 'data' | 'outlet' | 'title'>): string => {
            inject(HeaderService).setToken(redirect_data.queryParams['token']);
            return 'wiki/items';
        }
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: (): string => 'wiki/items'
    },
    {
        path: '**',
        redirectTo: (): string => 'wiki/items'
    },

];
export const ROUTES_OPTIONS: ExtraOptions = {
    useHash: false, anchorScrolling: 'enabled', onSameUrlNavigation: 'reload', scrollPositionRestoration: 'enabled', initialNavigation: 'enabledBlocking'
};

