import { Route } from '@angular/router';

import { PictosGameComponent } from './368-pictos/368-pictos.component';
import { MinesweeperComponent } from './minesweeper/minesweeper.component';

export default [
    { path: '', redirectTo: 'minesweeper', pathMatch: 'full' },
    {
        path: 'minesweeper',
        component: MinesweeperComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Jeux` + ' - ' + $localize`Démineur`
    },
    {
        path: '368-pictos',
        component: PictosGameComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Jeux` + ' - ' + $localize`368 Pictos`
    },
] satisfies Route[];

