import { Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { getTown } from 'src/app/shared/utilities/localstorage.util';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { CitizenInfo } from 'src/app/_abstract_model/types/citizen-info.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Dig } from 'src/app/_abstract_model/types/dig.class';


@Component({
    selector: 'mho-citizens-digs',
    templateUrl: './citizens-digs.component.html',
    styleUrls: ['./citizens-digs.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensDigsComponent {
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
    public locale: string = moment.locale();
    public citizen_filters: Citizen[] = [];
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: CitizenColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center' },
        { id: 'today_digs', header: $localize`Fouilles du jour`, class: '' },
    ];
    public current_day: number = getTown()?.day || 1;
    public filters: DigFilter = {
        selected_day: this.current_day,
        citizen: []
    }
    /** La fouille qu'on est en train de modifier */
    public dig_to_update!: Dig | undefined;
    /** La liste des jours passés */
    public avalaible_days: number[] = Array.from({ length: this.filters.selected_day }, (_, i) => { return i + 1 });

    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: CitizenColumn) => column.id);

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.citizen_filter_change.subscribe(() => {
            this.datasource.filter = JSON.stringify(this.citizen_filters);
            this.createDigsByCitizenAndDay();
        });

        this.datasource.filterPredicate = (data: DigsByCitizen, filter: string) => this.customFilter(data, filter);
        this.getDigs();
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    public deleteDig(dig_to_delete: Dig) {
        this.api.deleteDig(dig_to_delete).subscribe(() => {
            let delete_dig: number = this.digs.findIndex((dig: Dig) => {
                return dig.cell_id === dig_to_delete?.cell_id
                    && dig.digger_id === dig_to_delete?.digger_id
                    && dig.day === dig_to_delete?.day
            });

            this.digs.splice(delete_dig, 1);
            this.createDigsByCitizenAndDay()
        });
    }

    public updateDig() {
        if (this.dig_to_update) {
            this.api.updateDig(this.dig_to_update).subscribe((new_dig: Dig) => {
                let replace_dig: number = this.digs.findIndex((dig: Dig) => {
                    return dig.cell_id === new_dig?.cell_id
                        && dig.digger_id === new_dig?.digger_id
                        && dig.day === new_dig?.day
                });

                if (replace_dig > -1) {
                    this.digs[replace_dig] = new_dig;
                } else {
                    this.digs.push(new_dig);
                }

                this.dig_to_update = undefined;
                this.createDigsByCitizenAndDay();
            });
        }
    }

    public changeDigToUpdate(citizen: Citizen, dig?: Dig) {
        this.dig_to_update = undefined;
        if (dig) {
            this.dig_to_update = new Dig(dig.modelToDto())
        } else {
            this.dig_to_update = new Dig({
                cellId: undefined,
                day: this.filters.selected_day,
                diggerId: citizen.id,
                diggerName: citizen.name,
                nbSucces: 0,
                nbTotalDig: 0,
                x: 0 + (getTown()?.town_x || 0),
                y: 0 + (getTown()?.town_y || 0)
            });
        }
    }

    public changeDay() {
        this.createDigsByCitizenAndDay();
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: DigsByCitizen, filter: string): boolean {
        let filter_object: DigFilter = JSON.parse(filter.toLowerCase());
        if (!filter_object.citizen || filter_object.citizen.length === 0) return true;
        if (filter_object.citizen.some((citizen: Citizen) => citizen.id === data.citizen.id)) return true;
        return false;
    }

    private getDigs(): void {
        this.api.getDigs().subscribe((digs: Dig[]) => {
            this.digs = digs;
            this.createDigsByCitizenAndDay();
        });
    }

    private createDigsByCitizenAndDay() {
        if (this.digs && this.citizen_info) {

            this.datasource.data = [...this.citizen_info.citizens.map((citizen: Citizen) => {
                return {
                    citizen: citizen,
                    digs: this.digs.filter((dig: Dig) => dig.digger_id === citizen.id && dig.day === this.filters.selected_day)
                }
            })]
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
