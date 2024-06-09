import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, HostBinding, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from '../../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, NgClass];
const components: Imports = [HeaderWithNumberPreviousNextFilterComponent, HeaderWithSelectFilterComponent];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatSortModule, MatTableModule];


@Component({
    selector: 'mho-citizens-dispo',
    templateUrl: './citizens-dispo.component.html',
    styleUrls: ['./citizens-dispo.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensDispoComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;

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

    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

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

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: DispoByCitizen, filter: string): boolean {
        const filter_object: DispoFilter = JSON.parse(filter.toLowerCase());
        if (!filter_object.citizen || filter_object.citizen.length === 0) return true;
        if (filter_object.citizen.some((citizen: Citizen) => citizen.id === data.citizen.id)) return true;
        return false;
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
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
