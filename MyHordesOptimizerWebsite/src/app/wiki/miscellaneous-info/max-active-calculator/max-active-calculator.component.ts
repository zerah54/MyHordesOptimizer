import { CommonModule, formatNumber } from '@angular/common';
import { Component, HostBinding, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as moment from 'moment';
import { Misc } from '../../../_abstract_model/interfaces';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';

@Component({
    selector: 'mho-max-active-calculator',
    templateUrl: './max-active-calculator.component.html',
    styleUrls: ['./max-active-calculator.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatButtonModule,
        MatDialogClose,
        MatIconModule,
        MatDialogContent,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ColumnIdPipe,
        MatTableModule,
    ],
})
export class MaxActiveCalculatorComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public nb_citizen: number = 40;
    public day: number = 1;
    public my_town: TownDetails | null = getTown();

    public max_active_by_day: Misc = {
        header: '',
        highlight_day: true,
        columns: [
            { id: 'header', header: $localize`Jour` },
            ...Array.from({ length: 50 }, (_: unknown, i: number) => {
                return { id: '' + (i + 1), header: '' + (i + 1) };
            })
        ],
        table: new MatTableDataSource()
    };

    public ngOnInit(): void {
        this.buildDatasource();
    }

    protected getMaxActiveZombies(day: number): string {
        const max_active: number = Math.round((+day + 1) * Math.max(1.0, (+day + 1) / 10)) * this.nb_citizen;
        return formatNumber(max_active, this.locale, '1.0-2');
    }

    protected buildDatasource(): void {
        this.max_active_by_day.table = new MatTableDataSource([
            <{ [key: string]: string | number | null; }>{
                ...{ header: $localize`Débordement maximum` },
                ...Array.from({ length: 50 }, (_: unknown, i: number) => {
                    return { key: '' + (i + 1), value: this.getMaxActiveZombies(i + 1) };
                }).reduce((r: Record<string, string>, e: { key: string, value: string }) => {
                    r[e.key] = e.value;
                    return r;
                }, {})
            }
        ]);
    }
}
