import { ExtraOptions, Route } from '@angular/router';

export const ROUTES: Route[] = [
    { path: 'my-town', loadChildren: () => import('./my-town/my-town.routes') },
    { path: 'tools', loadChildren: () => import('./tools/tools.routes') },
    { path: 'tutorials', loadChildren: () => import('./tutorials/tutorials.routes') },
    { path: 'wiki', loadChildren: () => import('./wiki/wiki.routes') },
    { path: 'games', loadChildren: () => import('./games/games.routes') },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: () => 'wiki/items'
    },
    {
        path: '**',
        redirectTo: () => 'wiki/items'
    },

];
export const ROUTES_OPTIONS: ExtraOptions = {
    useHash: false, anchorScrolling: 'enabled', onSameUrlNavigation: 'reload', scrollPositionRestoration: 'enabled', initialNavigation: 'enabledBlocking'
};

