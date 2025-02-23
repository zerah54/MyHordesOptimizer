import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { I18nLabels, Imports } from '../../_abstract_model/types/_types';
import { private_town_params, PrivateTownParamOptions, PrivateTownParams } from './private-towns-params.const';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatTableModule, MatIconModule, MatTooltipModule];

@Component({
    selector: 'mho-private-towns',
    templateUrl: './private-towns.component.html',
    styleUrls: ['./private-towns.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class PrivateTownsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<FlattenedPrivateTownData> = new MatTableDataSource();
    /** La liste des colonnes à afficher */
    public displayed_columns: string[] = ['name', 'option_name', 'option_description', 'default_rne', 'default_re', 'default_pande'];

    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'icon', header: ''},
        {id: 'label', header: $localize`Pouvoir`, sticky: true},
        {id: 'days_needed', header: $localize`Jours héros nécessaires`},
        {id: 'description', header: $localize`Description`}
    ];

    public ngOnInit(): void {
        const flattened_data: FlattenedPrivateTownData[] = this.flattenData(private_town_params);
        this.datasource = new MatTableDataSource(flattened_data);
    }

    public getRowSpan(column: string, index: number): number {
        if (column === 'name') {
            return this.datasource.data.filter(
                (row: FlattenedPrivateTownData, i: number) => i < index && row.name === this.datasource.data[index].name
            ).length === 0
                ? this.datasource.data.filter((row: FlattenedPrivateTownData) => row.name === this.datasource.data[index].name).length
                : 0;
        }
        return 1;
    }

    private flattenData(data: PrivateTownParams[]): FlattenedPrivateTownData[] {
        return data.flatMap((param: PrivateTownParams) =>
            param.options.map((option: PrivateTownParamOptions) => ({
                name: param.name,
                option_name: option.name,
                option_description: option.description,
                default_rne: option.default_rne,
                default_re: option.default_re,
                default_pande: option.default_pande,
                disabled_rne: option.disabled_rne || param.disabled_rne,
                disabled_re: option.disabled_re || param.disabled_re,
                disabled_pande: option.disabled_pande || param.disabled_pande
            }))
        );
    }
}

interface FlattenedPrivateTownData {
    name: I18nLabels;
    option_name: I18nLabels;
    option_description: I18nLabels;
    default_rne: boolean;
    default_re: boolean;
    default_pande: boolean;
    disabled_rne: boolean;
    disabled_re: boolean;
    disabled_pande: boolean;
}
