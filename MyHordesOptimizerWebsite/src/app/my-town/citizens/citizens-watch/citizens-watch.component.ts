import { CommonModule, NgClass } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Bath } from '../../../_abstract_model/types/bath.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { CitizenInfoComponent } from '../../../shared/elements/citizen-info/citizen-info.component';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from '../../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';
import { BathForDayPipe } from '../bath-for-day.pipe';
import { CitizenGroupByBathStatePipe } from './citizen-group-by-bath_state.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule, NgClass];
const components: Imports = [HeaderWithNumberPreviousNextFilterComponent, HeaderWithSelectFilterComponent, CitizenInfoComponent];
const pipes: Imports = [BathForDayPipe, CitizenGroupByBathStatePipe, ColumnIdPipe];
const material_modules: Imports = [MatCheckboxModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatButtonToggleModule];

@Component({
    selector: 'mho-citizens-watch',
    templateUrl: './citizens-watch.component.html',
    styleUrls: ['./citizens-watch.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensWatchComponent implements OnInit {

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true},
        ...Array.from({length: getTown()?.day || 1}, (_: unknown, i: number): StandardColumn => {
            return {
                id: (i + 1).toString(10),
                header: $localize`Jour` + ' ' + (i + 1).toString(10),
                class: '',
                sticky: false
            };
        }),
    ];
    public readonly current_day: number = getTown()?.day || 1;
    public filters: WatchFilter = {
        citizen: []
    };
    public list_mode: boolean = false;
    public display_pseudo: 'simple' | 'mh_id' = 'simple';
    public selected_day: number = this.current_day;

    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.createBathsByCitizenAndDay();
        this.citizen_filter_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.filters);
                this.createBathsByCitizenAndDay();
            });

        this.datasource.filterPredicate = (data: Citizen, filter: string): boolean => this.customFilter(data, filter);

        this.getCitizens();
    }

    public saveBath(citizen: Citizen, event: MatCheckboxChange, day: number): void {
        const bath_to_update_index: number = citizen.baths.findIndex((bath: Bath) => bath.day === day);
        if (event.checked) {
            this.town_service
                .addBath(citizen, day)
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (bath_to_update_index > -1) {
                            citizen.baths[bath_to_update_index].update_info = update_info;
                        } else {
                            citizen.baths.push(new Bath({day: day, lastUpdateInfo: update_info.modelToDto()}));
                        }
                    }
                });
        } else {
            this.town_service
                .removeBath(citizen)
                .subscribe(() => {
                    if (bath_to_update_index > -1) {
                        citizen.baths.splice(bath_to_update_index, 1);
                    }
                });
        }
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
            .pipe(takeUntilDestroyed(this.destroy_ref))
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
