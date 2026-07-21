import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, OnInit, Signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { ColumnIdPipe } from '../../../_core/pipes/column-id.pipe';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { CitizenInfoComponent } from '../../../_shared/citizen-info/citizen-info.component';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../_shared/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from '../../../_shared/lists/header-with-select-filter/header-with-select-filter.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [AvatarComponent, HeaderWithNumberPreviousNextFilterComponent, HeaderWithSelectFilterComponent, CitizenInfoComponent];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatSortModule, MatTableModule];


@Component({
    selector: 'mho-citizens-dispo',
    templateUrl: './citizens-dispo.component.html',
    styleUrls: ['./citizens-dispo.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensDispoComponent implements OnInit {

    private readonly sort: Signal<MatSort> = viewChild.required(MatSort);
    public readonly table: Signal<MatTable<DispoByCitizen>> = viewChild.required(MatTable);

    /** La liste des citoyens */
    protected citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    protected datasource: MatTableDataSource<DispoByCitizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    protected citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    protected readonly columns: StandardColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center' },
        { id: 'today_dispo', header: $localize`Disponibilités du jour`, class: '' },
    ];
    protected readonly current_day: number = getTown()?.day || 1;
    protected filters: DispoFilter = {
        selected_day: this.current_day,
        citizen: []
    };

    private town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort();

        this.citizen_filter_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
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
            .pipe(takeUntilDestroyed(this.destroy_ref))
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
