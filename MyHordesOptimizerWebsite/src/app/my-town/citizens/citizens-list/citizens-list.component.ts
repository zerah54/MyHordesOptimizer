import { Component, ElementRef, EventEmitter, HostBinding, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import * as moment from 'moment';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiServices } from '../../../_abstract_model/services/api.services';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { getUser } from '../../../shared/utilities/localstorage.util';

@Component({
    selector: 'mho-citizens-list',
    templateUrl: './citizens-list.component.html',
    styleUrls: ['./citizens-list.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CitizensListComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    // @ViewChild(MenuAddComponent) menuAdd!: MenuAddComponent;
    // @ViewChild(MenuRemoveComponent) menuRemove!: MenuRemoveComponent;

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;
    @ViewChild('filterInput') filterInput!: ElementRef;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
        // public datasource: TableVirtualScrollDataSource<Citizen> = new TableVirtualScrollDataSource();
    public datasource: TableVirtualScrollDataSource<Citizen> = new TableVirtualScrollDataSource();
    /** La liste complète des items */
    public all_items: Item[] = [];
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();
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

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {
    }

    public ngOnInit(): void {
        this.datasource = new TableVirtualScrollDataSource();
        this.datasource.sort = this.sort;

        this.citizen_filter_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.datasource.filter = JSON.stringify(this.citizen_filters);
            });

        this.datasource.filterPredicate = (data: Citizen, filter: string): boolean => this.customFilter(data, filter);

        this.api.getItems()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((items: Item[]) => this.all_items = items);

        this.getCitizens();
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
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.api.updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo): void => {
                    if (citizen.bag) {
                        citizen.bag.update_info.username = getUser().username;
                        citizen.bag.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.api.updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.bag) {
                        citizen.bag.update_info.username = getUser().username;
                        citizen.bag.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            this.api.updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.bag) {
                        citizen.bag.update_info.username = getUser().username;
                        citizen.bag.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.status) {
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status.key === status_key));

            this.api.updateStatus(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.status) {
                        citizen.status.update_info.username = getUser().username;
                        citizen.status.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.status) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons.splice(existing_status_index, 1);
            }
            this.api.updateStatus(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.status) {
                        citizen.status.update_info.username = getUser().username;
                        citizen.status.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.status) {
            citizen.status.icons = [];
            this.api.updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.status) {
                        citizen.status.update_info.username = getUser().username;
                        citizen.status.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.home !== undefined) {
            this.api.updateHome(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.home) {
                        citizen.home.update_info.username = getUser().username;
                        citizen.home.update_info.update_time = update_info.update_time;
                    }
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
        if (citizen && citizen.heroic_actions) {
            this.api.updateHeroicActions(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((update_info: UpdateInfo) => {
                    if (citizen.heroic_actions) {
                        citizen.heroic_actions.update_info.username = getUser().username;
                        citizen.heroic_actions.update_info.update_time = update_info.update_time;
                    }
                });
        }
    }

    public trackByColumnId(_index: number, column: CitizenColumn): string {
        return column.id;
    }

    public trackByKey(_index: number, enum_item: HeroicActionEnum | HomeEnum): string {
        return enum_item.key;
    }


    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {

        const filter_object: Citizen[] = JSON.parse(filter.toLowerCase());
        if (filter_object.length === 0) return true;
        if (filter_object.some((citizen: Citizen): boolean => citizen.id === data.id)) return true;
        return false;
    }

    public getCitizens(): void {
        this.api.getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((citizen_info: CitizenInfo) => {
                citizen_info.citizens = citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_dead);
                this.citizen_info = citizen_info;
                this.datasource.data = [...citizen_info.citizens];
            });
    }
}


interface CitizenColumn {
    header: string;
    id: string;
    class?: string;
}

