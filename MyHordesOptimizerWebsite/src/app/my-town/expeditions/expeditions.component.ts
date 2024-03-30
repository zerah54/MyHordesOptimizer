import { CommonModule, NgClass, NgForOf, NgOptimizedImage } from '@angular/common';
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
import { Subject, takeUntil } from 'rxjs';
import { v4 as UUID } from 'uuid';
import { EXPEDITIONS_EDITION_MODE_KEY, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { ExpeditionService } from '../../_abstract_model/services/expedition.service';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Item } from '../../_abstract_model/types/item.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { ListElementAddRemoveComponent } from '../../shared/elements/list-elements-add-remove/list-element-add-remove.component';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { getTown } from '../../shared/utilities/localstorage.util';
import { CitizensForExpePipe, SomeHeroicActionNeededPipe } from './citizens-for-expe.pipe';
import { EditOrdersComponent, EditOrdersData } from './edit-orders/edit-orders.component';
import { TotalPdcPipe } from './total-pdc.pipe';

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatCardModule, MatIconModule, MatSlideToggleModule, NgForOf, MatTabsModule, MatMenuModule, FormsModule, CommonModule, MatButtonModule, MatTooltipModule,
        NgClass, MatFormFieldModule, NgOptimizedImage, SelectComponent, MatCheckboxModule, MatInputModule, TotalPdcPipe, CitizensForExpePipe, ListElementAddRemoveComponent, SomeHeroicActionNeededPipe]
})
export class ExpeditionsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    protected expedition_service: ExpeditionService = inject(ExpeditionService);

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly current_day: number = getTown()?.day || 1;
    protected edition_mode: boolean = JSON.parse(localStorage.getItem(EXPEDITIONS_EDITION_MODE_KEY) || 'false');
    protected selected_tab_index: number = this.current_day - 1;
    protected all_citizens!: Citizen[];
    protected all_citizens_job!: JobEnum[];
    /** La liste des actions héroïques */
    protected all_heroics: HeroicActionEnum[] = (<HeroicActionEnum[]>HeroicActionEnum.getAllValues())
        .filter((action: HeroicActionEnum) => action.value.count_in_daily);
    /** La liste complète des items */
    protected all_items: Item[] = [];

    protected expeditions!: Expedition[];

    protected copy_expeditions!: Expedition[] | undefined;

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public constructor(private api: ApiService, private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.api.getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((citizens: CitizenInfo): void => {
                this.all_citizens = citizens.citizens;
                this.all_citizens_job = (JobEnum.getAllValues<JobEnum>())
                    .filter((job_enum: JobEnum) => this.all_citizens.some((citizen: Citizen): boolean => citizen.job?.key === job_enum.key));
            });
        this.api.getItems()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((items: Item[]) => this.all_items = items);

        this.expedition_service.getExpeditions(this.current_day)
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
                console.log('success');
                this.expeditions = expeditions;
            }
        });
    }

    public changeExpeditionState(expedition: Expedition, event: boolean): void {
        expedition.state = event ? 'ready' : 'stop';
        this.saveExpedition(expedition);
    }

    /** Enregistre les expéditions affichées pour les réutiliser dans un autre onglet */
    public copyExpeditions(): void {
        this.copy_expeditions = [...this.expeditions];
    }

    /** Remplace les expéditions de la page actuelle par celles enregistrées */
    public pasteExpeditions(): void {
        if (this.copy_expeditions) {
            this.expeditions = [];
            this.copy_expeditions.forEach((expedition: Expedition) => {
                expedition.id = UUID();
                this.expeditions.push(expedition);
            });
            this.copy_expeditions = undefined;
        }
    }

    public addNewMember(expedition: Expedition): void {
        expedition.parts.forEach((expedition_part: ExpeditionPart) => {
            this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, new CitizenExpedition()).subscribe({
                next: () => {
                    expedition_part.citizens.push(new CitizenExpedition());
                }
            });
        });
    }

    public addNewExpedition(): void {
        this.expedition_service.createOrUpdateExpedition(this.selected_tab_index + 1, new Expedition()).subscribe({
            next: () => {
                this.expeditions.push(new Expedition());
            }
        });
    }

    public addNewExpeditionPart(expedition: Expedition): void {
        this.expedition_service.createOrUpdateExpeditionPart(expedition, new ExpeditionPart()).subscribe({
            next: () => {
                expedition.parts.push(new ExpeditionPart());
            }
        });
    }

    public removeRow(expedition_part: ExpeditionPart, citizen_index: number): void {
        expedition_part.citizens.splice(citizen_index, 1);
        // TODO
    }

    public openExpeditionOrders(orders: ExpeditionOrder[], prop: CitizenExpedition | ExpeditionPart): void {
        const data: EditOrdersData = {
            orders: orders,
            citizen: prop instanceof CitizenExpedition ? prop.citizen : undefined
        };
        this.dialog.open(EditOrdersComponent, {
            data: data
        })
            .afterClosed()
            .subscribe((new_order: ExpeditionOrder[]) => {
                if (new_order) {
                    prop.orders = new_order;
                }
            });

    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen
     * @param {number} item_id
     *
     * TODO Factoriser avec le bag des citoyens
     */
    public addItem(expedition_part: ExpeditionPart, citizen: CitizenExpedition, item_id: number): void {
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item): boolean => item.id === item_id));
            this.saveCitizen(expedition_part, citizen);
        }
    }


    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen
     * @param {number} item_id
     */
    public removeItem(expedition_part: ExpeditionPart, citizen: CitizenExpedition, item_id: number): void {
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.saveCitizen(expedition_part, citizen);
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

    public get preRegistered(): string {
        const pre_registered: Citizen[] = [];
        this.expeditions.forEach((expedition: Expedition) => {
            expedition.parts.forEach((part: ExpeditionPart) => {
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    if (citizen.preinscrit
                        && !pre_registered.some((pre_registered_citizen: Citizen) => pre_registered_citizen.id === citizen.citizen.id)) {
                        pre_registered.push(citizen.citizen);
                    }
                });
            });
        });
        return pre_registered.map((citizen: Citizen) => {
            if (citizen.job) {
                return `<img src="${HORDES_IMG_REPO}/${citizen.job?.value.img}">&nbsp;${citizen.name}`;
            } else {
                return citizen.name;
            }
        }).join(', ');
    }

    public saveExpedition(expedition: Expedition): void {
        this.expedition_service.createOrUpdateExpedition(this.selected_tab_index + 1, expedition).subscribe({
            next: (new_expedition: Expedition) => {
                expedition = new_expedition;
            }
        });
    }

    public saveExpeditionPart(expedition: Expedition, expedition_part: ExpeditionPart): void {
        this.expedition_service.createOrUpdateExpeditionPart(expedition, expedition_part).subscribe({
            next: (new_expedition_part: ExpeditionPart) => {
                expedition_part = new_expedition_part;
            }
        });
    }

    public saveCitizen(expedition_part: ExpeditionPart, citizen: CitizenExpedition): void {
        this.expedition_service.createOrUpdateCitizenExpedition(expedition_part, citizen).subscribe({
            next: (new_citizen: CitizenExpedition) => {
                citizen = new_citizen;
            }
        });
    }
}

