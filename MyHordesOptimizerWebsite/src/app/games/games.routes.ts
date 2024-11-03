import { Route } from '@angular/router';
import { MinesweeperComponent } from './minesweeper/minesweeper.component';

export default [
    {path: '', redirectTo: 'minesweeper', pathMatch: 'full'},
    {
        path: 'minesweeper',
        component: MinesweeperComponent,
        title: 'MyHordes Optimizer' + ' - ' + $localize`Jeux` + ' - ' + $localize`Démineur`
    },
] satisfies Route[];

