import { NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Bath } from '../../../_abstract_model/types/bath.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { HeroicActionsWithValue } from '../../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { CitizenInfoComponent } from '../../../shared/elements/citizen-info/citizen-info.component';
import { ListElementAddRemoveComponent } from '../../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { getTown, getUser } from '../../../shared/utilities/localstorage.util';

const angular_common: Imports = [NgOptimizedImage, FormsModule];
const components: Imports = [CitizenInfoComponent, ListElementAddRemoveComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatSelectModule];

@Component({
    selector: 'mho-header-citizen-menu',
    templateUrl: './citizen-menu.component.html',
    styleUrls: ['./citizen-menu.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizenMenuComponent implements OnInit {

    public citizen!: Citizen;
    public readonly me: Me | null = getUser();
    public readonly current_day: number = getTown()?.day || 1;
    public readonly locale: string = moment.locale();

    /** La liste complète des items */
    public all_items: Item[] = [];
    /** La liste complète des statuts */
    public readonly all_status: StatusEnum[] = StatusEnum.getAllValues();

    /** La liste des listes disponibles dans le sac */
    public bag_lists: ListForAddRemove[] = [];
    /** La liste des listes disponibles dans les status */
    public readonly status_lists: ListForAddRemove[] = [
        {label: $localize`Tous`, list: this.all_status}
    ];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public ngOnInit(): void {
        if (this.me) {
            this.town_service
                .getCitizen(this.me.id)
                .subscribe({
                    next: (citizen: Citizen) => {
                        this.citizen = citizen;
                    }
                });
        }

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

    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} item_id
     */
    public addItem(item_id: number): void {
        if (this.citizen && this.citizen.bag) {
            this.citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo): void => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {number} item_id
     */
    public removeItem(item_id: number): void {
        if (this.citizen && this.citizen.bag) {
            const item_in_datasource_index: number | undefined = this.citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                this.citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /** On vide complètement le sac */
    public emptyBag(): void {
        if (this.citizen && this.citizen.bag) {
            this.citizen.bag.items = [];
            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /**
     * On ajoute un état
     *
     * @param {number} status_key
     */
    public addStatus(status_key: string): void {
        if (this.citizen && this.citizen.status) {
            this.citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status.key === status_key));

            this.town_service
                .updateStatus(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /**
     * On retire un état
     *
     * @param {number} status_key
     */
    public removeStatus(status_key: string): void {
        if (this.citizen && this.citizen.status) {
            const existing_status_index: number | undefined = this.citizen.status.icons.findIndex((status: StatusEnum) => status.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                this.citizen.status.icons.splice(existing_status_index, 1);
            }
            this.town_service
                .updateStatus(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    /** On vide complètement les statuts */
    public emptyStatus(): void {
        if (this.citizen && this.citizen.status) {
            this.citizen.status.icons = [];
            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        }
    }

    public dailyBathTaken(): boolean {
        return this.citizen.baths.some((bath: Bath) => bath.day === this.current_day && bath.update_info);
    }

    public saveBath(event: MatCheckboxChange): void {
        if (event.checked) {
            this.town_service
                .addBath(this.citizen)
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.chamanic_detail) {
                            this.citizen.chamanic_detail.update_info.username = getUser()?.username;
                            this.citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                        }
                    }
                });
        } else {
            this.town_service
                .removeBath(this.citizen)
                .subscribe();
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

    /**
     * On met à jour la liste des actions héroiques
     *
     * @param {HeroicActionsWithValue} element
     * @param {MatCheckboxChange | number} event
     */
    public updateActions(element: HeroicActionsWithValue, event: MatCheckboxChange | number): void {
        const old_element_value: boolean | number = element.value;
        if (event instanceof MatCheckboxChange) {
            element.value = event.checked;
        } else {
            element.value = event;
        }

        if (this.citizen && this.citizen.heroic_actions) {
            this.town_service
                .updateHeroicActions(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.heroic_actions) {
                            this.citizen.heroic_actions.update_info.username = getUser()?.username;
                            this.citizen.heroic_actions.update_info.update_time = update_info.update_time;
                        }
                    },
                    error: () => {
                        element.value = old_element_value;
                    }
                });
        }
    }

    /**
     * On met à jour la liste des améliorations
     *
     * @param {HomeWithValue} element
     * @param {MatCheckboxChange | MatSelectChange} event
     */
    public updateHome(element: HomeWithValue, event: MatCheckboxChange | number): void {
        const old_element_value: boolean | number = element.value;
        if (event instanceof MatCheckboxChange) {
            element.value = event.checked;
        } else {
            element.value = event;
        }

        if (this.citizen && this.citizen.home !== undefined) {
            this.town_service
                .updateHome(this.citizen)
                .pipe(takeUntil(this.destroy_sub))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.home) {
                            this.citizen.home.update_info.username = getUser()?.username;
                            this.citizen.home.update_info.update_time = update_info.update_time;
                        }
                    },
                    error: () => {
                        element.value = old_element_value;
                    }
                });
        }
    }
}
