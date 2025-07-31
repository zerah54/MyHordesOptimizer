import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, InputSignal, input, InputSignalWithTransform, booleanAttribute, OutputEmitterRef, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Imports } from '../../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule];

@Component({
    selector: 'mho-header-with-number-previous-next-filter',
    templateUrl: './header-with-number-previous-next-filter.component.html',
    styleUrls: ['./header-with-number-previous-next-filter.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderWithNumberPreviousNextFilterComponent implements OnInit {

    @ViewChild('filter') filter!: ElementRef<HTMLInputElement>;

    public header: InputSignal<string> = input('');
    public textAlign: InputSignal<string> = input('left');
    public displayFirstLast: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    public min: InputSignal<number> = input(1);
    public max: InputSignal<number> = input(1);

    public filterValue: InputSignal<number> = input.required();
    public filterValueChange: OutputEmitterRef<number> = output();

    public visible: boolean = false;

    public ngOnInit(): void {
        this.checkVisibility();
    }

    /** Affiche le filtre */
    public displayFilter(): void {
        this.visible = true;
        setTimeout(() => {
            this.filter.nativeElement.focus();
        });
    }

    /** Vérifie si le filtre doit toujours être affiché */
    public checkVisibility(): void {
        this.visible = this.filterValue() !== null && this.filterValue() !== undefined;
    }
}

