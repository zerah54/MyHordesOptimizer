import { CommonModule, formatNumber } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { Misc } from '../../../_abstract_model/interfaces';
import { Imports } from '../../../_abstract_model/types/_types';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule];

@Component({
    selector: 'mho-max-active-calculator',
    templateUrl: './max-active-calculator.component.html',
    styleUrls: ['./max-active-calculator.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes, MatCheckbox],
})
export class MaxActiveCalculatorComponent implements OnInit {

    public readonly locale: string = moment.locale();

    public nb_citizen: number = 40;
    public habitation_max_level: number = 0;
    public guitar_played: boolean = false;
    public day: number = 1;
    public my_town: TownDetails | null = getTown();

    public max_active_by_day: Misc = {
        header: '',
        highlight_day: true,
        columns: [
            {id: 'header', header: $localize`Jour`},
            ...Array.from({length: 50}, (_: unknown, i: number) => {
                return {id: '' + (i + 1), header: '' + (i + 1)};
            })
        ],
        table: new MatTableDataSource()
    };

    public ngOnInit(): void {
        this.buildDatasource();
    }

    protected getMaxActiveZombies(day: number): string {
        const min_active: number = Math.round((Math.max(10, this.nb_citizen) / 3.0) * day * (this.habitation_max_level + 1) * (this.guitar_played ? 1.1 : 1.0));
        const max_active: number = Math.round((Math.max(10, this.nb_citizen) / 3.0) * day * (this.habitation_max_level + 1.5) * (this.guitar_played ? 1.1 : 1.0));
        return formatNumber(min_active, this.locale, '1.0-2') + ' - ' + formatNumber(max_active, this.locale, '1.0-2');
    }

    private getTargettedCitizen(day: number): string {
        const max_targetted: number = Math.min(10 + 2 * Math.floor(Math.max(0, day - 10) / 2), Math.ceil(40));
        return formatNumber(max_targetted, this.locale, '1.0-2');
    }

    protected buildDatasource(): void {
        this.max_active_by_day.table = new MatTableDataSource([
            <{ [key: string]: string | number | null; }>{
                ...{header: $localize`Débordement maximum`},
                ...Array.from({length: 50}, (_: unknown, i: number) => {
                    return {key: '' + (i + 1), value: this.getMaxActiveZombies(i + 1)};
                }).reduce((r: Record<string, string>, e: { key: string, value: string }) => {
                    r[e.key] = e.value;
                    return r;
                }, {})
            },
            <{ [key: string]: string | number | null; }>{
                ...{header: $localize`Citoyens maximum attaqués`},
                ...Array.from({length: 50}, (_: unknown, i: number) => {
                    return {key: '' + (i + 1), value: this.getTargettedCitizen(i + 1)};
                }).reduce((r: Record<string, string>, e: { key: string, value: string }) => {
                    r[e.key] = e.value;
                    return r;
                }, {})
            },
        ]);
    }
}
