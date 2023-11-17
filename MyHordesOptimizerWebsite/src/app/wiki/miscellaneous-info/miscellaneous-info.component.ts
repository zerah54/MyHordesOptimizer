import { DecimalPipe } from '@angular/common';
import { Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { getMaxAttack, getMinAttack } from '../../shared/utilities/estimations.util';
import { DespairDeathsCalculatorComponent } from './despair-deaths-calculator/despair-deaths-calculator.component';

@Component({
    selector: 'mho-miscellaneous-info',
    templateUrl: './miscellaneous-info.component.html',
    styleUrls: ['./miscellaneous-info.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MiscellaneousInfoComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public misc: Misc[] = [
        {
            header: $localize`Morts par désespoir`,
            header_action: {
                icon: 'calculate',
                action: (): void => {
                    this.openCalculator();
                }
            },
            columns: [
                { id: 'nb_killed_zombies', header: $localize`Zombies morts sur la case depuis la dernière attaque` },
                { id: 'will_dead_zombies', header: $localize`Zombies qui vont mourir par désespoir` }
            ],
            table: new MatTableDataSource(Array.from({ length: 31 }, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    nb_killed_zombies: i,
                    will_dead_zombies: Math.floor(Math.max(0, (+i - 1) / 2))
                };
            }))
        },
        {
            header: $localize`Attaque théorique`,
            columns: [
                { id: 'day', header: $localize`Jour` },
                { id: 're_min', header: $localize`Minimum théorique` },
                { id: 're_max', header: $localize`Maximum théorique` }
            ],
            table: new MatTableDataSource(Array.from({ length: 50 }, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i + 1,
                    re_min: this.decimal_pipe.transform(getMinAttack(i + 1, 'RE'), '1.0-0', this.locale),
                    re_max: this.decimal_pipe.transform(getMaxAttack(i + 1, 'RE'), '1.0-0', this.locale)
                };
            }))
        },
        {
            header: $localize`Manuel des ermites`,
            columns: [
                { id: 'day', header: $localize`Jour` },
                { id: 'success', header: $localize`Chances de réussite du manuel` },
                { id: 'success_devastated', header: $localize`Chances de réussite du manuel en ville dévastée` },
            ],
            table: new MatTableDataSource(Array.from({ length: 50 }, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i + 1,
                    success: this.getSurvivalistOdds(i + 1, false),
                    success_devastated: this.getSurvivalistOdds(i + 1, true)
                };
            }))
        },
        {
            header: $localize`Points d'âme`,
            columns: [
                { id: 'day', header: $localize`Jours validés` },
                { id: 'soul', header: $localize`Points d'âmes gagnés` },
            ],
            table: new MatTableDataSource(Array.from({ length: 51 }, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i,
                    soul: Math.floor(Math.max(0, i * (i + 1) / 2))
                };
            }))
        },
        {
            header: $localize`Points clean`,
            columns: [
                { id: 'day', header: $localize`Jours validés` },
                { id: 'clean', header: $localize`Points clean gagnés` },
            ],
            table: new MatTableDataSource(Array.from({ length: 51 }, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i,
                    clean: (i <= 3 ? 0 : parseFloat((Math.round((Math.round(Math.pow(i, 1.5)) * Math.pow(10, 0)) + (0.0001)) / Math.pow(10, 0)).toFixed(0)))
                };
            }))
        },
    ];


    constructor(private decimal_pipe: DecimalPipe, private dialog: MatDialog) {

    }

    private openCalculator(): void {
        this.dialog.open(DespairDeathsCalculatorComponent);
    }

    private getSurvivalistOdds(day: number, devastated: boolean): string {

        let chances: number = 1;
        if (day >= 20) {
            chances = 0.50;
        } else if (day >= 15) {
            chances = 0.60;
        } else if (day >= 13) {
            chances = 0.70;
        } else if (day >= 10) {
            chances = 0.80;
        } else if (day >= 5) {
            chances = 0.85;
        }
        if (devastated) chances = Math.max(0.1, chances - 0.2);

        return this.decimal_pipe.transform(chances * 100, '1.0-2', this.locale) + '%';
    }
}

interface Misc {
    header: string;
    header_action?: MiscHeaderAction;
    columns: StandardColumn[];
    table: MatTableDataSource<{ [key: string]: number | string | null }>;
}

interface MiscHeaderAction {
    icon: string;
    action: () => void
}
