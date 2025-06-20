import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Signal, viewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Cadaver } from '../../../_abstract_model/types/cadaver.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { HeroicActionsWithValue } from '../../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { AvatarComponent } from '../../../shared/elements/avatar/avatar.component';
import { CitizenInfoComponent } from '../../../shared/elements/citizen-info/citizen-info.component';
import { LastUpdateComponent } from '../../../shared/elements/last-update/last-update.component';
import { ListElementAddRemoveComponent } from '../../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { HeaderWithSelectFilterComponent } from '../../../shared/elements/lists/header-with-select-filter/header-with-select-filter.component';
import { ColumnIdPipe } from '../../../shared/pipes/column-id.pipe';
import { getTown, getUser } from '../../../shared/utilities/localstorage.util';
import { BathForDayPipe } from '../bath-for-day.pipe';
import { TypeRowPipe } from './type-row.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgClass, NgOptimizedImage];
const components: Imports = [AvatarComponent, CitizenInfoComponent, HeaderWithSelectFilterComponent, LastUpdateComponent, ListElementAddRemoveComponent];
const pipes: Imports = [BathForDayPipe, ColumnIdPipe, TypeRowPipe];
const material_modules: Imports = [MatCheckboxModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatSortModule, MatTableModule];

@Component({
    selector: 'mho-citizens-list',
    templateUrl: './citizens-list.component.html',
    styleUrls: ['./citizens-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensListComponent implements OnInit {

    // @ViewChild(MenuAddComponent) menuAdd!: MenuAddComponent;
    // @ViewChild(MenuRemoveComponent) menuRemove!: MenuRemoveComponent;

    public sort: Signal<MatSort | undefined> = viewChild(MatSort);

    /** La liste des citoyens en vie */
    public alive_citizen_info!: CitizenInfo;
    /** La liste des citoyens morts */
    public dead_citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    public citizen_list: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** La datasource des citoyens morts */
    public dead_citizen_list: MatTableDataSource<Cadaver> = new MatTableDataSource();
    /** La liste complète des items */
    public all_items: Item[] = [];
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly current_day: number = getTown()?.day || 1;
    /** La locale */
    public readonly locale: string = moment.locale();
    /** Les filtres de la liste des citoyens */
    public citizen_filters: Citizen[] = [];
    /** La liste des citoyens a été mise à jour */
    public citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** La liste des colonnes */
    public readonly citizen_list_columns: StandardColumn[] = [
        {id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true},
        {id: 'more_status', header: $localize`États`, class: ''},
        {id: 'heroic_actions', header: $localize`Actions héroïques`, class: ''},
        {id: 'home', header: $localize`Améliorations`, class: ''},
        // { id: 'chest', header: $localize`Coffre` },
    ];
    /** La liste des colonnes pour les citoyens morts */
    public readonly dead_citizen_list_columns: StandardColumn[] = [
        {id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true},
    ];

    public readonly all_status: StatusEnum[] = StatusEnum.getAllValues();

    /** La liste des listes disponibles dans le sac */
    public bag_lists: ListForAddRemove[] = [];
    /** La liste des listes disponibles dans les status */
    public readonly status_lists: ListForAddRemove[] = [
        {label: $localize`Tous`, list: this.all_status}
    ];

    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public ngOnInit(): void {
        this.citizen_list = new MatTableDataSource();
        this.citizen_list.sort = this.sort() as MatSort;

        this.dead_citizen_list = new MatTableDataSource();
        this.dead_citizen_list.sort = this.sort() as MatSort;

        this.citizen_filter_change
            .pipe(takeUntil(this.destroy_sub))
            .subscribe(() => {
                this.citizen_list.filter = JSON.stringify(this.citizen_filters);
            });

        this.citizen_list.filterPredicate = (data: Citizen, filter: string): boolean => this.customFilter(data, filter);

        this.api_service
            .getItems()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = items;
                    this.bag_lists = [
                        {label: $localize`Tous`, list: this.all_items}
                    ];
                }
            });

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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.town_service
                .updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo): void => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status?.key === status_key));

            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status?.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons.splice(existing_status_index, 1);
            }
            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
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
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            citizen.status.icons = [];
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /**
     * On met à jour la liste des améliorations
     *
     * @param {HomeWithValue} element
     * @param {MatCheckboxChange} event
     * @param {number} citizen_id
     */
    public updateHome(element: HomeWithValue, event: MatCheckboxChange | number, citizen_id: number): void {
        const old_element_value: boolean | number = element.value;
        if (event instanceof MatCheckboxChange) {
            element.value = event.checked;
        } else {
            element.value = event;
        }

        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.home !== undefined) {
            this.town_service
                .updateHome(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.home) {
                            citizen.home.update_info.username = getUser()?.username;
                            citizen.home.update_info.update_time = update_info.update_time;
                        }
                    },
                    error: () => {
                        element.value = old_element_value;
                    }
                });
        }
    }

    /**
     * On met à jour la liste des actions héroiques
     *
     * @param {HeroicActionsWithValue} element
     * @param {MatCheckboxChange} event
     * @param {number} citizen_id
     */
    public updateActions(element: HeroicActionsWithValue, event: MatCheckboxChange | number, citizen_id: number): void {
        const old_element_value: boolean | number = element.value;
        if (event instanceof MatCheckboxChange) {
            element.value = event.checked;
        } else {
            element.value = event;
        }

        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.heroic_actions) {
            this.town_service
                .updateHeroicActions(citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.heroic_actions) {
                            citizen.heroic_actions.update_info.username = getUser()?.username;
                            citizen.heroic_actions.update_info.update_time = update_info.update_time;
                        }
                    },
                    error: () => {
                        element.value = old_element_value;
                    }
                });
        }
    }

    public saveBath(citizen: Citizen, event: MatCheckboxChange): void {
        if (event.checked) {
            this.town_service
                .addBath(citizen)
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.chamanic_detail) {
                            citizen.chamanic_detail.update_info.username = getUser()?.username;
                            citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        } else {
            this.town_service
                .removeBath(citizen)
                .subscribe({
                    next: () => {

                    }
                });
        }
    }

    public saveChamanicDetails(citizen: Citizen): void {
        this.town_service
            .saveChamanicDetails(citizen)
            .subscribe({
                next: (update_info: UpdateInfo) => {
                    if (citizen.chamanic_detail) {
                        citizen.chamanic_detail.update_info.username = getUser()?.username;
                        citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                    }
                }
            });
    }

    /** Remplace la fonction qui vérifie si un élément doit être remonté par le filtre */
    private customFilter(data: Citizen, filter: string): boolean {

        const filter_object: Citizen[] = JSON.parse(filter.toLowerCase());
        if (filter_object.length === 0) return true;
        if (filter_object.some((citizen: Citizen): boolean => citizen.id === data.id)) return true;
        return false;
    }

    public getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    const alive_citizen_info: CitizenInfo = Object.assign({}, citizen_info);
                    alive_citizen_info.citizens = alive_citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_dead);
                    this.alive_citizen_info = alive_citizen_info;
                    this.citizen_list.data = [...alive_citizen_info.citizens];

                    const dead_citizen_info: CitizenInfo = Object.assign({}, citizen_info);
                    dead_citizen_info.citizens = dead_citizen_info.citizens.filter((citizen: Citizen) => citizen.is_dead && citizen.cadaver);
                    this.dead_citizen_info = dead_citizen_info;
                    this.dead_citizen_list.data = [...dead_citizen_info.citizens.map((citizen: Citizen) => <Cadaver>citizen.cadaver)];
                    console.log('dead_citizen_info', dead_citizen_info);
                }
            });
    }
}

