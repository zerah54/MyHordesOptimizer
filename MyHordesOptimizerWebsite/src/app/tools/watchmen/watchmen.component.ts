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
    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);
    private destroy_ref: DestroyRef = inject(DestroyRef);

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
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status?.key === status_key));

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
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status?.key === status_key);
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
}

