import { CommonModule, NgClass } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { DigsService } from '../../../_abstract_model/services/digs.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { CitizenInfoComponent } from '../../../shared/elements/citizen-info/citizen-info.component';
import { DigComponent } from '../../../shared/elements/dig/dig.component';
import {
    HeaderWithNumberPreviousNextFilterComponent
} from '../../../shared/elements/lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from '../../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown } from '../../../shared/utilities/localstorage.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgClass];
const components: Imports = [DigComponent, HeaderWithNumberPreviousNextFilterComponent, HeaderWithSelectFilterComponent, CitizenInfoComponent];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatSortModule, MatTableModule];


@Component({
    selector: 'mho-citizens-digs',
    templateUrl: './citizens-digs.component.html',
    styleUrls: ['./citizens-digs.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensDigsComponent implements OnInit {

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La liste des fouilles */
    public digs!: Dig[];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<DigsByCitizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true},
        {id: 'today_digs', header: $localize`Fouilles du jour`, class: ''},
    ];
    public readonly current_day: number = getTown()?.day || 1;
    public filters: DigFilter = {
        selected_day: this.current_day,
        citizen: []
    };
    /** La fouille qu'on est en train de modifier */
    public dig_to_update!: Dig | undefined;

    private readonly digs_service: DigsService = inject(DigsService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);


    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.createDigsByCitizenAndDay();
        this.citizen_filter_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.filters);
                this.createDigsByCitizenAndDay();
            });

        this.datasource.filterPredicate = (data: DigsByCitizen, filter: string): boolean => this.customFilter(data, filter);
        this.getDigs();

        this.getCitizens();
    }

    protected deletedDig(dig_to_delete: Dig): void {
        const delete_dig: number = this.digs.findIndex((dig: Dig) => {
            return dig.cell_id === dig_to_delete?.cell_id
                && dig.digger_id === dig_to_delete?.digger_id
                && dig.day === dig_to_delete?.day;
        });
        this.digs.splice(delete_dig, 1);
        this.createDigsByCitizenAndDay();
    }

    protected updatedDig(new_digs: Dig[]): void {
        const replace_dig: number = this.digs.findIndex((dig: Dig) => {
            return dig.cell_id === new_digs[0].cell_id
                && dig.digger_id === new_digs[0].digger_id
                && dig.day === new_digs[0].day;
        });

        if (replace_dig > -1) {
            this.digs[replace_dig] = new_digs[0];
        } else {
            this.digs.push(new_digs[0]);
        }

        this.dig_to_update = undefined;
        this.createDigsByCitizenAndDay();
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: DigsByCitizen, filter: string): boolean {
        const filter_object: DigFilter = JSON.parse(filter.toLowerCase());
        if (!filter_object.citizen || filter_object.citizen.length === 0) return true;
        if (filter_object.citizen.some((citizen: Citizen) => citizen.id === data.citizen.id)) return true;
        return false;
    }

    private getDigs(): void {
        this.digs_service
            .getDigs()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (digs: Dig[]) => {
                    this.digs = digs;
                    this.createDigsByCitizenAndDay();
                }
            });
    }

    private createDigsByCitizenAndDay(): void {
        if (this.digs && this.citizen_info) {

            this.datasource.data = [...this.citizen_info.citizens.map((citizen: Citizen) => {
                return {
                    citizen: citizen,
                    digs: this.digs.filter((dig: Dig) => dig.digger_id === citizen.id && dig.day === this.filters.selected_day)
                };
            })];
        }
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    citizen_info.citizens = citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_dead);
                    this.citizen_info = citizen_info;
                    this.createDigsByCitizenAndDay();
                }
            });
    }
}

interface DigsByCitizen {
    citizen: Citizen;
    digs: Dig[];
}

interface DigFilter {
    citizen: Citizen[];
    selected_day: number;
}
