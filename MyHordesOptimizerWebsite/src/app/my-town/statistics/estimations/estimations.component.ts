import { Component, HostBinding, OnInit } from '@angular/core';
import { getTown } from '../../../shared/utilities/localstorage.util';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { MatTableDataSource } from '@angular/material/table';
import { Regen } from '../../../_abstract_model/types/regen.class';

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss']
})
export class EstimationsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public readonly tdg_values: number[] = TDG_VALUES;
    public readonly planif_values: number[] = PLANIF_VALUES;
    public readonly current_day: number = getTown()?.day || 1;

    public selected_day: number = this.current_day;
    public estimations!: Estimations;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();

    constructor(private api: ApiServices) {
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    /** Enregistre les estimations saisies */
    public saveEstimations(): void {
        this.api.saveEstimations(this.estimations).subscribe();
    }

    public getEstimations(): void {
        this.api.getEstimations(this.selected_day).subscribe((estimations: Estimations) => {
            this.estimations = estimations;
        });
    }
}
