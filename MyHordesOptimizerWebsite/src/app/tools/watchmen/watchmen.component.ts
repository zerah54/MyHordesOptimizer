import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTab, MatTabContent, MatTabGroup } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Item } from '../../_abstract_model/types/item.class';
import { UpdateInfo } from '../../_abstract_model/types/update-info.class';
import { Watchman } from '../../_abstract_model/types/watchman.class';
import { CitizenInfoComponent } from '../../shared/elements/citizen-info/citizen-info.component';
import { ListElementAddRemoveComponent } from '../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { getTown, getUser } from '../../shared/utilities/localstorage.util';
import { CitizensForWatchPipe } from './citizens-for-watch.pipe';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-watchmen',
    templateUrl: './watchmen.component.html',
    styleUrls: ['./watchmen.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, MatTabGroup, MatAccordion, MatTab, MatTabContent, MatExpansionPanel, MatExpansionPanelHeader, SelectComponent, CitizensForWatchPipe, CitizenInfoComponent, ListElementAddRemoveComponent, NgOptimizedImage, MatDivider]
})

export class WatchmenComponent implements OnInit {

    //private realtime_watchmen_service: RealtimeWatchmenService = inject(RealtimeWatchmenService);
    public bag_lists: ListForAddRemove[] = [];
    public readonly all_status: StatusEnum[] = StatusEnum.getAllValues();
    public readonly status_lists: ListForAddRemove[] = [{label: $localize`Tous`, list: this.all_status}];
    protected watchmen: WritableSignal<Watchman[]> = signal([]);
    protected readonly current_day: number = getTown()?.day || 1;
    protected selected_tab_index: number = this.current_day - 1;
    protected all_citizens!: Citizen[];
    protected all_items: Item[] = [];
    protected bank_items: Item[] = [];

    protected readonly HORDES_IMG_REPO = HORDES_IMG_REPO;
    protected is_ikea_built: boolean = true;
    protected is_pet_shop_built: boolean = true;
    protected is_grinder_built: boolean = true;
    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);
    private destroy_ref: DestroyRef = inject(DestroyRef);
    private isSprinklerSystemBuilt: boolean = false;
    private isBattlementsLevel3: boolean = false;
    private isGuardroomBuilt: boolean = false;

    public get objectsList(): ListForAddRemove[] {
        return [{label: $localize`Banque`, list: this.bank_items}, {label: $localize`Tous`, list: this.all_items},];
    }

    public deleteWatchmen(index: number): void {
        this.watchmen().splice(index, 1);
    }

    public async ngOnInit(): Promise<void> {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens = [...citizens.citizens];
                }
            });

        this.api_service
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = items;
                    this.bag_lists = [{label: $localize`Tous`, list: this.all_items}];
                }
            });

        this.town_service
            .getBank()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (bank: BankInfo) => {
                    this.bank_items = [...bank.items];
                }
            });
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param citizen le citoyen
     * @param {number} item_id
     */
    public addItem(citizen: Citizen, item_id: number): void {
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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

    public getDefenceFromWatchmen(): number {
        return this.watchmen().reduce((total: number, watchman: Watchman) => total + this.getDefenceFromCitizen(watchman.citizen), 0);
    }

    public getSurvivalFromCitizen(citizen: Citizen) {
        let survival = 92;


        // Jobs
        if (citizen.job?.getLabel() === 'Guardian') {
            survival += 5;
        }

        // Status
        citizen.status?.icons.forEach((status: StatusEnum) => {
            switch (status) {
                case StatusEnum.THIRST1:
                case StatusEnum.THIRST2:
                    survival -= 3;
                    break;

                case StatusEnum.DRUGGED:
                    survival += 3;
                    break;

                case StatusEnum.DRUNK:
                    survival += 2;
                    break;

                case StatusEnum.HEALED:
                    survival -= 5;
                    break;

                case StatusEnum.ADDICT: // hooked
                    survival -= 6;
                    break;

                case StatusEnum.IMMUNE:
                    survival += 1;
                    break;

                case StatusEnum.INFECTION:
                    survival -= 10;
                    break;

                case StatusEnum.TERROR:
                    survival -= 5;
                    break;

                case StatusEnum.WOUND1:
                case StatusEnum.WOUND2:
                case StatusEnum.WOUND3:
                case StatusEnum.WOUND4:
                case StatusEnum.WOUND5:
                case StatusEnum.WOUND6:
                    survival -= 10;
                    break;

                default:
                    break;
            }
        });

        // Buildings
        if (this.isSprinklerSystemBuilt) {
            survival -= 3;
        }
        if (this.isGuardroomBuilt) {
            survival += 5;
        }
        if (this.isBattlementsLevel3) {
            survival += 1;
        }

        // Weapons
        citizen.bag?.items.forEach(item => {
            switch (item.uid) {
                case 'car_door_#00':
                    survival += 3;
                    break;
                case 'pumpkin_tasty_#00':
                    survival += 1;
                    break;
                case 'taser_#00':
                    survival += 1;
                    break;
                case 'music_#00':
                    survival -= 2;
                    break;
                default:
                    break;
            }
        });

        // TODO : Previous Watches
        if (citizen.previousWatches) {
            switch (citizen.previousWatches) {
                case 2:
                    survival -= 1;
                    break;
                case 3:
                    survival -= 4;
                    break;
                case 4:
                    survival -= 9;
                    break;
                case 5:
                    survival -= this.hasS3 ? 15 : 20;
                    break;
                case 6:
                    survival -= this.hasS3 ? 20 : 30;
                    break;
                case 7:
                    survival -= this.hasS3 ? 30 : 42;
                    break;
                case 8:
                    survival -= this.hasS3 ? 40 : 56;
                    break;
                case 9:
                    survival -= this.hasS3 ? 50 : 72;
                    break;
                case 10:
                    survival -= this.hasS3 ? 60 : 90;
                    break;
                case 11:
                    survival -= this.hasS3 ? 75 : 90;
                    break;
                case 12:
                    survival -= this.hasS3 ? 90 : 90;
                    break;
                default:
                    break;
            }
        }

        return survival
    }

    public getDefenceFromCitizen(citizen: Citizen): number {
        return citizen.bag?.items
            .map(item => {
                let item_def: number = item.guard;
                console.log('1.', item_def)
                console.log(item)
                item.properties.forEach(property => {
                    console.log(item_def)
                    switch (property.key) {
                        case 'nw_ikea':
                            item_def = this.is_ikea_built ? item_def * 1.30 : item_def;
                            console.log('2.', item_def)
                            break;
                        case 'nw_trebuchet':
                            item_def = this.is_pet_shop_built ? item_def * 1.30 : item_def;
                            console.log('2.', item_def)
                            break;
                        case 'nw_armory':
                            item_def = this.is_grinder_built ? item_def * 1.20 : item_def;
                            console.log('2.', item_def)
                            break;
                        default:
                            break;
                    }
                    item_def = Math.floor(item_def)
                    console.log('3.', item_def)
                });
                return item_def;
            })
            .reduce((previousValue: number, currentValue: number): number => {
                return previousValue + currentValue;
            }, 0) ?? 0;
    }


    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param citizen le citoyen
     * @param {number} item_id
     */
    public removeItem(citizen: Citizen, item_id: number): void {
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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
     * @param citizen
     */
    public emptyBag(citizen: Citizen): void {
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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
     * @param citizen
     * @param {number} status_key
     */
    public addStatus(citizen: Citizen, status_key: string): void {
        if (citizen && citizen.status) {
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status?.key === status_key))


            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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
     * @param citizen
     * @param {number} status_key
     */
    public removeStatus(citizen: Citizen, status_key: string): void {
        if (citizen && citizen.status) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status?.key === status_key)

            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons.splice(existing_status_index, 1);
            }
            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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
     * @param citizen
     */
    public emptyStatus(citizen: Citizen): void {
        if (citizen && citizen.status) {
            citizen.status.icons = [];
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
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

    public compareWithCitizen(element: Watchman, option: Watchman): boolean {
        return element.id === option.id;
    }

    public async addNewWatchman(): Promise<void> {
        // TODO quand on aura un back : await this.realtime_watchmen_service.updateWatchman(this.selected_tab_index + 1, new Watchman());
        this.watchmen().push(new Watchman({id: this.watchmen().length}));
    }

    getSurvivalOfWatchmen() {
        return 10
    }

    getChanceOfDeath() {
        return 1
    }
}

