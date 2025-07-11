import { Component, output, OutputEmitterRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule, MatInputModule];

@Component({
    selector: 'mho-filter',
    templateUrl: './filter-field.component.html',
    styleUrls: ['./filter-field.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class FilterFieldComponent {

    public filterChange: OutputEmitterRef<string> = output();

    public filter_value: string = '';

    public applyFilter(value: string): void {
        this.filterChange.emit(value);
    }
}

