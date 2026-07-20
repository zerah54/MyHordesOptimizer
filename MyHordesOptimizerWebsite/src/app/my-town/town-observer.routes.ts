import { Route } from '@angular/router';
import { MY_TOWN_ROUTES } from './my-town.routes';
import { TownObserverComponent } from './town-observer/town-observer.component';

export default [
    {
        path: '',
        component: TownObserverComponent,
        children: MY_TOWN_ROUTES
    }
] satisfies Route[];
