import { Component, ElementRef, EventEmitter, HostBinding, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { getTown } from '../../../shared/utilities/localstorage.util';


@Component({
    selector: 'mho-citizens-dispo',
    templateUrl: './citizens-dispo.component.html',
    styleUrls: ['./citizens-dispo.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensDispoComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<DispoByCitizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center' },
        { id: 'today_dispo', header: $localize`Disponibilités du jour`, class: '' },
    ];
    public readonly current_day: number = getTown()?.day || 1;
    public filters: DispoFilter = {
        selected_day: this.current_day,
        citizen: []
    };

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }


    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.citizen_filter_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.filters);
            });

        this.datasource.filterPredicate = (data: DispoByCitizen, filter: string): boolean => this.customFilter(data, filter);

        this.getCitizens();
    }

    public trackByColumnId(_index: number, column: StandardColumn): string {
        return column.id;
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: DispoByCitizen, filter: string): boolean {
        const filter_object: DispoFilter = JSON.parse(filter.toLowerCase());
        if (!filter_object.citizen || filter_object.citizen.length === 0) return true;
        if (filter_object.citizen.some((citizen: Citizen) => citizen.id === data.citizen.id)) return true;
        return false;
    }

    private getCitizens(): void {
        this.api.getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((citizen_info: CitizenInfo) => {
                citizen_info.citizens = citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_dead);
                this.citizen_info = citizen_info;
            });
    }
}

interface DispoByCitizen {
    citizen: Citizen;
    dispo: Dig[];
}

interface DispoFilter {
    citizen: Citizen[];
    selected_day: number;
}
