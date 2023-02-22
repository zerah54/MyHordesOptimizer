import { Component, HostBinding, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Cell } from 'src/app/_abstract_model/types/cell.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';

@Component({
    selector: 'mho-map-update-ruin',
    templateUrl: './map-update-ruin.component.html',
    styleUrls: ['./map-update-ruin.component.scss']
})
export class MapUpdateRuinComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @Input() ruin!: Ruin;
    @Input() allRuins!: Ruin[];
    @Input() cell!: Cell;

    @Output() cellChange: EventEmitter<Cell> = new EventEmitter()

    public nb_search_ruin_success!: number;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    public cell_form!: FormGroup;

    constructor(private fb: FormBuilder) {

    }

    public ngOnInit(): void {

        this.cell_form = this.fb.group({
            // nb_ruin_success: [this.cell.nb_ruin_success],
            nb_eruin_yellow: [this.cell.nb_eruin_yellow],
            nb_eruin_blue: [this.cell.nb_eruin_blue],
            nb_eruin_violet: [this.cell.nb_eruin_violet],
            nb_ruin_dig: [this.cell.nb_ruin_dig],
            is_ruin_dryed: [this.cell.is_ruin_dryed]
        })

        this.cell_form.valueChanges.subscribe((values: RuinInfoUpdate) => {
            // this.cell.nb_ruin_success = values.nb_ruin_success;
            this.cell.nb_eruin_yellow = +values.nb_eruin_yellow;
            this.cell.nb_eruin_blue = +values.nb_eruin_blue;
            this.cell.nb_eruin_violet = +values.nb_eruin_violet;
            this.cell.nb_ruin_dig = +values.nb_ruin_dig;
            this.cellChange.next(this.cell);
        })
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
