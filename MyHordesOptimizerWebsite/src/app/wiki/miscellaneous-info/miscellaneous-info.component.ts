import { CommonModule, formatNumber } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import moment from 'moment';
import { Misc } from '../../_abstract_model/interfaces';
import { Imports } from '../../_abstract_model/types/_types';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { ColumnIdPipe } from '../../_core/pipes/column-id.pipe';
import { getMaxAttack, getMinAttack } from '../../_core/utilities/estimations.util';
import { getTown } from '../../_core/utilities/localstorage.util';
import { DespairDeathsCalculatorComponent } from './despair-deaths-calculator/despair-deaths-calculator.component';
import { IsTodayMiscRowPipe } from './miscellaneous-info.pipe';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [ColumnIdPipe, IsTodayMiscRowPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatTableModule];

@Component({
    selector: 'mho-miscellaneous-info',
    templateUrl: './miscellaneous-info.component.html',
    styleUrls: ['./miscellaneous-info.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MiscellaneousInfoComponent {
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly router: Router = inject(Router);

    public readonly locale: string = moment.locale();
    public readonly my_town: TownDetails | null = getTown();

    public misc: Misc[] = [
        {
            header: $localize`Morts par désespoir`,
            highlight_day: false,
            header_action: {
                icon: 'calculate',
                action: (): void => {
                    this.openDespairDeathCalculator();
                }
            },
            columns: [
                {id: 'nb_killed_zombies', header: $localize`Zombies morts sur la case depuis la dernière attaque`},
                {id: 'will_dead_zombies', header: $localize`Zombies qui vont mourir par désespoir`}
            ],
            table: new MatTableDataSource(Array.from({length: 31}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    nb_killed_zombies: i,
                    will_dead_zombies: Math.floor(Math.max(0, (+i - 1) / 2))
                };
            }))
        },
        {
            header: $localize`Attaque théorique`,
            highlight_day: true,
            columns: [
                {id: 'day', header: $localize`Jour`},
                {id: 're_min', header: $localize`Minimum théorique`},
                {id: 're_max', header: $localize`Maximum théorique`},
                {id: 're_moy', header: $localize`Moyenne théorique`}
            ],
            table: new MatTableDataSource(Array.from({length: 50}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i + 1,
                    re_min: formatNumber(getMinAttack(i + 1, this.my_town?.town_type ?? 'RE'), this.locale, '1.0-0'),
                    re_max: formatNumber(getMaxAttack(i + 1, this.my_town?.town_type ?? 'RE'), this.locale, '1.0-0'),
                    re_moy: formatNumber((getMinAttack(i + 1, this.my_town?.town_type ?? 'RE') + getMaxAttack(i + 1, this.my_town?.town_type ?? 'RE')) / 2, this.locale, '1.0-0')
                };
            }))
        },
        {
            header: $localize`Débordement`,
            highlight_day: true,
            header_action: {
                icon: 'calculate',
                action: (): void => {
                    this.openOverflowSimulator();
                }
            },
            columns: [
                {id: 'day', header: $localize`Jour`},
                {id: 'citizen', header: $localize`Citoyens ciblés`},
            ],
            table: new MatTableDataSource(Array.from({length: 50}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i + 1,
                    citizen: this.getTargettedCitizen(i + 1),
                };
            }))
        },
        {
            header: $localize`Manuel des ermites`,
            highlight_day: true,
            columns: [
                {id: 'day', header: $localize`Jour`},
                {id: 'success', header: $localize`Chances de réussite du manuel`},
                {id: 'success_devastated', header: $localize`Chances de réussite du manuel en ville dévastée`},
            ],
            table: new MatTableDataSource(Array.from({length: 50}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i + 1,
                    success: this.getSurvivalistOdds(i + 1, false),
                    success_devastated: this.getSurvivalistOdds(i + 1, true)
                };
            }))
        },
        {
            header: $localize`Points d'âme`,
            highlight_day: true,
            columns: [
                {id: 'day', header: $localize`Jours validés`},
                {id: 'soul', header: $localize`Points d'âmes gagnés`},
            ],
            table: new MatTableDataSource(Array.from({length: 51}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i,
                    soul: Math.floor(Math.max(0, i * (i + 1) / 2))
                };
            }))
        },
        {
            header: $localize`Points clean`,
            highlight_day: true,
            columns: [
                {id: 'day', header: $localize`Jours validés`},
                {id: 'clean', header: $localize`Points clean gagnés`},
            ],
            table: new MatTableDataSource(Array.from({length: 51}, (_: unknown, i: number): { [key: string]: number | string | null } => {
                return {
                    day: i,
                    clean: (i <= 3 ? 0 : parseFloat((Math.round((Math.round(Math.pow(i, 1.5)) * Math.pow(10, 0)) + (0.0001)) / Math.pow(10, 0)).toFixed(0)))
                };
            }))
        }
    ];

    private openDespairDeathCalculator(): void {
        this.dialog.open(DespairDeathsCalculatorComponent);
    }

    private openOverflowSimulator(): void {
        this.router.navigate(['tools', 'overflow']);
    }

    /**
     * Nombre de citoyens ciblés par le débordement au jour donné, plafonné à une ville standard (40).
     * @see NightlyHandler::stage2_attack ($in_town)
     */
    private getTargettedCitizen(day: number): string {
        const targeted: number = Math.min(10 + 2 * Math.floor(Math.max(0, day - 10) / 2), 40);
        return formatNumber(targeted, this.locale, '1.0-0');
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

        return formatNumber(chances * 100, this.locale, '1.0-2') + '%';
    }

}
