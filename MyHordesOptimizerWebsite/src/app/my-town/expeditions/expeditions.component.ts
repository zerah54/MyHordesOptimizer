import { CommonModule, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment/moment';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EXPEDITIONS_EDITION_MODE_KEY, FAVORITE_EXPEDITION_ITEMS_UID, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { ExpeditionService } from '../../_abstract_model/services/expedition.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { dtoToModelArray, modelToDtoArray } from '../../_abstract_model/types/_common.class';
import { ListForAddRemove } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { CitizenExpeditionBag } from '../../_abstract_model/types/citizen-expedition-bag.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Item } from '../../_abstract_model/types/item.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/elements/confirm-dialog/confirm-dialog.component';
import { ListElementAddRemoveComponent } from '../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { CitizenFromIdPipe } from '../../shared/pipes/citizens-from-id.pipe';
import { DebugLogPipe } from '../../shared/pipes/debug-log.pipe';
import { ClipboardService } from '../../shared/services/clipboard.service';
import { getCitizenFromId } from '../../shared/utilities/citizen.util';
import { getTown } from '../../shared/utilities/localstorage.util';
import { CitizensForExpePipe, SomeHeroicActionNeededPipe } from './citizens-for-expe.pipe';
import { EditOrdersComponent, EditOrdersData } from './edit-orders/edit-orders.component';
import { EditPositionsComponent, EditPositionsData } from './edit-positions/edit-positions.component';
import { TotalPdcPipe } from './total-pdc.pipe';

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatCardModule, MatIconModule, MatSlideToggleModule, MatTabsModule, MatMenuModule, FormsModule, CommonModule, MatButtonModule, MatTooltipModule,
        NgClass, MatFormFieldModule, NgOptimizedImage, SelectComponent, MatCheckboxModule, MatInputModule, TotalPdcPipe, CitizensForExpePipe,
        ListElementAddRemoveComponent, SomeHeroicActionNeededPipe, CitizenFromIdPipe, DebugLogPipe]
})
export class ExpeditionsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La langue du site */
    public readonly locale: string = moment.locale();

    protected expedition_service: ExpeditionService = inject(ExpeditionService);

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

    protected expeditions!: Expedition[];

    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public constructor(private clipboard: ClipboardService, private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens = citizens.citizens;
                    this.all_citizens_job = (JobEnum.getAllValues<JobEnum>())
                        .filter((job_enum: JobEnum) => this.all_citizens.some((citizen: Citizen): boolean => citizen.job?.key === job_enum.key));
                }
            });
        this.api_service
            .getItems()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (items: Item[]) => this.all_items = items
            });

        this.town_service
            .getBank()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (bank: BankInfo) => {
                    this.bank_items = bank.items;
                }
            })

        this.expedition_service
            .getExpeditions(this.current_day)
            .subscribe({
                next: (expeditions: Expedition[]) => {
                    this.expeditions = expeditions;
                }
            });
    }

    /**
     * Enregistre le mode d'affichage des expéditions
     */
    public changeEditionMode(): void {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, JSON.stringify(this.edition_mode));
    }

    public changeTab(event: MatTabChangeEvent): void {
        this.expedition_service.getExpeditions(event.index + 1).subscribe({
            next: (expeditions: Expedition[]) => {
                this.expeditions = expeditions;
                this.editable = event.index >= this.current_day - 1;
            }
        });
    }

    public changeExpeditionState(expedition: Expedition, event: boolean): void {
        expedition.state = event ? 'ready' : 'stop';
        this.saveExpedition(expedition);
    }

    /** Importe les expéditions depuis celles du jour sélectionné */
    public importExpeditions(day: number): void {
        this.expedition_service.importExpeditions(day, this.selected_tab_index + 1)
            .subscribe({
                next: () => {
                }
            });
    }

    public addNewMemberToExpedition(expedition: Expedition, citizen_to_copy?: CitizenExpedition): void {
        expedition.parts.forEach((expedition_part: ExpeditionPart) => {
            this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, new CitizenExpedition(citizen_to_copy?.modelToDto())).subscribe({
                next: (citizen: CitizenExpedition) => {
                    expedition_part.citizens.push(citizen);
                }
            });
        });
    }

    public addNewMemberToPart(expedition_part: ExpeditionPart, citizen_to_copy?: CitizenExpedition): void {
        this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, new CitizenExpedition(citizen_to_copy?.modelToDto())).subscribe({
            next: (citizen: CitizenExpedition) => {
                expedition_part.citizens.push(citizen);
            }
        });
    }

    public addNewExpedition(): void {
        this.expedition_service.createOrUpdateExpedition(this.selected_tab_index + 1, new Expedition()).subscribe({
            next: (expedition: Expedition) => {
                this.expeditions.push(expedition);
                this.addNewExpeditionPart(expedition);
            }
        });
    }

    public addNewExpeditionPart(expedition: Expedition): void {
        const new_part: ExpeditionPart = new ExpeditionPart();
        this.expedition_service.createOrUpdateExpeditionPart(expedition, new_part).subscribe({
            next: (expedition_part: ExpeditionPart) => {
                expedition.parts.push(expedition_part);
                if (expedition.parts.length > 1) {
                    expedition.parts[0].citizens.forEach((existing_citizen: CitizenExpedition) => {
                        this.addNewMemberToPart(expedition_part, existing_citizen);
                    });
                } else {
                    this.addNewMemberToPart(expedition_part);
                }
            }
        });
    }

    public removeCitizenFromPart(citizen: CitizenExpedition, expedition_part: ExpeditionPart, citizen_index: number): void {
        this.expedition_service.deleteCitizenExpedition(citizen).subscribe(() => {
            expedition_part.citizens.splice(citizen_index, 1);
        });
    }

    public removeExpedition(expedition: Expedition, expedition_index: number): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous effacer cette expédition ? Elle sera définitivement perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((confirm: boolean): void => {
                if (confirm) {
                    this.expedition_service.deleteExpedition(expedition).subscribe(() => {
                        this.expeditions.splice(expedition_index, 1);
                    });
                }
            });
    }

    public removeExpeditionPart(expedition_part: ExpeditionPart, expedition_part_index: number, expedition: Expedition): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Voulez-vous effacer cette partie d'expédition ? Elle sera définitivement perdue.`
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((confirm: boolean): void => {
                if (confirm) {
                    this.expedition_service.deleteExpeditionPart(expedition_part).subscribe(() => {
                        expedition.parts.splice(expedition_part_index, 1);
                    });
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
            .subscribe((new_orders: ExpeditionOrder[]) => {
                if (new_orders) {
                    new_orders.forEach((new_order: ExpeditionOrder, index: number) => {
                        new_order.position = index;
                    });
                    if (prop instanceof CitizenExpedition) {
                        this.expedition_service
                            .createOrUpdateOrdersForCitizen(new_orders, prop)
                            .subscribe({
                                next: (saved_order: ExpeditionOrder[]) => {
                                    prop.orders = [...saved_order];
                                }
                            });
                    } else {
                        this.expedition_service
                            .createOrUpdateOrdersForPart(new_orders, prop)
                            .subscribe({
                                next: (saved_order: ExpeditionOrder[]) => {
                                    prop.orders = [...saved_order];
                                }
                            });
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
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen
     */
    public emptyBag(expedition_part: ExpeditionPart, citizen: CitizenExpedition): void {
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            this.saveCitizen(expedition_part, citizen);
        }
    }

    public openReorganize(): void {
        this.dialog
            .open<EditPositionsComponent, EditPositionsData>(EditPositionsComponent, {
                data: {expeditions: this.expeditions},
                width: '500px'
            })
            .afterClosed()
            .subscribe((new_expeditions: Expedition[]) => {
                new_expeditions.forEach((new_expedition: Expedition, expedition_index: number) => {
                    new_expedition.position = expedition_index;

                    new_expedition.parts.forEach((new_expedition_part: ExpeditionPart, part_index: number) => {
                        new_expedition_part.position = part_index;
                    })
                    new_expedition.parts.sort((new_expedition_part_a: ExpeditionPart, new_expedition_part_b: ExpeditionPart) => {
                        if (new_expedition_part_a.position < new_expedition_part_b.position) return -1;
                        if (new_expedition_part_a.position > new_expedition_part_b.position) return 1;
                        return 0;
                    })
                });

                new_expeditions.sort((new_expedition_a: Expedition, new_expedition_b: Expedition) => {
                    if (new_expedition_a.position < new_expedition_b.position) return -1;
                    if (new_expedition_a.position > new_expedition_b.position) return 1;
                    return 0;
                });

                this.expeditions = [...dtoToModelArray(Expedition, modelToDtoArray(new_expeditions))];

                this.expeditions.forEach((expedition: Expedition) => {
                    this.saveExpedition(expedition);
                })

            });
    }

    public get formatedPreRegistered(): string {
        return this.preRegistered.map((citizen: Citizen) => {
            if (citizen.job) {
                return `<img src="${HORDES_IMG_REPO}/${citizen.job?.value.img}">&nbsp;${citizen.name}`;
            } else {
                return citizen.name;
            }
        }).join(', ');
    }

    public get spots(): number {
        let spots: number = 0;
        if (this.expeditions) {
            this.expeditions.forEach((expedition: Expedition) => {
                if (expedition.parts && expedition.parts.length > 0) {
                    spots += expedition.parts[0].citizens.length || 0;
                }
            });
        }
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
        ]
    }

    public saveExpedition(expedition: Expedition): void {
        this.expedition_service
            .createOrUpdateExpedition(this.selected_tab_index + 1, expedition)
            .subscribe({
                next: (new_expedition: Expedition) => {
                    expedition = new_expedition;
                }
            });
    }

    public saveExpeditionPart(expedition: Expedition, expedition_part: ExpeditionPart): void {
        this.expedition_service
            .createOrUpdateExpeditionPart(expedition, expedition_part)
            .subscribe({
                next: (new_expedition_part: ExpeditionPart) => {
                    expedition_part = new_expedition_part;
                }
            });
    }

    public saveOrder(order: ExpeditionOrder): void {
        order.is_done = !order.is_done;
        this.expedition_service.updateOrder(order)
            .subscribe({
                next: (new_order: ExpeditionOrder) => {
                    order = new_order;
                }
            });
    }

    public saveCitizen(expedition_part: ExpeditionPart, citizen: CitizenExpedition, expedition_part_index?: number, expedition?: Expedition, citizen_index?: number): void {
        if (expedition && expedition_part_index !== undefined && expedition_part_index !== null && citizen_index !== undefined && citizen_index !== null) {
            if (expedition_part_index === 0 && expedition?.parts.length > 1) {
                expedition.parts.forEach((part: ExpeditionPart, index: number) => {
                    if (index > 0 && part.citizens[citizen_index]) {
                        part.citizens[citizen_index].citizen_id = citizen.citizen_id;
                        part.citizens[citizen_index].preinscrit = citizen.preinscrit;
                        part.citizens[citizen_index].pdc = citizen.pdc;
                        part.citizens[citizen_index].preinscrit_job = citizen.preinscrit_job;
                        part.citizens[citizen_index].preinscrit_heroic_skill = citizen.preinscrit_heroic_skill;
                        this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, citizen).subscribe({
                            next: (new_citizen: CitizenExpedition) => {
                                citizen = new_citizen;
                            }
                        });
                    }
                });
            } else {
                this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, citizen).subscribe({
                    next: (new_citizen: CitizenExpedition) => {
                        citizen = new_citizen;
                    }
                });
            }
        } else {
            this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, citizen).subscribe({
                next: (new_citizen: CitizenExpedition) => {
                    citizen = new_citizen;
                }
            });
        }
    }

    public saveBag(citizen: CitizenExpedition): void {
        this.expedition_service
            .createOrUpdateBag(citizen)
            .subscribe({
                next: (new_bag: CitizenExpeditionBag) => {
                    citizen.bag = new_bag;
                }
            });
    }

    public shareExpeditionForum(): void {
        let text: string = `[big][b][i]${$localize`Expéditions (J${this.selected_tab_index + 1})`}[/i][/b][/big]\n`;

        let pre_registered: Citizen[] = this.preRegistered;
        text += `\n[rp=${$localize`Préinscrits`}]\n`;
        if (pre_registered.length > 0) {
            pre_registered.forEach((citizen: Citizen, expedition_index: number, array: Citizen[]) => {
                text += `:${citizen.job?.value.id}: ${citizen.name}${expedition_index < array.length - 1 ? ', ' : ''}`
            })
        }
        text += `\n[/rp]\n`

        this.expeditions.forEach((expedition: Expedition, expedition_index: number) => {
            text += `\n[collapse=${expedition.label || expedition_index + 1}]\n`;
            expedition.parts.forEach((part: ExpeditionPart, part_index: number) => {
                if (expedition.parts.length > 1) {
                    text += part.path || ''
                }

                part.citizens.forEach((citizen_expedition: CitizenExpedition) => {
                    text += `\n:middot: `
                    if (citizen_expedition.preinscrit) {
                        let citizen: Citizen | undefined = this.all_citizens.find((_citizen: Citizen) => _citizen.id === citizen_expedition.citizen_id);
                        text += citizen?.name || '';
                    } else if (citizen_expedition.preinscrit_job) {
                        text += `:${citizen_expedition.preinscrit_job.value.forum_icon}:`
                    }
                })

                if (expedition.parts.length > 1 && part_index < expedition.parts.length - 1) {
                    text += '\n{hr}'
                }
            });
            text += '[/collapse]\n';

        });

        text += `[aparte]${$localize`Ce message a été généré à partir du site MyHordes Optimizer. Vous pouvez retrouver les expéditions en suivant [link=${environment.website_url}my-town/expeditions]ce lien[/link]`}[/aparte]`;

        this.clipboard.copy(text, $localize`Les expéditions ont bien été copiées au format forum`);
    }

    public get preRegisteredJobs(): { count: number, job: JobEnum }[] {
        const pre_registered_jobs: { count: number, job: JobEnum }[] = [];
        this.expeditions?.forEach((expedition: Expedition) => {
            expedition.parts.forEach((part: ExpeditionPart) => {
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    let pre_registered_job: { count: number, job: JobEnum } | undefined;
                    if (citizen.preinscrit_job) {
                        pre_registered_job = pre_registered_jobs
                            .find((_pre_registered_job: { count: number, job: JobEnum }) => _pre_registered_job.job.key === citizen.preinscrit_job?.key)

                        if (pre_registered_job) {
                            pre_registered_job.count += 1;
                        } else {
                            pre_registered_jobs.push({count: 1, job: citizen.preinscrit_job})
                        }
                    } else if (citizen.preinscrit) {
                        let pre_registered_citizen: Citizen = <Citizen>getCitizenFromId(this.all_citizens, citizen.citizen_id);
                        pre_registered_job = pre_registered_jobs
                            .find((_pre_registered_job: { count: number, job: JobEnum }) => _pre_registered_job.job?.key === pre_registered_citizen.job?.key)

                        if (pre_registered_job) {
                            pre_registered_job.count += 1;
                        } else {
                            pre_registered_jobs.push({count: 1, job: <JobEnum>pre_registered_citizen.job})
                        }
                    }
                });
            });
        });
        return pre_registered_jobs;
    }

    private get preRegistered(): Citizen[] {
        const pre_registered: Citizen[] = [];
        this.expeditions?.forEach((expedition: Expedition) => {
            expedition.parts.forEach((part: ExpeditionPart) => {
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    if (citizen.preinscrit && getCitizenFromId(this.all_citizens, citizen.citizen_id)
                        && !pre_registered.some((pre_registered_citizen: Citizen) => pre_registered_citizen.id === citizen.citizen_id)) {
                        pre_registered.push(<Citizen>getCitizenFromId(this.all_citizens, citizen.citizen_id));
                    }
                });
            });
        });
        return pre_registered;
    }
}

