import { CommonModule, formatNumber } from '@angular/common';
import { Component, HostBinding, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { LocalStorageService } from '../../../shared/services/localstorage.service';
import { getTown } from '../../../shared/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule];

@Component({
    selector: 'mho-max-active-calculator',
    templateUrl: './max-active-calculator.component.html',
    styleUrls: ['./max-active-calculator.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class MaxActiveCalculatorComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    private local_storage: LocalStorageService = inject(LocalStorageService);

    public readonly locale: string = moment.locale();

    public nb_citizen: number = 40;
    public day: number = 1;
    public my_town: TownDetails | null = getTown(this.local_storage);

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
        const max_active: number = Math.round((+day + 1) * Math.max(1.0, (+day + 1) / 10)) * Math.max(15, this.nb_citizen);
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
