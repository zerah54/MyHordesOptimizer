import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EXPEDITIONS_EDITION_MODE_KEY, FAVORITE_EXPEDITION_ITEMS_UID, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { RealtimeExpeditionsService } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { ExpeditionService } from '../../_abstract_model/services/expedition.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { CitizenExpeditionBag } from '../../_abstract_model/types/citizen-expedition-bag.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Me } from '../../_abstract_model/types/me.class';
import { ActiveCitizensComponent } from '../../shared/elements/active-citizens/active-citizens.component';
import { CompassRoseComponent } from '../../shared/elements/compass-rose/compass-rose.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/elements/confirm-dialog/confirm-dialog.component';
import { IconApComponent } from '../../shared/elements/icon-ap/icon-ap.component';
import { ListElementAddRemoveComponent } from '../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { CitizenFromIdPipe } from '../../shared/pipes/citizens-from-id.pipe';
import { JobFromIdPipe } from '../../shared/pipes/job-from-id.pipe';
import { ClipboardService } from '../../shared/services/clipboard.service';
import { getCitizenFromId } from '../../shared/utilities/citizen.util';
import { getTown, getUser } from '../../shared/utilities/localstorage.util';
import { CitizensForExpePipe, FormatPreRegisteredPipe, SomeHeroicActionNeededPipe } from './citizens-for-expe.pipe';
import { EditOrdersComponent, EditOrdersData } from './edit-orders/edit-orders.component';
import { EditPositionsComponent, EditPositionsData } from './edit-positions/edit-positions.component';
import { TotalPdcPipe } from './total-pdc.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule, NgClass, NgOptimizedImage];
const components: Imports = [ActiveCitizensComponent, IconApComponent, ListElementAddRemoveComponent, SelectComponent];
const pipes: Imports = [CitizensForExpePipe, CitizenFromIdPipe, CompassRoseComponent, FormatPreRegisteredPipe, JobFromIdPipe, SomeHeroicActionNeededPipe, TotalPdcPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule];

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ExpeditionsComponent implements OnInit {

    /** La langue du site */
    public readonly locale: string = moment.locale();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly current_day: number = getTown()?.day || 1;
    protected edition_mode: boolean = JSON.parse(localStorage.getItem(EXPEDITIONS_EDITION_MODE_KEY) || 'false');
    protected editable: boolean = true;
    protected selected_tab_index: number = this.current_day - 1;
    protected all_citizens!: Citizen[];
    protected all_citizens_job!: JobEnum[];
    /** La liste des actions héroïques */
    protected all_heroics: HeroicActionEnum[] = (<HeroicActionEnum[]>HeroicActionEnum.getAllValues())
        .filter((action: HeroicActionEnum) => action.value.count_in_daily && action.value.action !== '');
    /** La liste complète des items */
    protected all_items: Item[] = [];
    /** La liste des items en banque */
    protected bank_items: Item[] = [];

    protected expeditions: WritableSignal<Expedition[]> = signal([]);
    protected active_citizens_list: WritableSignal<number[]> = signal([]);

    protected readonly me: Me | null = getUser();

    private readonly api_service: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly expedition_service: ExpeditionService = inject(ExpeditionService);
    private readonly realtime_expeditions_service: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public constructor(private clipboard: ClipboardService, private dialog: MatDialog) {
    }

    public async ngOnInit(): Promise<void> {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens = [...citizens.citizens];
                    this.all_citizens_job = (JobEnum.getAllValues<JobEnum>())
                        .filter((job_enum: JobEnum) => this.all_citizens.some((citizen: Citizen): boolean => citizen.job?.key === job_enum?.key));
                }
            });
        this.api_service
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = [...items];
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

        const existing_expeditions: Expedition[] = await firstValueFrom(this.expedition_service.getExpeditions(this.selected_tab_index + 1));
        this.expeditions.set([...existing_expeditions]);

        this.realtime_expeditions_service.expedition_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition: Expedition) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const expedition_to_update: number = current_expeditions
                        .findIndex((_expedition_to_update: Expedition) => _expedition_to_update.id === expedition.id);
                    if (expedition_to_update < 0) {
                        current_expeditions.push(expedition);
                        this.addNewExpeditionPart(expedition);
                    } else {
                        current_expeditions[expedition_to_update] = expedition;
                    }
                    current_expeditions.sort((expedition_a: Expedition, expedition_b: Expedition) => {
                        if (expedition_a.position < expedition_b.position) return -1;
                        if (expedition_a.position > expedition_b.position) return 1;
                        return 0;
                    });
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expeditions_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expeditions: Expedition[]) => {
                this.expeditions.set([...expeditions]);
            });

        this.realtime_expeditions_service.expedition_deleted$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_id: number) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const expedition_to_delete: number = current_expeditions
                        .findIndex((_expedition_to_delete: Expedition) => _expedition_to_delete.id === expedition_id);
                    if (expedition_to_delete < 0) return current_expeditions;

                    current_expeditions.splice(expedition_to_delete, 1);

                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_part_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_part: ExpeditionPart) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                        return _current_expedition.id === expedition_part.expedition_id;
                    });
                    if (!current_expedition) return current_expeditions;

                    const part_to_update: number = current_expedition.parts
                        .findIndex((_part_to_update: ExpeditionPart) => _part_to_update.id === expedition_part.id);
                    if (part_to_update < 0) {
                        current_expedition.parts.push(expedition_part);
                        if (current_expedition.parts.length > 1) {
                            current_expedition.parts[0].citizens.forEach((existing_citizen: CitizenExpedition) => {
                                this.addNewMemberToPart(expedition_part, existing_citizen);
                            });
                        } else {
                            this.addNewMemberToPart(expedition_part);
                        }
                    } else {
                        current_expedition.parts[part_to_update] = expedition_part;
                    }

                    current_expedition.parts.sort((expedition_part_a: ExpeditionPart, expedition_part_b: ExpeditionPart) => {
                        if (expedition_part_a.position < expedition_part_b.position) return -1;
                        if (expedition_part_a.position > expedition_part_b.position) return 1;
                        return 0;
                    });
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_part_deleted$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_part_id: number) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    current_expeditions.forEach((current_expedition: Expedition) => {
                        const part_to_delete: number = current_expedition.parts
                            .findIndex((_part_to_delete: ExpeditionPart) => _part_to_delete.id === expedition_part_id);
                        if (part_to_delete > -1) {
                            current_expedition.parts.splice(part_to_delete, 1);
                        }
                    });
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_citizen_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_citizen: CitizenExpedition) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                        return _current_expedition.id === expedition_citizen.expedition_id;
                    });
                    if (!current_expedition) return current_expeditions;

                    const current_expedition_part: ExpeditionPart | undefined = current_expedition.parts.find((_current_expedition_part: ExpeditionPart) => {
                        return _current_expedition_part.id === expedition_citizen.expedition_part_id;
                    });
                    if (!current_expedition_part) return current_expeditions;

                    const citizen_to_update: number = current_expedition_part.citizens
                        .findIndex((_citizen_to_update: CitizenExpedition) => _citizen_to_update.id === expedition_citizen.id);

                    if (citizen_to_update < 0) {
                        current_expedition_part.citizens.push(expedition_citizen);
                    } else {
                        current_expedition_part.citizens[citizen_to_update] = expedition_citizen;
                    }
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_citizen_deleted$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_citizen_id: number) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    current_expeditions.forEach((current_expedition: Expedition) => {
                        current_expedition.parts.forEach((current_expedition_part: ExpeditionPart) => {
                            const citizen_to_delete: number = current_expedition_part.citizens
                                .findIndex((_citizen_to_delete: CitizenExpedition) => _citizen_to_delete.id === expedition_citizen_id);
                            if (citizen_to_delete > -1) {
                                current_expedition_part.citizens.splice(citizen_to_delete, 1);
                            }
                        });
                    });
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_part_orders_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_orders: ExpeditionOrder[]) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    for (const expedition_order of expedition_orders) {
                        const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                            return _current_expedition.id === expedition_order.expeditions_id;
                        });
                        if (!current_expedition) break;

                        const current_expedition_part: ExpeditionPart | undefined = current_expedition.parts.find((_current_expedition_part: ExpeditionPart) => {
                            return _current_expedition_part.id === expedition_order.expedition_parts_id;
                        });
                        if (!current_expedition_part) break;

                        const order_to_update: number = current_expedition_part.orders
                            .findIndex((_order_to_update: ExpeditionOrder) => _order_to_update.id === expedition_order.id);
                        if (order_to_update > -1) {
                            current_expedition_part.orders[order_to_update] = expedition_order;
                        } else {
                            current_expedition_part.orders.push(expedition_order);
                        }
                        current_expedition_part.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                    }
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_citizen_orders_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_orders: ExpeditionOrder[]) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    for (const expedition_order of expedition_orders) {
                        const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                            return _current_expedition.id === expedition_order.expeditions_id;
                        });
                        if (!current_expedition) break;

                        const current_expedition_part: ExpeditionPart | undefined = current_expedition.parts.find((_current_expedition_part: ExpeditionPart) => {
                            return _current_expedition_part.id === expedition_order.expedition_parts_id;
                        });
                        if (!current_expedition_part) break;

                        const current_expedition_citizen: CitizenExpedition | undefined = current_expedition_part.citizens
                            .find((_current_expedition_citizen: CitizenExpedition) => {
                                return _current_expedition_citizen.id === expedition_order.expedition_citizen_id;
                            });
                        if (!current_expedition_citizen) break;

                        const order_to_update: number = current_expedition_citizen.orders
                            .findIndex((_order_to_update: ExpeditionOrder) => _order_to_update.id === expedition_order.id);
                        if (order_to_update > -1) {
                            current_expedition_citizen.orders[order_to_update] = expedition_order;
                        } else {
                            current_expedition_citizen.orders.push(expedition_order);
                        }
                        current_expedition_citizen.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                    }
                    return [...current_expeditions];
                });
            });

        // // TODO
        // this.realtime_expeditions_service.expeditionOrderDeleted$
        //     .pipe(takeUntilDestroyed(this.destroy_ref))
        //     .subscribe(() => {
        //     });

        // // TODO
        // this.realtime_expeditions_service.expeditionOrdersUpdated$
        //     .pipe(takeUntilDestroyed(this.destroy_ref))
        //     .subscribe(() => {
        //     });

        this.realtime_expeditions_service.expedition_order_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_order: ExpeditionOrder) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                        return _current_expedition.id === expedition_order.expeditions_id;
                    });
                    if (!current_expedition) return current_expeditions;

                    const current_expedition_part: ExpeditionPart | undefined = current_expedition.parts.find((_current_expedition_part: ExpeditionPart) => {
                        return _current_expedition_part.id === expedition_order.expedition_parts_id;
                    });
                    if (!current_expedition_part) return current_expeditions;

                    const current_expedition_citizen: CitizenExpedition | undefined = current_expedition_part.citizens
                        .find((_current_expedition_citizen: CitizenExpedition) => {
                            return _current_expedition_citizen.id === expedition_order.expedition_citizen_id;
                        });
                    if (!current_expedition_citizen) {
                        const order_to_update: number = current_expedition_part.orders
                            .findIndex((_order_to_update: ExpeditionOrder) => _order_to_update.id === expedition_order.id);
                        if (order_to_update > -1) {
                            current_expedition_part.orders[order_to_update] = expedition_order;
                        } else {
                            current_expedition_part.orders.push(expedition_order);
                        }
                        current_expedition_part.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                    } else {
                        const order_to_update: number = current_expedition_citizen.orders
                            .findIndex((_order_to_update: ExpeditionOrder) => _order_to_update.id === expedition_order.id);
                        if (order_to_update > -1) {
                            current_expedition_citizen.orders[order_to_update] = expedition_order;
                        } else {
                            current_expedition_citizen.orders.push(expedition_order);
                        }
                        current_expedition_citizen.orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                    }
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_bag_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_bag: CitizenExpeditionBag) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const current_expedition: Expedition | undefined = current_expeditions.find((_current_expedition: Expedition) => {
                        return _current_expedition.id === expedition_bag.expeditions_id;
                    });
                    if (!current_expedition) return current_expeditions;

                    const current_expedition_part: ExpeditionPart | undefined = current_expedition.parts.find((_current_expedition_part: ExpeditionPart) => {
                        return _current_expedition_part.id === expedition_bag.expeditions_part_id;
                    });
                    if (!current_expedition_part) return current_expeditions;

                    const current_expedition_citizen: CitizenExpedition | undefined = current_expedition_part.citizens
                        .find((_current_expedition_citizen: CitizenExpedition) => {
                            return _current_expedition_citizen.id === expedition_bag.expeditions_citizen_id;
                        });
                    if (!current_expedition_citizen) return current_expeditions;

                    current_expedition_citizen.bag = expedition_bag;

                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_bag_deleted$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((bag_id: number) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    current_expeditions.forEach((current_expedition: Expedition) => {
                        current_expedition.parts.forEach((current_expedition_part: ExpeditionPart) => {
                            current_expedition_part.citizens.forEach((current_expedition_citizen: CitizenExpedition) => {
                                if (bag_id === current_expedition_citizen.bag.bag_id) {
                                    current_expedition_citizen.bag = new CitizenExpeditionBag();
                                    this.saveBag(current_expedition_citizen);
                                }
                            });
                        });
                    });
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.user_joined$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((user_ids: number[]) => {
                this.active_citizens_list.set([...user_ids]);
            });

        this.realtime_expeditions_service.user_left$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((user_ids: number[]) => {
                this.active_citizens_list.set([...user_ids]);
            });
    }

    /**
     * Enregistre le mode d'affichage des expéditions
     */
    public changeEditionMode(): void {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, JSON.stringify(this.edition_mode));
    }

    public async changeTab(event: MatTabChangeEvent): Promise<void> {
        const existing_expeditions: Expedition[] = await firstValueFrom(this.expedition_service.getExpeditions(this.selected_tab_index + 1));
        this.expeditions.set([...existing_expeditions]);
        this.editable = event.index >= this.current_day - 1;
    }

    public changeExpeditionState(expedition: Expedition, event: boolean): void {
        expedition.state = event ? 'ready' : 'stop';
        this.saveExpedition(expedition);
    }

    /** Importe les expéditions depuis celles du jour sélectionné */
    public async importExpeditions(day: number): Promise<void> {
        await this.realtime_expeditions_service.copyExpeditions(day, this.selected_tab_index + 1);
    }

    public addNewMemberToExpedition(expedition: Expedition, citizen_to_copy?: CitizenExpedition): void {
        expedition.parts.forEach(async (expedition_part: ExpeditionPart) => {
            await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, new CitizenExpedition(citizen_to_copy?.modelToDto()));
        });
    }

    public async addNewMemberToPart(expedition_part: ExpeditionPart, citizen_to_copy?: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, new CitizenExpedition(citizen_to_copy?.modelToDto()));
    }

    public async addNewExpedition(): Promise<void> {
        await this.realtime_expeditions_service.updateExpedition(this.selected_tab_index + 1, new Expedition());
    }

    public async addNewExpeditionPart(expedition: Expedition): Promise<void> {
        const new_part: ExpeditionPart = new ExpeditionPart();
        await this.realtime_expeditions_service.updateExpeditionPart(expedition, new_part);
    }

    public async removeCitizenFromPart(citizen: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.deleteExpeditionCitizen(citizen);
    }

    public removeExpedition(expedition: Expedition): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous effacer cette expédition ? Elle sera définitivement perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(async (confirm: boolean): Promise<void> => {
                if (confirm) {
                    await this.realtime_expeditions_service.deleteExpedition(expedition);
                }
            });
    }

    public removeExpeditionPart(expedition_part: ExpeditionPart): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous effacer cette partie d'expédition ? Elle sera définitivement perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(async (confirm: boolean): Promise<void> => {
                if (confirm) {
                    await this.realtime_expeditions_service.deleteExpeditionPart(expedition_part);
                }
            });
    }

    public openExpeditionOrders(orders: ExpeditionOrder[], prop: CitizenExpedition | ExpeditionPart): void {
        this.dialog
            .open<EditOrdersComponent, EditOrdersData>(EditOrdersComponent, {
                data: {
                    orders: orders,
                    citizen_id: prop instanceof CitizenExpedition ? prop.citizen_id : undefined
                },
                width: '80%'
            })
            .afterClosed()
            .subscribe(async (new_orders: ExpeditionOrder[]) => {
                if (new_orders) {
                    new_orders.forEach((new_order: ExpeditionOrder, index: number) => {
                        new_order.position = index;
                    });
                    if (prop instanceof CitizenExpedition) {
                        await this.realtime_expeditions_service.updateExpeditionCitizenOrders(prop, new_orders);
                    } else {
                        await this.realtime_expeditions_service.updateExpeditionPartOrders(prop, new_orders);
                    }
                }
            });

    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {CitizenExpedition} citizen
     * @param {number} item_id
     */
    public addItem(citizen: CitizenExpedition, item_id: number): void {
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item): boolean => item.id === item_id));
            this.saveBag(citizen);
        }
    }


    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {CitizenExpedition} citizen
     * @param {number} item_id
     */
    public removeItem(citizen: CitizenExpedition, item_id: number): void {
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.saveBag(citizen);
        }
    }

    /**
     * On vide complètement le sac
     *
     * @param {CitizenExpedition} citizen
     */
    public async emptyBag(citizen: CitizenExpedition): Promise<void> {
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            await this.realtime_expeditions_service.updateExpeditionBag(citizen);
        }
    }

    public openReorganize(): void {
        this.dialog
            .open<EditPositionsComponent, EditPositionsData>(EditPositionsComponent, {
                data: {expeditions: this.expeditions()},
                width: '500px'
            })
            .afterClosed()
            .subscribe((new_expeditions: Expedition[]) => {
                new_expeditions.forEach((new_expedition: Expedition, expedition_index: number) => {
                    new_expedition.position = expedition_index;

                    new_expedition.parts.forEach((new_expedition_part: ExpeditionPart, part_index: number) => {
                        new_expedition_part.position = part_index;
                    });
                    new_expedition.parts.sort((new_expedition_part_a: ExpeditionPart, new_expedition_part_b: ExpeditionPart) => {
                        if (new_expedition_part_a.position < new_expedition_part_b.position) return -1;
                        if (new_expedition_part_a.position > new_expedition_part_b.position) return 1;
                        return 0;
                    });
                });

                new_expeditions.sort((new_expedition_a: Expedition, new_expedition_b: Expedition) => {
                    if (new_expedition_a.position < new_expedition_b.position) return -1;
                    if (new_expedition_a.position > new_expedition_b.position) return 1;
                    return 0;
                });

                new_expeditions.forEach((new_expedition: Expedition) => {
                    this.saveExpedition(new_expedition);
                });
            });
    }

    public get spots(): number {
        let spots: number = 0;
        this.expeditions()?.forEach((expedition: Expedition) => {
            if (expedition.parts && expedition.parts.length > 0) {
                spots += expedition.parts[0].citizens.length || 0;
            }
        });
        return spots;
    }

    public get objectsList(): ListForAddRemove[] {
        return [
            {
                label: $localize`Favoris`, list: this.all_items.filter((item: Item) => {
                    return FAVORITE_EXPEDITION_ITEMS_UID.some((uid: string) => uid === item.uid);
                })
            },
            {label: $localize`Banque`, list: this.bank_items},
            {label: $localize`Tous`, list: this.all_items},
        ];
    }

    public async saveExpedition(expedition: Expedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpedition(this.selected_tab_index + 1, expedition);
    }

    public async saveExpeditionPart(expedition: Expedition, expedition_part: ExpeditionPart): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionPart(expedition, expedition_part);
    }

    public async saveOrder(order: ExpeditionOrder, change: MatCheckboxChange): Promise<void> {
        order.is_done = change.checked;
        await this.realtime_expeditions_service.updateExpeditionOrder(order);
    }

    public changeThirstyMode(citizen: CitizenExpedition): void {
        if (this.edition_mode) {
            if (citizen.is_preinscrit_soif === null || citizen.is_preinscrit_soif === undefined) {
                citizen.is_preinscrit_soif = false;
            } else if (citizen.is_preinscrit_soif) {
                citizen.is_preinscrit_soif = undefined;
            } else {
                citizen.is_preinscrit_soif = true;
            }
        } else {
            citizen.is_thirsty = !citizen.is_thirsty;
        }
    }

    public change7ApMode(citizen: CitizenExpedition): void {
        if (this.edition_mode) {
            if (citizen.starts_7_ap === null || citizen.starts_7_ap === undefined) {
                citizen.starts_7_ap = false;
            } else if (citizen.starts_7_ap) {
                citizen.starts_7_ap = undefined;
            } else {
                citizen.starts_7_ap = true;
            }
        }
    }

    public async saveCitizen(expedition_part: ExpeditionPart, citizen: CitizenExpedition, expedition_part_index?: number, expedition?: Expedition, citizen_index?: number): Promise<void> {
        console.log('expedition_part', expedition_part);
        if (expedition && expedition_part_index !== undefined && expedition_part_index !== null && citizen_index !== undefined && citizen_index !== null) {
            if (expedition_part_index === 0 && expedition?.parts.length > 1) {
                await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, citizen);

                let i: number = 0;
                for (const part of expedition.parts) {
                    const citizen_in_array: CitizenExpedition = part.citizens[citizen_index];
                    if (i > 0 && citizen_in_array && !citizen_in_array.citizen_id && citizen_in_array.citizen_id !== citizen.citizen_id) {
                        await this.realtime_expeditions_service.updateExpeditionCitizen(part, citizen);
                    }
                    i++;
                }
            } else {
                await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, citizen);
            }
        } else {
            await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, citizen);
        }
    }

    public async saveBag(citizen: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionBag(citizen);
    }

    public shareExpeditionForum(): void {
        let text: string = `[big][b][i]${$localize`Expéditions (J${this.selected_tab_index + 1})`}[/i][/b][/big]\n`;

        const pre_registered: Citizen[] = this.registered;
        text += `\n[rp=${$localize`Inscrits`}]\n`;
        if (pre_registered.length > 0) {
            pre_registered.forEach((citizen: Citizen, expedition_index: number, array: Citizen[]) => {
                text += `:${citizen.job?.value.id}: ${citizen.name}${expedition_index < array.length - 1 ? ', ' : ''}`;
            });
        }
        text += '\n[/rp]\n';

        this.expeditions().forEach((expedition: Expedition, expedition_index: number) => {
            text += `\n[collapse=${expedition.label || expedition_index + 1}]\n`;
            expedition.parts.forEach((part: ExpeditionPart, part_index: number) => {
                if (expedition.parts.length > 1) {
                    text += part.path || '';
                }

                part.citizens.forEach((citizen_expedition: CitizenExpedition) => {
                    text += '\n:middot: ';
                    if (citizen_expedition.preinscrit) {
                        const citizen: Citizen | undefined = this.all_citizens.find((_citizen: Citizen) => _citizen.id === citizen_expedition.citizen_id);
                        text += `:${getCitizenFromId(this.all_citizens, citizen_expedition.citizen_id)?.job?.value.id}: ` + citizen?.name || '';
                    } else if (citizen_expedition.preinscrit_job) {
                        text += `:${getCitizenFromId(this.all_citizens, citizen_expedition.citizen_id)?.job?.value.id}:`;
                    }
                });

                if (expedition.parts.length > 1 && part_index < expedition.parts.length - 1) {
                    text += '\n{hr}';
                }
            });
            text += '\n[/collapse]\n';

        });

        text += `[aparte]${$localize`Ce message a été généré à partir du site MyHordes Optimizer. Vous pouvez retrouver les expéditions en suivant [link=${environment.website_url}my-town/expeditions]ce lien[/link]`}[/aparte]`;

        this.clipboard.copy(text, $localize`Les expéditions ont bien été copiées au format forum`);
    }

    /** true si l'expédition doit être étendue par défaut */
    public isDefaultExpanded(expedition: Expedition): boolean {
        if (this.edition_mode) return true;
        const my_expedition: boolean = expedition.parts
            .some((part: ExpeditionPart) => part.citizens.some((citizen: CitizenExpedition) => citizen.citizen_id === this.me?.id));
        if (my_expedition) return true;
        const am_i_somewhere: boolean = this.expeditions()
            .some((some_expedition: Expedition) => some_expedition.parts
                .some((part: ExpeditionPart) => part.citizens
                    .some((citizen: CitizenExpedition) => citizen.citizen_id === this.me?.id)
                )
            );
        if (!am_i_somewhere && expedition.state === 'ready') return true;
        return false;
    }

    public get preRegisteredJobs(): { count: number, job: string }[] {
        const pre_registered_jobs: { count: number, job: string }[] = [];
        this.expeditions()?.forEach((expedition: Expedition) => {
            if (expedition.parts && expedition.parts.length > 0) {
                const part: ExpeditionPart = expedition.parts[0];
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    let pre_registered_job: { count: number, job: string } | undefined;
                    if (citizen.preinscrit_job) {
                        pre_registered_job = pre_registered_jobs
                            .find((_pre_registered_job: { count: number, job: string }) => _pre_registered_job?.job === citizen?.preinscrit_job);

                        if (pre_registered_job) {
                            pre_registered_job.count += 1;
                        } else {
                            pre_registered_jobs.push({count: 1, job: citizen?.preinscrit_job});
                        }
                    } else if (citizen.preinscrit) {
                        const pre_registered_citizen: Citizen = <Citizen>getCitizenFromId(this.all_citizens, citizen.citizen_id);
                        pre_registered_job = pre_registered_jobs
                            .find((_pre_registered_job: {
                                count: number,
                                job: string
                            }) => _pre_registered_job?.job === pre_registered_citizen?.job?.key);

                        if (pre_registered_job) {
                            pre_registered_job.count += 1;
                        } else {
                            pre_registered_jobs.push({count: 1, job: <string>pre_registered_citizen?.job?.key});
                        }
                    }
                });
            }
        });
        return pre_registered_jobs;
    }

    private get registered(): Citizen[] {
        const registered: Citizen[] = [];
        this.expeditions()?.forEach((expedition: Expedition) => {
            expedition.parts.forEach((part: ExpeditionPart) => {
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    if (getCitizenFromId(this.all_citizens, citizen.citizen_id)
                        && !registered.some((pre_registered_citizen: Citizen) => pre_registered_citizen.id === citizen.citizen_id)) {
                        registered.push(<Citizen>getCitizenFromId(this.all_citizens, citizen.citizen_id));
                    }
                });
            });
        });
        return registered;
    }
}

