import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { HeroicActionsWithValue } from '../../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { isHouseLevelEditable } from '../../../_abstract_model/types/town-details.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { getHeroicIcon, getHomeIcon } from '../../../_core/utilities/citizen.util';
import { getTown, getUser, town, user } from '../../../_core/utilities/localstorage.util';
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
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CitizenMenuComponent implements OnInit {

    /** Citoyen courant : republié sur `myCitizen$` par ce composant lui-même après chaque mutation
     *  (voir {@link ngOnInit}), donc réémis avec la MÊME référence — un simple `.set()` de cette
     *  référence serait ignoré (`Object.is`-égal) sous OnPush. Le clonage à la réception (voir
     *  {@link ngOnInit}) garantit la notification à chaque publication, propre ou externe. */
    protected readonly citizen: WritableSignal<Citizen | undefined> = signal(undefined);
    /** La liste des listes disponibles dans le sac */
    protected readonly bag_lists: WritableSignal<ListForAddRemove[]> = signal([]);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    private readonly me: Signal<Me | null> = user;
    private readonly current_day: Signal<number> = computed(() => town()?.day || 1);
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

    // Les 5 déclencheurs de sous-menus sont tous dans le même bloc `@if (citizen(); as citizen)` du
    // template : la référence n'existe qu'une fois le citoyen chargé, jamais `.required()`.
    private readonly status_trigger: Signal<MatMenuTrigger | undefined> = viewChild<MatMenuTrigger>('statusTrigger');
    private readonly bag_trigger: Signal<MatMenuTrigger | undefined> = viewChild<MatMenuTrigger>('bagTrigger');
    private readonly daily_actions_trigger: Signal<MatMenuTrigger | undefined> = viewChild<MatMenuTrigger>('dailyActionsTrigger');
    private readonly heroic_actions_trigger: Signal<MatMenuTrigger | undefined> = viewChild<MatMenuTrigger>('heroicActionsTrigger');
    private readonly home_trigger: Signal<MatMenuTrigger | undefined> = viewChild<MatMenuTrigger>('homeTrigger');

    public ngOnInit(): void {
        this.town_service.myCitizen$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen: Citizen | null) => {
                    // Clone systématique : `citizen` peut être la référence déjà tenue par ce signal
                    // (republiée par ce composant après une mutation locale), auquel cas `.set()` seul
                    // serait ignoré sous OnPush (Object.is-égal).
                    if (citizen) this.citizen.set(Object.assign(new Citizen(), citizen));
                }
            });

        if (this.me()) {
            this.town_service
                .getCitizen(this.me()!.id)
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
                    this.bag_lists.set([
                        { label: $localize`Tous`, list: this.all_items }
                    ]);
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
        if (opened !== 'status') this.status_trigger()?.closeMenu();
        if (opened !== 'bag') this.bag_trigger()?.closeMenu();
        if (opened !== 'dailyActions') this.daily_actions_trigger()?.closeMenu();
        if (opened !== 'heroicActions') this.heroic_actions_trigger()?.closeMenu();
        if (opened !== 'home') this.home_trigger()?.closeMenu();
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} item_id
     */
    protected addItem(item_id: number): void {
        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.bag) {
            // Réassignation immuable : `[currentList]="citizen.bag?.items"` alimente l'input signal
            // (`input.required()`) de `mho-list-element-add-remove`, un composant OnPush — un `.push()`
            // en place laisserait la référence inchangée et l'input ne se mettrait jamais à jour.
            citizen.bag.items = [...citizen.bag.items, <Item>this.all_items.find((item: Item) => item.id === item_id)];

            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo): void => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(citizen);
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
        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items = citizen.bag.items.filter((_: Item, index: number) => index !== item_in_datasource_index);
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
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /** On vide complètement le sac */
    protected emptyBag(): void {
        const citizen: Citizen | undefined = this.citizen();
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
                        this.town_service.publishMyCitizen(citizen);
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
        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.status) {
            citizen.status.icons = [...citizen.status.icons, <StatusEnum>this.all_status.find((status: StatusEnum) => status.key === status_key)];

            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(citizen);
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
        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.status) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons = citizen.status.icons.filter((_: StatusEnum, index: number) => index !== existing_status_index);
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
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /** On vide complètement les statuts */
    protected emptyStatus(): void {
        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.status) {
            citizen.status.icons = [];
            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    protected readonly daily_action_keys: DailyActionEnum[] = DailyActionEnum.getAllValues<DailyActionEnum>();

    /** L'action donnée a-t-elle déjà été faite aujourd'hui ? */
    protected isDailyActionDone(actionKey: string): boolean {
        return this.citizen()!.daily_actions.some((action: DailyAction) => action.day === this.current_day() && action.action_key === actionKey && !!action.update_info);
    }

    /** Prend ou retire une action quotidienne du jour. */
    protected saveDailyAction(actionKey: string, checked: boolean): void {
        const citizen: Citizen = this.citizen()!;
        if (checked) {
            this.town_service
                .addDailyAction(citizen, actionKey)
                .subscribe({
                    next: () => {
                        citizen.daily_actions = [...citizen.daily_actions, new DailyAction({
                            day: this.current_day(), actionKey,
                            lastUpdateInfo: { updateTime: new Date(), userId: getUser()?.id?.toString() ?? '', userName: getUser()?.username ?? '', userKey: '' }
                        })];
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        } else {
            this.town_service
                .removeDailyAction(citizen, actionKey)
                .subscribe({
                    next: () => {
                        const index: number = citizen.daily_actions.findIndex((action: DailyAction) => action.day === this.current_day() && action.action_key === actionKey);
                        if (index > -1) citizen.daily_actions = citizen.daily_actions.filter((_: DailyAction, i: number) => i !== index);
                        this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /** Met à jour le nombre de potions chamaniques bues (stepper). */
    protected changePotions(value: number): void {
        this.citizen()!.chamanic_detail.nb_potion_shaman = value;
        this.saveChamanicDetails();
    }

    /** Met à jour l'immunité à l'âme (toggle). */
    protected changeImmune(immune: boolean): void {
        this.citizen()!.chamanic_detail.is_immune_to_soul = immune;
        this.saveChamanicDetails();
    }

    private saveChamanicDetails(): void {
        const citizen: Citizen = this.citizen()!;
        this.town_service
            .saveChamanicDetails(citizen)
            .subscribe({
                next: (update_info: UpdateInfo) => {
                    if (citizen.chamanic_detail) {
                        citizen.chamanic_detail.update_info.username = getUser()?.username;
                        citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                    }
                    this.town_service.publishMyCitizen(citizen);
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

        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.home !== undefined) {
            this.town_service
                .updateHome(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.home) {
                            citizen.home.update_info.username = getUser()?.username;
                            citizen.home.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(citizen);
                    },
                    error: () => {
                        element.value = old_element_value;
                        // Rollback asynchrone sans événement déclencheur ni publishMyCitizen : sous
                        // OnPush, rien d'autre ne marque cette vue à revérifier — notification explicite.
                        this.citizen.set(Object.assign(new Citizen(), citizen));
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

        const citizen: Citizen | undefined = this.citizen();
        if (citizen && citizen.heroic_actions) {
            this.town_service
                .updateHeroicActions(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.heroic_actions) {
                            citizen.heroic_actions.update_info.username = getUser()?.username;
                            citizen.heroic_actions.update_info.update_time = update_info.update_time;
                        }
                        this.town_service.publishMyCitizen(citizen);
                    },
                    error: () => {
                        element.value = old_element_value;
                        // Rollback asynchrone sans événement déclencheur ni publishMyCitizen : sous
                        // OnPush, rien d'autre ne marque cette vue à revérifier — notification explicite.
                        this.citizen.set(Object.assign(new Citizen(), citizen));
                    }
                });
        }
    }
}
