import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Imports } from '../../../../_abstract_model/types/_types';
import { SelectComponent } from '../../select/select.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [SelectComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule, MatIconModule];

@Component({
    selector: 'mho-header-with-select-filter',
    templateUrl: './header-with-select-filter.component.html',
    styleUrls: ['./header-with-select-filter.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderWithSelectFilterComponent<T> {

    @ViewChild('filter') filter!: SelectComponent<T>;

    @Input() header!: string;
    @Input() textAlign?: string = 'left';

    @Input() options: T[] = [];
    @Input() bindLabel: string = 'label';

    @Input() filterValue!: T[];
    @Output() filterValueChange: EventEmitter<T[]> = new EventEmitter<T[]>();


    public visible: boolean = false;

    /** Affiche le filtre */
    public displayFilter(): void {
        this.visible = true;
        setTimeout(() => {
            this.filter.select.open();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility(): void {
        setTimeout(() => {
            if (this.filter.select.panelOpen) {
                this.visible = true;
            } else {
                this.visible = this.filterValue !== null && this.filterValue !== undefined && this.filterValue.length > 0;
            }
        });
    }

}

