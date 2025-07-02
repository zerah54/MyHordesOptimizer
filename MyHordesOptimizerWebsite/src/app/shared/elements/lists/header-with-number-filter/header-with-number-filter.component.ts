import { CommonModule } from '@angular/common';
import { Component, ElementRef, output, OutputEmitterRef, ViewChild, InputSignal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Imports } from '../../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule, MatIconModule, MatInputModule];

@Component({
    selector: 'mho-header-with-number-filter',
    templateUrl: './header-with-number-filter.component.html',
    styleUrls: ['./header-with-number-filter.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderWithNumberFilterComponent {

    @ViewChild('filter') filter!: ElementRef<HTMLInputElement>;

    public header: InputSignal<string> = input.required();
    public textAlign: InputSignal<string> = input('left');

    public filterValue: InputSignal<number | string> = input.required();
    public filterValueChange: OutputEmitterRef<number | string> = output();


    public visible: boolean = false;

    /** Affiche le filtre */
    public displayFilter(): void {
        this.visible = true;
        setTimeout(() => {
            this.filter.nativeElement.focus();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility(): void {
        this.visible = this.filterValue() !== '' && this.filterValue() !== null && this.filterValue() !== undefined;
    }
}

