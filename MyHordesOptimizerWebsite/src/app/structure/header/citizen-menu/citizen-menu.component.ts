import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
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
import { isHouseLevelEditable } from '../../../_abstract_model/types/town-details.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { getHeroicIcon, getHomeIcon } from '../../../_core/utilities/citizen.util';
import { getTown, getUser } from '../../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { CitizenInfoComponent } from '../../../_shared/citizen-info/citizen-info.component';
import { CompactStepperComponent } from '../../../_shared/compact-stepper/compact-stepper.component';
import { CompactToggleComponent } from '../../../_shared/compact-toggle/compact-toggle.component';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';

const angular_common: Imports = [];
const components: Imports = [AvatarComponent, CitizenInfoComponent, CompactStepperComponent, CompactToggleComponent, ListElementAddRemoveComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatDividerModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-header-citizen-menu',
    templateUrl: './citizen-menu.component.html',
    styleUrls: ['./citizen-menu.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizenMenuComponent implements OnInit {

    protected citizen!: Citizen;
    /** La liste des listes disponibles dans le sac */
    protected bag_lists: ListForAddRemove[] = [];
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    private readonly me: Me | null = getUser();
    private readonly current_day: number = getTown()?.day || 1;
    /** La liste complète des items */
    private all_items: Item[] = [];
    /** La liste complète des statuts */
    private readonly all_status: StatusEnum[] = StatusEnum.getAllValues();
    /** La liste des listes disponibles dans les status */
    protected readonly status_lists: ListForAddRemove[] = [
        { label: $localize`Tous`, list: this.all_status }
    ];
    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly town_service: TownService = inject(TownService);

    @ViewChild('statusTrigger') private status_trigger?: MatMenuTrigger;
    @ViewChild('bagTrigger') private bag_trigger?: MatMenuTrigger;
    @ViewChild('dailyActionsTrigger') private daily_actions_trigger?: MatMenuTrigger;
    @ViewChild('heroicActionsTrigger') private heroic_actions_trigger?: MatMenuTrigger;
    @ViewChild('homeTrigger') private home_trigger?: MatMenuTrigger;

    public ngOnInit(): void {
        this.town_service.myCitizen$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen: Citizen | null) => {
                    if (citizen) this.citizen = citizen;
                }
            });

        if (this.me) {
            this.town_service
                .getCitizen(this.me.id)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (citizen: Citizen) => {
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        }

        this.api
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = items;
                    this.bag_lists = [
                        { label: $localize`Tous`, list: this.all_items }
                    ];
                }
            });
    }

    /** Icône d'une action héroïque ; cas particulier de l'APAG dont l'icône dépend des charges restantes. */
    protected getHeroicIcon(action: HeroicActionsWithValue): string {
        return getHeroicIcon(action);
    }

    /** Icône d'une amélioration de maison ; niveau d'habitation par défaut si aucune icône dédiée. */
    protected getHomeIcon(home: HomeWithValue): string {
        return getHomeIcon(home);
    }

    /** Ferme les sous-menus autres que celui qui vient de s'ouvrir (un seul ouvert à la fois). */
    protected closeOtherMenus(opened: 'status' | 'bag' | 'dailyActions' | 'heroicActions' | 'home'): void {
        if (opened !== 'status') this.status_trigger?.closeMenu();
        if (opened !== 'bag') this.bag_trigger?.closeMenu();
        if (opened !== 'dailyActions') this.daily_actions_trigger?.closeMenu();
        if (opened !== 'heroicActions') this.heroic_actions_trigger?.closeMenu();
        if (opened !== 'home') this.home_trigger?.closeMenu();
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} item_id
     */
    protected addItem(item_id: number): void {
        if (this.citizen && this.citizen.bag) {
            this.citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo): void => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
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
    protected removeItem(item_id: number): void {
        if (this.citizen && this.citizen.bag) {
            const item_in_datasource_index: number | undefined = this.citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                this.citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    /** On vide complètement le sac */
    protected emptyBag(): void {
        if (this.citizen && this.citizen.bag) {
            this.citizen.bag.items = [];
            this.town_service
                .updateBag(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.bag) {
                            this.citizen.bag.update_info.username = getUser()?.username;
                            this.citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    /**
     * On ajoute un état
     *
     * @param {string} status_key
     */
    protected addStatus(status_key: string): void {
        if (this.citizen && this.citizen.status) {
            this.citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status.key === status_key));

            this.town_service
                .updateStatus(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    /**
     * On retire un état
     *
     * @param {string} status_key
     */
    protected removeStatus(status_key: string): void {
        if (this.citizen && this.citizen.status) {
            const existing_status_index: number | undefined = this.citizen.status.icons.findIndex((status: StatusEnum) => status.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                this.citizen.status.icons.splice(existing_status_index, 1);
            }
            this.town_service
                .updateStatus(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    /** On vide complètement les statuts */
    protected emptyStatus(): void {
        if (this.citizen && this.citizen.status) {
            this.citizen.status.icons = [];
            this.town_service
                .updateStatus(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.status) {
                            this.citizen.status.update_info.username = getUser()?.username;
                            this.citizen.status.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    protected dailyBathTaken(): boolean {
        return this.citizen.baths.some((bath: Bath) => bath.day === this.current_day && bath.update_info);
    }

    /** Prend ou retire le bain du jour. */
    protected saveBath(checked: boolean): void {
        if (checked) {
            this.town_service
                .addBath(this.citizen)
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.chamanic_detail) {
                            this.citizen.chamanic_detail.update_info.username = getUser()?.username;
                            this.citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        } else {
            this.town_service
                .removeBath(this.citizen)
                .subscribe({
                    next: () => {
                        this.town_service.publishMyCitizen(this.citizen);
                    }
                });
        }
    }

    /** Met à jour le nombre de potions chamaniques bues (stepper). */
    protected changePotions(value: number): void {
        this.citizen.chamanic_detail.nb_potion_shaman = value;
        this.saveChamanicDetails();
    }

    /** Met à jour l'immunité à l'âme (toggle). */
    protected changeImmune(immune: boolean): void {
        this.citizen.chamanic_detail.is_immune_to_soul = immune;
        this.saveChamanicDetails();
    }

    private saveChamanicDetails(): void {
        this.town_service
            .saveChamanicDetails(this.citizen)
            .subscribe({
                next: (update_info: UpdateInfo) => {
                    if (this.citizen.chamanic_detail) {
                        this.citizen.chamanic_detail.update_info.username = getUser()?.username;
                        this.citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                    }
                    this.town_service.publishMyCitizen(this.citizen);
                }
            });
    }

    /**
     * Le champ maison donné est-il saisissable ? Tous le sont, sauf le niveau de la maison, que
     * MyHordes fournit et que le back déduit de `baseDef` — voir {@link isHouseLevelEditable}.
     */
    protected isHomeEditable(home: HomeWithValue): boolean {
        return isHouseLevelEditable(getTown()) || home.element?.key !== HomeEnum.HOUSE_LEVEL.key;
    }

    /**
     * On met à jour la liste des améliorations
     *
     * @param {HomeWithValue} element
     * @param {number | boolean} value nouvelle valeur (toggle booléen ou stepper numérique)
     */
    protected updateHome(element: HomeWithValue, value: number | boolean): void {
        const old_element_value: boolean | number = element.value;
        element.value = value;

        if (this.citizen && this.citizen.home !== undefined) {
            this.town_service
                .updateHome(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.home) {
                            this.citizen.home.update_info.username = getUser()?.username;
                            this.citizen.home.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
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
     * @param {number | boolean} value nouvelle valeur (toggle booléen ou stepper numérique)
     */
    protected updateActions(element: HeroicActionsWithValue, value: number | boolean): void {
        const old_element_value: boolean | number = element.value;
        element.value = value;

        if (this.citizen && this.citizen.heroic_actions) {
            this.town_service
                .updateHeroicActions(this.citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (this.citizen.heroic_actions) {
                            this.citizen.heroic_actions.update_info.username = getUser()?.username;
                            this.citizen.heroic_actions.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(this.citizen);
                    },
                    error: () => {
                        element.value = old_element_value;
                    }
                });
        }
    }
}
