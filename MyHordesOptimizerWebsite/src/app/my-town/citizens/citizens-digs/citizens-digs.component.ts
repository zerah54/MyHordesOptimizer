import { Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DigsServices } from '../../../_abstract_model/services/digs.service';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { getTown } from '../../../shared/utilities/localstorage.util';


@Component({
    selector: 'mho-citizens-digs',
    templateUrl: './citizens-digs.component.html',
    styleUrls: ['./citizens-digs.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensDigsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;


    @Input() set citizenInfo(citizen_info: CitizenInfo) {
        this.citizen_info = citizen_info;
        this.createDigsByCitizenAndDay();
    }

    @Output() citizenInfoChange: EventEmitter<void> = new EventEmitter();

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La liste des fouilles */
    public digs!: Dig[];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<DigsByCitizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: CitizenColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center' },
        { id: 'today_digs', header: $localize`Fouilles du jour`, class: '' },
    ];
    public readonly current_day: number = getTown()?.day || 1;
    public filters: DigFilter = {
        selected_day: this.current_day,
        citizen: []
    };
    /** La fouille qu'on est en train de modifier */
    public dig_to_update!: Dig | undefined;

    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: CitizenColumn) => column.id);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private digs_api: DigsServices) {

    }

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.createDigsByCitizenAndDay();
        this.citizen_filter_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.filters);
                this.createDigsByCitizenAndDay();
            });

        this.datasource.filterPredicate = (data: DigsByCitizen, filter: string): boolean => this.customFilter(data, filter);
        this.getDigs();
    }

    public updateDig(): void {
        if (this.dig_to_update) {
            this.digs_api.updateDig([this.dig_to_update])
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((new_digs: Dig[]) => {
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
                });
        }
    }

    public changeDigToUpdate(citizen: Citizen, dig?: Dig): void {
        this.dig_to_update = undefined;
        if (dig) {
            this.dig_to_update = new Dig(dig.modelToDto());
        } else {
            this.dig_to_update = new Dig({
                cellId: undefined,
                day: this.filters.selected_day,
                diggerId: citizen.id,
                diggerName: citizen.name,
                nbSucces: 0,
                nbTotalDig: 0,
                x: getTown()?.town_x || 0,
                y: getTown()?.town_y || 0
            });
        }
    }

    public trackByColumnId(_index: number, column: CitizenColumn): string {
        return column.id;
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
        this.digs_api.getDigs()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((digs: Dig[]) => {
                this.digs = digs;
                this.createDigsByCitizenAndDay();
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
}


interface CitizenColumn {
    header: string;
    id: string;
    class?: string;
}

interface DigsByCitizen {
    citizen: Citizen;
    digs: Dig[];
}

interface DigFilter {
    citizen: Citizen[];
    selected_day: number;
}
