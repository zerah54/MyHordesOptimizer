import { CommonModule, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, input, InputSignal, OnInit, output, OutputEmitterRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Ruin } from '../../../../../_abstract_model/types/ruin.class';
import { FilterRuinsByKmPipe } from '../../../../../shared/pipes/filter-ruins-by-km.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage, ReactiveFormsModule];
const components: Imports = [];
const pipes: Imports = [DecimalPipe, FilterRuinsByKmPipe];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatListModule];

@Component({
    selector: 'mho-map-update-ruin',
    templateUrl: './map-update-ruin.component.html',
    styleUrls: ['./map-update-ruin.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateRuinComponent implements OnInit {

    public ruin: InputSignal<Ruin> = input.required();
    public allRuins: InputSignal<Ruin[]> = input.required();

    public cell: InputSignal<Cell> = input.required();
    public cellChange: OutputEmitterRef<Cell> = output();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    public cell_form!: FormGroup;

    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(private fb: FormBuilder) {

    }

    public ngOnInit(): void {

        this.cell_form = this.fb.group({
            // nb_ruin_success: [this.cell.nb_ruin_success],
            nb_eruin_yellow: [this.cell().nb_eruin_yellow],
            nb_eruin_blue: [this.cell().nb_eruin_blue],
            nb_eruin_violet: [this.cell().nb_eruin_violet],
            nb_ruin_dig: [this.cell().nb_ruin_dig],
            is_ruin_dryed: [this.cell().is_ruin_dryed]
        });

        this.cell_form.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((values: RuinInfoUpdate) => {
                // this.cell.nb_ruin_success = values.nb_ruin_success;
                let new_cell: Cell = this.cell();
                new_cell.nb_eruin_yellow = +values.nb_eruin_yellow;
                new_cell.nb_eruin_blue = +values.nb_eruin_blue;
                new_cell.nb_eruin_violet = +values.nb_eruin_violet;
                new_cell.nb_ruin_dig = +values.nb_ruin_dig;
                this.cellChange.emit(new_cell);
            });
    }
}


interface RuinInfoUpdate {
    nb_ruin_dig: number;
    is_ruin_dryed: boolean;
    nb_ruin_success: number;
    nb_eruin_yellow: number;
    nb_eruin_blue: number;
    nb_eruin_violet: number;
}
