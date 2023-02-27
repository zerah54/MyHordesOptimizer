import { Component, HostBinding, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { Regen } from 'src/app/_abstract_model/types/regen.class';
import { ApiServices } from '../../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-scrutateur',
    templateUrl: './scrutateur.component.html',
    styleUrls: ['./scrutateur.component.scss']
})
export class ScrutateurComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Regen> = new MatTableDataSource();
    /** La liste des colonnes */
    public columns: RegenColumn[] = [
        { id: 'day', label: $localize`Jour`, class: '' },
        { id: 'direction_regen', label: $localize`Direction`, class: '' },
        { id: 'level_regen', label: $localize`Niveau`, class: '' },
        { id: 'taux_regen', label: $localize`Taux`, class: '' }
    ];

    /** La liste des id des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: RegenColumn) => column.id);
    private readonly locale: string = moment.locale();

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getScrutList()
        .pipe(takeUntil(this.destroy_sub))
        .subscribe((regens: Regen[]) => {
            this.datasource.data = [...regens];
        });
    }

    public trackByColumnId(index: number, column: RegenColumn): string {
        return column.id;
    }
}

interface RegenColumn {
    id: string;
    label: string;
    class: string;
}
