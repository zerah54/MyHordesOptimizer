import { CitizenInfo } from './../../_abstract_model/types/citizen-info.class';
import { Citizen } from './../../_abstract_model/types/citizen.class';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { MatSort } from '@angular/material/sort';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import * as moment from 'moment';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss']
})
export class CitizensComponent {
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();
    /** La liste des colonnes */
    public readonly columns: CitizenColumn[] = [
        { id: 'avatar', header: $localize`Avatar` },
        { id: 'name', header: $localize`Nom du citoyen` },
        { id: 'home_message', header: $localize`Message` },
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: CitizenColumn) => column.id);

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;
        this.datasource.filterPredicate = (data: Citizen, filter: string) => this.customFilter(data, filter);
        this.getCitizens();
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {
        if (data.name.toLowerCase().indexOf(filter.toLowerCase()) > -1) return true;
        return false;
    }

    private getCitizens(): void {
        this.api.getCitizens().subscribe((citizen_info: CitizenInfo) => {
            console.log('citizen_info', citizen_info);
            this.citizen_info = citizen_info;
            this.datasource.data = [...citizen_info.citizens];
        });
    }
}


interface CitizenColumn {
    header: string;
    id: string;
}

