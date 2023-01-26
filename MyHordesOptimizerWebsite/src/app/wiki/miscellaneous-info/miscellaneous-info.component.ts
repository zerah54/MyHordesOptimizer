import { DecimalPipe } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';

@Component({
    selector: 'mho-miscellaneous-info',
    templateUrl: './miscellaneous-info.component.html',
    styleUrls: ['./miscellaneous-info.component.scss']
})
export class MiscellaneousInfoComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public readonly despair_death_columns: string[] = Array.from({ length: 32 }, (_, i) => {return i === 0 ? 'header' : (i - 1 + '')});
    public readonly despair_deaths: MatTableDataSource<{[key: string]: string}> = new MatTableDataSource<{[key: string]: string}>([
        this.despair_death_columns.reduce((accumulator, nb_kill_zombies: string) => { return {...accumulator, [nb_kill_zombies]: nb_kill_zombies === 'header' ? $localize`Zombies morts sur la case depuis la dernière attaque` : nb_kill_zombies}}, {}),
        this.despair_death_columns.reduce((accumulator, nb_kill_zombies: string) => { return {...accumulator, [nb_kill_zombies]: nb_kill_zombies === 'header' ? $localize`Zombies qui vont mourir par désespoir` : Math.floor(Math.max(0, (+nb_kill_zombies - 1) / 2))}}, {})
    ]);

    public readonly survivalist_book_chances_columns: string[] = Array.from({ length: 51 }, (_, i) => {return i === 0 ? 'header' : (i + '')});
    public readonly survivalist_book_chances: MatTableDataSource<{[key: string]: string}> = new MatTableDataSource<{[key: string]: string}>([
        this.survivalist_book_chances_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Jour actuel` : days}}, {}),
        this.survivalist_book_chances_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Chances de réussite du manuel` : this.decimal_pipe.transform((+days <= 3 ? 1 :  Math.max(0.1, 1 - (+days * 0.025))) * 100, '1.0-2', this.locale) + '%' }}, {})
    ]);

    public readonly soul_points_columns: string[] = Array.from({ length: 52 }, (_, i) => {return i === 0 ? 'header' : (i - 1 + '')});
    public readonly soul_points: MatTableDataSource<{[key: string]: string}> = new MatTableDataSource<{[key: string]: string}>([
        this.soul_points_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Nombre de jours validés` : days}}, {}),
        this.soul_points_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Nombre de points d'âmes gagnés` : Math.floor(Math.max(0, +days * (+days + 1) / 2))}}, {})
    ]);

    public readonly clean_points_columns: string[] = Array.from({ length: 52 }, (_, i) => {return i === 0 ? 'header' : (i - 1 + '')});
    public readonly clean_points: MatTableDataSource<{[key: string]: string}> = new MatTableDataSource<{[key: string]: string}>([
        this.clean_points_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Nombre de jours validés` : days}}, {}),
        this.clean_points_columns.reduce((accumulator, days: string) => { return {...accumulator, [days]: days === 'header' ? $localize`Nombre de points clean gagnés` : (+days <= 3 ? 0 :  parseFloat((Math.round((Math.round(Math.pow(+days, 1.5)) * Math.pow(10, 0)) + (1 * 0.0001)) / Math.pow(10, 0)).toFixed(0)))}}, {})
    ]);

    constructor(private decimal_pipe: DecimalPipe) {

    }
}
