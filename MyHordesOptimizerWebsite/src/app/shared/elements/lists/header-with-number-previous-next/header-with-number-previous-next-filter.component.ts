import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild } from '@angular/core';
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
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeaderWithNumberPreviousNextFilterComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild('filter') filter!: ElementRef<HTMLInputElement>;

    @Input() header!: string;
    @Input() textAlign?: string = 'left';
    @Input({required: true}) displayFirstLast: boolean = false;

    @Input() min: number = 1;
    @Input() max: number = 1;


    @Input() filterValue!: number;
    @Output() filterValueChange: EventEmitter<number> = new EventEmitter<number>();

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
        this.visible = this.filterValue !== null && this.filterValue !== undefined;
    }
}

