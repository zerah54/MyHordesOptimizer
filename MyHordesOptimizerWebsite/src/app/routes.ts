import { ActivatedRouteSnapshot, ExtraOptions, Route } from '@angular/router';

export const ROUTES: Route[] = [
    {path: 'my-town', loadChildren: () => import('./my-town/my-town.routes')},
    {path: 'tools', loadChildren: () => import('./tools/tools.routes')},
    {path: 'tutorials', loadChildren: () => import('./tutorials/tutorials.routes')},
    {path: 'wiki', loadChildren: () => import('./wiki/wiki.routes')},
    {
        path: 'login',
        pathMatch: 'full',
        redirectTo: (redirect_data: Pick<ActivatedRouteSnapshot, 'routeConfig' | 'url' | 'params' | 'queryParams' | 'fragment' | 'data' | 'outlet' | 'title'>) => {
            console.log('redirectData', redirect_data);
            return 'wiki/items';
        }
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: (redirect_data: Pick<ActivatedRouteSnapshot, 'routeConfig' | 'url' | 'params' | 'queryParams' | 'fragment' | 'data' | 'outlet' | 'title'>) => {
            console.log('redirectData', redirect_data);
            return 'wiki/items';
        }
    },
    {
        path: '**',
        redirectTo: (redirect_data: Pick<ActivatedRouteSnapshot, 'routeConfig' | 'url' | 'params' | 'queryParams' | 'fragment' | 'data' | 'outlet' | 'title'>) => {
            console.log('redirectData', redirect_data);
            return 'wiki/items';
        }
    },

];
export const ROUTES_OPTIONS: ExtraOptions = {
    useHash: false, anchorScrolling: 'enabled', onSameUrlNavigation: 'reload', scrollPositionRestoration: 'enabled', initialNavigation: 'enabledBlocking'
};

