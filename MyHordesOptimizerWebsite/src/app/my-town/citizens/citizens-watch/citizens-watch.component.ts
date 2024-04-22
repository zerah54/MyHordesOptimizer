import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, HostBinding, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownService } from '../../../_abstract_model/services/town.service';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { DigComponent } from '../../../shared/elements/dig/dig.component';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from '../../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';


@Component({
    selector: 'mho-citizens-watch',
    templateUrl: './citizens-watch.component.html',
    styleUrls: ['./citizens-watch.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatTableModule, MatSortModule, CommonModule, NgClass, HeaderWithSelectFilterComponent, HeaderWithNumberPreviousNextFilterComponent, DigComponent, ColumnIdPipe]
})
export class CitizensWatchComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true },
        ...Array.from({ length: getTown()?.day || 1 }, (_: unknown, i: number): StandardColumn => {
            return {
                id: (i + 1).toString(10),
                header: (i + 1).toString(10),
                class: '',
                sticky: false
            };
        }),
    ];
    public readonly current_day: number = getTown()?.day || 1;
    public filters: WatchFilter = {
        citizen: []
    };

    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.createBathsByCitizenAndDay();
        this.citizen_filter_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.filters);
                this.createBathsByCitizenAndDay();
            });

        this.datasource.filterPredicate = (data: Citizen, filter: string): boolean => this.customFilter(data, filter);

        this.getCitizens();
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {
        const filter_object: WatchFilter = JSON.parse(filter.toLowerCase());
        if (!filter_object.citizen || filter_object.citizen.length === 0) return true;
        if (filter_object.citizen.some((citizen: Citizen) => citizen.id === data.id)) return true;
        return false;
    }

    private createBathsByCitizenAndDay(): void {
        if (this.citizen_info) {
            this.datasource.data = [...this.citizen_info.citizens];
        }
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    this.citizen_info = citizen_info;
                    this.createBathsByCitizenAndDay();
                }
            });
    }
}

interface WatchFilter {
    citizen: Citizen[];
}
