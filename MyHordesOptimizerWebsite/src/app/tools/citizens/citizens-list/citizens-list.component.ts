import { Component, ElementRef, EventEmitter, HostBinding, ViewChild, ViewEncapsulation, Input, Output } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { getUser } from 'src/app/shared/utilities/localstorage.util';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { StatusEnum } from 'src/app/_abstract_model/enum/status.enum';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { CitizenInfo } from 'src/app/_abstract_model/types/citizen-info.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { UpdateInfo } from 'src/app/_abstract_model/types/update-info.class';

@Component({
    selector: 'mho-citizens-list',
    templateUrl: './citizens-list.component.html',
    styleUrls: ['./citizens-list.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensListComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;

    @Input() set citizenInfo(citizen_info: CitizenInfo) {
        if (citizen_info) {
            this.citizen_info = citizen_info;
            this.datasource.data = [...citizen_info.citizens];
        }
    }

    @Output() citizenInfoChange: EventEmitter<void> = new EventEmitter();

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** La liste complète des items */
    public all_items: Item[] = [];
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public locale: string = moment.locale();
    /** Les filtres de la liste des citoyens */
    public citizen_filters: Citizen[] = [];
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly columns: CitizenColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center' },
        { id: 'more_status', header: $localize`États`, class: '' },
        { id: 'heroic_actions', header: $localize`Actions héroïques`, class: '' },
        { id: 'home', header: $localize`Améliorations`, class: '' },
        // { id: 'chest', header: $localize`Coffre` },
    ];

    public readonly all_status: StatusEnum[] = StatusEnum.getAllValues();
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: CitizenColumn) => column.id);

    constructor(private api: ApiServices) {
    }

    ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.datasource.sort = this.sort;

        this.citizen_filter_change.subscribe(() => {
            this.datasource.filter = JSON.stringify(this.citizen_filters);
        });

        this.datasource.filterPredicate = (data: Citizen, filter: string) => this.customFilter(data, filter);

        this.api.getItems().subscribe((items: Item[]) => this.all_items = items)
    }

    /** Filtre la liste à afficher */
    public applyFilter(value: string): void {
        this.datasource.filter = value.trim().toLowerCase();
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    public addItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id))

            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.bag.update_info.username = getUser().username;
                citizen.bag.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    public removeItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.bag.update_info.username = getUser().username;
                citizen.bag.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On vide complètement le sac
     *
     * @param {number} citizen_id
     */
    public emptyBag(citizen_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            citizen.bag.items = [];
            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.bag.update_info.username = getUser().username;
                citizen.bag.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On ajoute un état
     *
     * @param {number} citizen_id
     * @param {number} status_key
     */
    public addStatus(citizen_id: number, status_key: string): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status.key === status_key))

            this.api.updateStatus(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.status.update_info.username = getUser().username;
                citizen.status.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On retire un état
     *
     * @param {number} citizen_id
     * @param {number} status_key
     */
    public removeStatus(citizen_id: number, status_key: string): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons.splice(existing_status_index, 1);
            }
            this.api.updateStatus(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.status.update_info.username = getUser().username;
                citizen.status.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On vide complètement les statuts
     *
     * @param {number} citizen_id
     */
    public emptyStatus(citizen_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            citizen.status.icons = [];
            this.api.updateBag(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.status.update_info.username = getUser().username;
                citizen.status.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On met à jour la liste des améliorations
     *
     * @param {number} citizen_id
     */
    public updateHome(citizen_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            this.api.updateHome(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.home.update_info.username = getUser().username;
                citizen.home.update_info.update_time = update_info.update_time;
            });
        }
    }

    /**
     * On met à jour la liste des actions héroiques
     *
     * @param {number} citizen_id
     */
    public updateActions(citizen_id: number): void {
        const citizen: Citizen | undefined = this.datasource.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen) {
            this.api.updateHeroicActions(citizen).subscribe((update_info: UpdateInfo) => {
                citizen.heroic_actions.update_info.username = getUser().username;
                citizen.heroic_actions.update_info.update_time = update_info.update_time;
            });
        }
    }

    public trackByColumnId(index: number, column: CitizenColumn): string {
        return column.id;
    }


    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {

        let filter_object: Citizen[] = JSON.parse(filter.toLowerCase());
        if (filter_object.length === 0) return true;
        if (filter_object.some((citizen: Citizen) => citizen.id === data.id)) return true;
        return false;
    }

}


interface CitizenColumn {
    header: string;
    id: string;
    class?: string;
}

