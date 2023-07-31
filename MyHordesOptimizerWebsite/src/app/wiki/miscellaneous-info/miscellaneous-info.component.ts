import { DecimalPipe } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { getMaxAttack, getMinAttack } from '../../shared/utilities/estimations.util';

@Component({
    selector: 'mho-miscellaneous-info',
    templateUrl: './miscellaneous-info.component.html',
    styleUrls: ['./miscellaneous-info.component.scss']
})
export class MiscellaneousInfoComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public readonly despair_death_columns: string[] = Array.from({length: 32}, (_: unknown, i: number) => {
        return i === 0 ? 'header' : (i - 1 + '');
    });
    public readonly despair_deaths: MatTableDataSource<{ [key: string]: string }> = new MatTableDataSource<{ [key: string]: string }>([
        this.despair_death_columns.reduce((accumulator: { [key: string]: string }, nb_kill_zombies: string) => {
            return {
                ...accumulator,
                [nb_kill_zombies]: nb_kill_zombies === 'header' ? $localize`Zombies morts sur la case depuis la dernière attaque` : nb_kill_zombies
            };
        }, {}),
        this.despair_death_columns.reduce((accumulator: { [key: string]: string }, nb_kill_zombies: string) => {
            return {
                ...accumulator,
                [nb_kill_zombies]: nb_kill_zombies === 'header'
                    ? $localize`Zombies qui vont mourir par désespoir`
                    : Math.floor(Math.max(0, (+nb_kill_zombies - 1) / 2)).toString(10)
            };
        }, {})
    ]);

    public readonly theorical_attack_columns: string[] = Array.from({length: 51}, (_: unknown, i: number) => {
        return i === 0 ? 'header' : (i + '');
    });
    public readonly theorical_attack: MatTableDataSource<{ [key: string]: string }> = new MatTableDataSource<{ [key: string]: string }>([
        this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Jour` : days};
        }, {}),
        // this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
        //     return {...accumulator, [days]: days === 'header' ? $localize`Minimum théorique en RNE` : getMinAttack(+days, 'RNE').toString(10)};
        // }, {}),
        // this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
        //     return {...accumulator, [days]: days === 'header' ? $localize`Maximum théorique en RNE` : getMaxAttack(+days, 'RNE').toString(10)};
        // }, {}),
        this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Minimum théorique` : getMinAttack(+days, 'RE').toString(10)};
        }, {}),
        this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Maximum théorique` : getMaxAttack(+days, 'RE').toString(10)};
        }, {}),
        // this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
        //     return {...accumulator, [days]: days === 'header' ? $localize`Minimum théorique en Pandé` : getMinAttack(+days, 'PANDE').toString(10)};
        // }, {}),
        // this.theorical_attack_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
        //     return {...accumulator, [days]: days === 'header' ? $localize`Maximum théorique en Pandé` : getMaxAttack(+days, 'PANDE').toString(10)};
        // }, {})
    ]);

    public readonly survivalist_book_chances_columns: string[] = Array.from({length: 51}, (_: unknown, i: number) => {
        return i === 0 ? 'header' : (i + '');
    });
    public readonly survivalist_book_chances: MatTableDataSource<{ [key: string]: string }> = new MatTableDataSource<{ [key: string]: string }>([
        this.survivalist_book_chances_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Jour` : days};
        }, {}),
        this.survivalist_book_chances_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {
                ...accumulator,
                [days]: days === 'header'
                    ? $localize`Chances de réussite du manuel`
                    : this.decimal_pipe.transform((+days <= 3 ? 1 : Math.max(0.1, 1 - (+days * 0.025))) * 100, '1.0-2', this.locale) + '%'
            };
        }, {})
    ]);

    public readonly soul_points_columns: string[] = Array.from({length: 52}, (_: unknown, i: number) => {
        return i === 0 ? 'header' : (i - 1 + '');
    });
    public readonly soul_points: MatTableDataSource<{ [key: string]: string }> = new MatTableDataSource<{ [key: string]: string }>([
        this.soul_points_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Jours validés` : days};
        }, {}),
        this.soul_points_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {
                ...accumulator,
                [days]: days === 'header'
                    ? $localize`Points d'âmes gagnés`
                    : Math.floor(Math.max(0, +days * (+days + 1) / 2)).toString(10)
            };
        }, {})
    ]);

    public readonly clean_points_columns: string[] = Array.from({length: 52}, (_: unknown, i: number) => {
        return i === 0 ? 'header' : (i - 1 + '');
    });
    public readonly clean_points: MatTableDataSource<{ [key: string]: string }> = new MatTableDataSource<{ [key: string]: string }>([
        this.clean_points_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {...accumulator, [days]: days === 'header' ? $localize`Jours validés` : days};
        }, {}),
        this.clean_points_columns.reduce((accumulator: { [key: string]: string }, days: string) => {
            return {
                ...accumulator,
                [days]: days === 'header'
                    ? $localize`Points clean gagnés`
                    : (+days <= 3 ? 0 : parseFloat((Math.round((Math.round(Math.pow(+days, 1.5)) * Math.pow(10, 0)) + (0.0001)) / Math.pow(10, 0)).toFixed(0))).toString(10)
            };
        }, {})
    ]);


    constructor(private decimal_pipe: DecimalPipe) {

    }
}
