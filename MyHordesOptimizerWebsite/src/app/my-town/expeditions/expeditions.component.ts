import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, model, ModelSignal, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { firstValueFrom, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EXPEDITIONS_EDITION_MODE_KEY, FAVORITE_EXPEDITION_ITEMS_UID, HORDES_IMG_REPO } from '../../_abstract_model/const';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ExpeditionOrdersUpdate, RealtimeExpeditionsService } from '../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { ExpeditionService } from '../../_abstract_model/services/expedition.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports, ListForAddRemove, SpRequirementOperator } from '../../_abstract_model/types/_types';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizenExpeditionBag } from '../../_abstract_model/types/citizen-expedition-bag.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Item } from '../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../_abstract_model/types/map-route.class';
import { Me } from '../../_abstract_model/types/me.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { CitizenFromIdPipe } from '../../_core/pipes/citizens-from-id.pipe';
import { JobFromIdPipe } from '../../_core/pipes/job-from-id.pipe';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getCitizenFromId } from '../../_core/utilities/citizen.util';
import { getTown, user } from '../../_core/utilities/localstorage.util';
import { localizedLabel } from '../../_core/utilities/string.utils';
import { ActiveCitizensComponent } from '../../_shared/active-citizens/active-citizens.component';
import { CompactStepperComponent } from '../../_shared/compact-stepper/compact-stepper.component';
import { CompassRoseComponent } from '../../_shared/compass-rose/compass-rose.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { IconApComponent } from '../../_shared/icon-ap/icon-ap.component';
import { CountAvailableApPipe } from '../../_shared/list-elements-add-remove/count-available-ap.pipe';
import { ListElementAddRemoveComponent } from '../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { SelectComponent } from '../../_shared/select/select.component';
import { TriStateCheckboxComponent } from '../../_shared/tri-state-checkbox/tri-state-checkbox.component';
import { MapRoutesStore } from '../map/map-routes/map-routes.store';
import { CitizensForExpePipe, FormatPreRegisteredPipe, SomeHeroicActionNeededPipe } from './citizens-for-expe.pipe';
import { EditOrdersComponent, EditOrdersData } from './edit-orders/edit-orders.component';
import { EditPositionsComponent, EditPositionsData } from './edit-positions/edit-positions.component';
import { ExpeditionOrderComponent } from './expedition-order/expedition-order.component';
import { cloneOrder, generalOrders, ruinVisitsOf, sortOrdersByRoute, withCellOrders } from './expedition-orders/expedition-orders.util';
import { ExpeditionPartRouteComponent } from './expedition-part-route/expedition-part-route.component';
import { ApCheck, apCheck, ApLeg, meetsRequirements, scoutsLairBuilt, startingSp } from './expedition-resources.util';
import { ExpeditionRoadbookComponent } from './expedition-roadbook/expedition-roadbook.component';
import { isDayEditable } from './expeditions.utils';
import { TotalPdcPipe } from './total-pdc.pipe';

/** Opérateurs d'exigence de PE et leur symbole, « au moins » (valeur par défaut) en tête. */
const SP_OPERATORS: readonly { readonly value: SpRequirementOperator; readonly symbol: string }[] = [
    { value: 'min', symbol: '≥' },
    { value: 'max', symbol: '≤' },
    { value: 'exact', symbol: '=' }
];

/** Exigences d'une place, communes aux places de même rang de toutes les parties. */
type PlaceRequirement = Partial<Pick<CitizenExpedition, 'required_sp' | 'required_sp_operator' | 'requires_shoes'>>;

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [
    ActiveCitizensComponent, CompactStepperComponent, ExpeditionOrderComponent, ExpeditionPartRouteComponent, ExpeditionRoadbookComponent, IconApComponent, ListElementAddRemoveComponent,
    SelectComponent, TriStateCheckboxComponent
];
const pipes: Imports = [CitizensForExpePipe, CitizenFromIdPipe, CompassRoseComponent, FormatPreRegisteredPipe, JobFromIdPipe, SomeHeroicActionNeededPipe, TotalPdcPipe];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule];

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ExpeditionsComponent implements OnInit {

    protected readonly HORDES_IMG_REPO: Signal<string> = signal(HORDES_IMG_REPO);
    protected readonly me: Signal<Me | null> = user;
    /** La liste des actions héroïques */
    protected all_heroics: Signal<HeroicActionEnum[]> = signal((<HeroicActionEnum[]>HeroicActionEnum.getAllValues())
        .filter((action: HeroicActionEnum) => action.value.count_in_daily && action.value.action !== ''));

    public edition_mode: ModelSignal<boolean> = model(JSON.parse(localStorage.getItem(EXPEDITIONS_EDITION_MODE_KEY) || 'false'));
    public selected_tab_index: ModelSignal<number> = model(this.currentDay() - 1);

    protected all_citizens: WritableSignal<Citizen[]> = signal([]);
    protected all_citizens_job: WritableSignal<JobEnum[]> = signal([]);
    /** La liste complète des items */
    protected all_items: WritableSignal<Item[]> = signal([]);
    /** La liste des items en banque */
    private bank_items: WritableSignal<Item[]> = signal([]);
    protected expeditions: WritableSignal<Expedition[]> = signal([]);
    /** Carte de la ville (cases, position de la ville) : feuilles de route et cases des consignes. */
    protected map: WritableSignal<Town | undefined> = signal(undefined);
    protected all_ruins: WritableSignal<Ruin[]> = signal([]);
    /** Position de la ville, pour les coordonnées relatives des consignes par case. */
    protected town_position: Signal<MapRoutePoint | null> = computed((): MapRoutePoint | null => {
        const map: Town | undefined = this.map();
        return map ? { x: map.town_x, y: map.town_y } : null;
    });
    protected active_citizens_list: WritableSignal<number[]> = signal([]);
    protected editable: WritableSignal<boolean> = signal(true);
    /** Icône de l'objet « Chaussures de sport usées » (`shoe_#00`). */
    protected readonly shoe_icon: Signal<string> = computed((): string => this.all_items().find((item: Item): boolean => item.uid === 'shoe_#00')?.img ?? '');
    /** Nom de l'objet « Chaussures de sport usées » (`shoe_#00`) dans la langue du site. */
    protected readonly shoe_label: Signal<string> = computed((): string => localizedLabel(this.all_items().find((item: Item): boolean => item.uid === 'shoe_#00')?.label, moment.locale()));
    protected readonly sp_operators: typeof SP_OPERATORS = SP_OPERATORS;
    /** Repaire des Éclaireurs construit : sans lui, pas de cartographie supposée pour un jour futur. */
    protected readonly scouts_lair_built: Signal<boolean> = toSignal(
        inject(BuiltBuildingsService).builtUids().pipe(map(scoutsLairBuilt)),
        { initialValue: false }
    );
    /** PA apportés par un sac, pour l'avertissement de PA. */
    private readonly count_available_ap: CountAvailableApPipe = new CountAvailableApPipe();

    private readonly api_service: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly expedition_service: ExpeditionService = inject(ExpeditionService);
    private readonly realtime_expeditions_service: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    /** Tracés de la ville, pour le choix du tracé d'une partie (tenus à jour en temps réel). */
    protected readonly routes_store: MapRoutesStore = inject(MapRoutesStore);

    /**
     * Sa ville, ou une ancienne ville observée (le hub la suit alors) : écriture et synchro temps réel. Simple
     * observateur : lecture seule, sans synchro (le hub suit la ville du jeton, pas la ville observée).
     */
    protected readonly can_contribute: Signal<boolean> = inject(TownContextService).canContribute;

    public async ngOnInit(): Promise<void> {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens.set(citizens.citizens);
                    this.all_citizens_job.set((JobEnum.getAllValues<JobEnum>())
                        .filter((job_enum: JobEnum) => this.all_citizens()?.some((citizen: Citizen): boolean => citizen.job?.key === job_enum?.key)));
                }
            });
        this.api_service
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items.set(items);
                }
            });

        this.town_service
            .getMap()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (map: Town): void => {
                    this.map.set(map);
                }
            });

        this.api_service
            .getRuins()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (ruins: Ruin[]): void => {
                    this.all_ruins.set(ruins);
                }
            });

        // Ville affichée (la sienne, ou celle observée) : un simple observateur n'y reçoit aucun tracé.
        const map_id: number | undefined = getTown()?.town_id;
        if (map_id && (this.routes_store.map_id() !== map_id || this.routes_store.status() === 'error')) {
            this.routes_store.load(map_id);
        }

        this.town_service
            .getBank()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (bank: BankInfo) => {
                    this.bank_items.set(bank.items);
                }
            });

        const existing_expeditions: Expedition[] = await firstValueFrom(this.expedition_service.getExpeditions(this.selected_tab_index() + 1));
        this.expeditions.set([...existing_expeditions]);
        this.updateEditableForIndex(this.selected_tab_index());

        // Simple observateur : pas de synchro temps réel (le hub suit la ville du jeton, pas la ville observée)
        // et aucune édition possible. Une ancienne ville est suivie par le hub (TownObserverComponent).
        if (!this.can_contribute()) {
            this.edition_mode.set(false);
            this.editable.set(false);
            return;
        }

        this.subscribeToRealtimeExpeditions();
        this.declarePresence();
    }

    /**
     * Présent sur les expéditions tant que la page est ouverte : la connexion, partagée avec la carte, n'y suffit pas.
     * Sans effet si la page est déjà détruite (l'`await` d'`ngOnInit` a pu durer).
     */
    private declarePresence(): void {
        if (this.destroy_ref.destroyed) {
            return;
        }
        this.realtime_expeditions_service.joinPresence()
            .catch((error: unknown): void => console.warn('JoinPresence', error));
        this.destroy_ref.onDestroy((): void => {
            this.realtime_expeditions_service.leavePresence()
                .catch((error: unknown): void => console.warn('LeavePresence', error));
        });
    }

    /** Jour actuel de la ville, lu à la demande (jamais figé) pour ne pas désynchroniser le verrou de jour. */
    protected currentDay(): number {
        return getTown()?.day || 1;
    }

    /** La personne connectée remplit les exigences de la place (faux si elle n'est pas parmi les citoyens). */
    protected canJoin(place: CitizenExpedition, expedition_day: number): boolean {
        const citizen: Citizen | undefined = getCitizenFromId(this.all_citizens(), this.me()?.id);
        return citizen !== undefined && meetsRequirements(citizen, place, expedition_day, this.currentDay(), this.scouts_lair_built());
    }

    /** Coût en PA de la place affichée (partie `part_index`, rang `citizen_index`) : sa personne sur ses parties, avec les ressources de sa première place ; place vide : les places vides de ce rang. `null` sans tracé, ou sans personne ni exigence de PE. */
    protected apWarning(expedition: Expedition, part_index: number, citizen_index: number, expedition_day: number): ApCheck | null {
        const town: MapRoutePoint | null = this.town_position();
        const row: CitizenExpedition | undefined = expedition.parts[part_index]?.citizens[citizen_index];
        if (!town || !row || !expedition.parts.some((part: ExpeditionPart): boolean => !!part.map_route)) return null;

        const person_id: number | undefined = row.citizen_id;
        const part_places: (CitizenExpedition | undefined)[] = expedition.parts.map((part: ExpeditionPart): CitizenExpedition | undefined => {
            if (person_id) return part.citizens.find((candidate: CitizenExpedition): boolean => candidate.citizen_id === person_id);
            const same_rank: CitizenExpedition | undefined = part.citizens[citizen_index];
            return same_rank && !same_rank.citizen_id ? same_rank : undefined;
        });
        const place: CitizenExpedition = (person_id ? part_places.find((candidate: CitizenExpedition | undefined): boolean => candidate !== undefined) : undefined) ?? row;

        const citizen: Citizen | undefined = getCitizenFromId(this.all_citizens(), place.citizen_id);
        const sp: number | undefined = place.required_sp ?? (citizen ? startingSp(citizen, expedition_day, this.currentDay(), this.scouts_lair_built()) : undefined);
        if (sp === undefined) return null;

        const legs: ApLeg[] = expedition.parts.flatMap((part: ExpeditionPart, index: number): ApLeg[] => {
            const part_place: CitizenExpedition | undefined = part_places[index];
            return part_place ? [{ route: part.map_route?.cells ?? [], ruin_visits: ruinVisitsOf(part, part_place) }] : [];
        });
        return apCheck(legs, { base_ap: place.base_ap ?? 6, bag_ap: this.count_available_ap.transform(place.bag.items, this.objectsList), sp }, town);
    }

    /** Infobulle de l'avertissement de PA. */
    protected apWarningLabel(check: ApCheck): string {
        return $localize`${check.needed}:needed: PA nécessaires, ${check.available}:available: PA disponibles`;
    }

    /** PE de la place hors édition : l'exigence et son symbole, sinon les PE calculés de la personne placée. */
    protected spDisplay(place: CitizenExpedition, expedition_day: number): string {
        if (place.required_sp !== undefined && place.required_sp !== null) {
            const symbol: string = (SP_OPERATORS.find((operator: { value: SpRequirementOperator }): boolean => operator.value === place.required_sp_operator) ?? SP_OPERATORS[0]).symbol;
            return `${symbol} ${place.required_sp}`;
        }
        const citizen: Citizen | undefined = getCitizenFromId(this.all_citizens(), place.citizen_id);
        return citizen ? `${startingSp(citizen, expedition_day, this.currentDay(), this.scouts_lair_built())}` : '';
    }

    /** Exigence de PE au rang `citizen_index` ; sans opérateur, les places n'en ont plus. */
    protected async saveSpRequirement(expedition: Expedition, citizen_index: number, required_sp: number, operator: SpRequirementOperator | null): Promise<void> {
        await this.saveRequirement(expedition, citizen_index, { required_sp: operator === null ? undefined : required_sp, required_sp_operator: operator ?? undefined });
    }

    /** Exigence posée au rang `citizen_index` : recopiée sur la place de même rang de chaque partie, enregistrée avec son propre objet. */
    protected async saveRequirement(expedition: Expedition, citizen_index: number, requirement: PlaceRequirement): Promise<void> {
        for (const part of expedition.parts) {
            const place: CitizenExpedition | undefined = part.citizens[citizen_index];
            if (!place) continue;
            Object.assign(place, requirement);
            await this.realtime_expeditions_service.updateExpeditionCitizen(part, place);
        }
    }

    /** Un onglet n'est éditable que si son jour n'est pas déjà passé pour la ville. */
    private updateEditableForIndex(tab_index: number): void {
        this.editable.set(this.can_contribute() && isDayEditable(tab_index + 1, this.currentDay()));
    }

    private subscribeToRealtimeExpeditions(): void {
        this.realtime_expeditions_service.expedition_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition: Expedition) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    const expedition_to_update: number = current_expeditions
                        .findIndex((_expedition_to_update: Expedition) => _expedition_to_update.id === expedition.id);
                    if (expedition_to_update < 0) {
                        // La partie par défaut est créée côté serveur (SaveExpeditionAsync) : pas besoin
                        // de la redemander ici, elle arrive déjà dans expedition.parts.
                        current_expeditions.push(expedition);
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
                    // Comme en base (ON DELETE SET NULL) : plus aucune consigne n'attend l'expédition supprimée.
                    for (const current_expedition of current_expeditions) {
                        for (const current_expedition_part of [...current_expedition.parts]) {
                            const orders: ExpeditionOrder[] = [
                                ...(current_expedition_part.orders ?? []),
                                ...current_expedition_part.citizens.flatMap((citizen: CitizenExpedition): ExpeditionOrder[] => citizen.orders ?? [])
                            ].filter((order: ExpeditionOrder): boolean => order.target_expedition_id === expedition_id);
                            if (orders.length === 0) continue;
                            orders.forEach((order: ExpeditionOrder): void => {
                                order.target_expedition_id = null;
                            });
                            this.renewPart(current_expedition, current_expedition_part);
                        }
                    }

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
                        // Le membre par défaut de la première partie est créé côté serveur
                        // (SaveExpeditionPartAsync) : pas besoin de le redemander ici.
                        current_expedition.parts.push(expedition_part);
                        if (current_expedition.parts.length > 1) {
                            current_expedition.parts[0].citizens.forEach((existing_citizen: CitizenExpedition) => {
                                this.addNewMemberToPart(expedition_part, existing_citizen);
                            });
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
                    this.renewPart(current_expedition, current_expedition_part);
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_citizen_deleted$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((expedition_citizen_id: number) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    current_expeditions.forEach((current_expedition: Expedition) => {
                        [...current_expedition.parts].forEach((current_expedition_part: ExpeditionPart) => {
                            const citizen_to_delete: number = current_expedition_part.citizens
                                .findIndex((_citizen_to_delete: CitizenExpedition) => _citizen_to_delete.id === expedition_citizen_id);
                            if (citizen_to_delete > -1) {
                                current_expedition_part.citizens.splice(citizen_to_delete, 1);
                                this.renewPart(current_expedition, current_expedition_part);
                            }
                        });
                    });
                    return [...current_expeditions];
                });
            });

        // Les consignes d'une partie ou d'un citoyen arrivent en liste complète, avec leur propriétaire : la liste
        // est remplacée (une consigne retirée disparaît). Sans propriétaire (ancienne API), elles sont fusionnées.
        this.realtime_expeditions_service.expedition_part_orders_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((update: ExpeditionOrdersUpdate) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    for (const current_expedition of current_expeditions) {
                        for (const current_expedition_part of [...current_expedition.parts]) {
                            const owns: boolean = update.owner_id !== null
                                ? current_expedition_part.id === update.owner_id
                                : update.orders.some((order: ExpeditionOrder): boolean => order.expedition_parts_id === current_expedition_part.id && !order.expedition_citizen_id);
                            if (!owns) continue;
                            current_expedition_part.orders = this.mergeOrders(current_expedition_part.orders, update);
                            this.renewPart(current_expedition, current_expedition_part);
                        }
                    }
                    return [...current_expeditions];
                });
            });

        this.realtime_expeditions_service.expedition_citizen_orders_updated$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((update: ExpeditionOrdersUpdate) => {
                this.expeditions.update((current_expeditions: Expedition[]) => {
                    for (const current_expedition of current_expeditions) {
                        for (const current_expedition_part of [...current_expedition.parts]) {
                            let changed: boolean = false;
                            for (const current_expedition_citizen of current_expedition_part.citizens) {
                                const owns: boolean = update.owner_id !== null
                                    ? current_expedition_citizen.id === update.owner_id
                                    : update.orders.some((order: ExpeditionOrder): boolean => order.expedition_citizen_id === current_expedition_citizen.id);
                                if (!owns) continue;
                                current_expedition_citizen.orders = this.mergeOrders(current_expedition_citizen.orders, update);
                                changed = true;
                            }
                            if (changed) {
                                this.renewPart(current_expedition, current_expedition_part);
                            }
                        }
                    }
                    return [...current_expeditions];
                });
            });

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
                    const update: ExpeditionOrdersUpdate = { owner_id: null, orders: [expedition_order] };
                    if (current_expedition_citizen) {
                        current_expedition_citizen.orders = this.mergeOrders(current_expedition_citizen.orders, update);
                    } else {
                        current_expedition_part.orders = this.mergeOrders(current_expedition_part.orders, update);
                    }
                    this.renewPart(current_expedition, current_expedition_part);
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
                                // Le sac de remplacement est créé côté serveur (DeleteExpeditionBag) et
                                // arrive via ExpeditionBagUpdated : pas besoin de le redemander ici.
                                if (bag_id === current_expedition_citizen.bag.bag_id) {
                                    current_expedition_citizen.bag = new CitizenExpeditionBag();
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
    protected changeEditionMode(): void {
        localStorage.setItem(EXPEDITIONS_EDITION_MODE_KEY, JSON.stringify(this.edition_mode()));
    }

    protected async changeTab(event: MatTabChangeEvent): Promise<void> {
        const existing_expeditions: Expedition[] = await firstValueFrom(this.expedition_service.getExpeditions(this.selected_tab_index() + 1));
        this.expeditions.set([...existing_expeditions]);
        this.updateEditableForIndex(event.index);
    }

    protected changeExpeditionState(expedition: Expedition, event: boolean): void {
        expedition.state = event ? 'ready' : 'stop';
        this.saveExpedition(expedition);
    }

    /** Importe les expéditions depuis celles du jour sélectionné */
    protected async importExpeditions(day: number): Promise<void> {
        await this.realtime_expeditions_service.copyExpeditions(day, this.selected_tab_index() + 1);
    }

    protected addNewMemberToExpedition(expedition: Expedition, citizen_to_copy?: CitizenExpedition): void {
        expedition.parts.forEach(async (expedition_part: ExpeditionPart) => {
            await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, this.cloneCitizenForCopy(citizen_to_copy));
        });
    }

    protected async addNewMemberToPart(expedition_part: ExpeditionPart, citizen_to_copy?: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, this.cloneCitizenForCopy(citizen_to_copy));
    }

    /** modelToDto() renvoie l'id du citoyen copié : sans le retirer, la "copie" met à jour l'original au lieu d'en créer un nouveau. */
    private cloneCitizenForCopy(citizen_to_copy?: CitizenExpedition): CitizenExpedition {
        const clone: CitizenExpedition = new CitizenExpedition(citizen_to_copy?.modelToDto());
        clone.id = undefined;
        return clone;
    }

    protected async addNewExpedition(): Promise<void> {
        await this.realtime_expeditions_service.updateExpedition(this.selected_tab_index() + 1, new Expedition());
    }

    protected async addNewExpeditionPart(expedition: Expedition): Promise<void> {
        const new_part: ExpeditionPart = new ExpeditionPart();
        await this.realtime_expeditions_service.updateExpeditionPart(expedition, new_part);
    }

    protected async removeCitizenFromPart(citizen: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.deleteExpeditionCitizen(citizen);
    }

    protected removeExpedition(expedition: Expedition): void {
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

    protected removeExpeditionPart(expedition_part: ExpeditionPart): void {
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

    /**
     * Consignes générales (sans case) d'une partie ou d'un citoyen. L'enregistrement remplace toute la liste : les
     * consignes par case, que la feuille de route gère, sont reprises telles quelles.
     */
    protected openExpeditionOrders(prop: CitizenExpedition | ExpeditionPart): void {
        this.dialog
            .open<EditOrdersComponent, EditOrdersData>(EditOrdersComponent, {
                data: {
                    orders: generalOrders(prop.orders),
                    citizen_id: prop instanceof CitizenExpedition ? prop.citizen_id : undefined
                },
                width: '80%'
            })
            .afterClosed()
            .subscribe(async (new_orders: ExpeditionOrder[]) => {
                if (new_orders) {
                    const orders: ExpeditionOrder[] = withCellOrders(new_orders, prop.orders);
                    if (prop instanceof CitizenExpedition) {
                        await this.realtime_expeditions_service.updateExpeditionCitizenOrders(prop, orders);
                    } else {
                        await this.realtime_expeditions_service.updateExpeditionPartOrders(prop, orders);
                    }
                }
            });

    }

    /** Consignes générales d'une partie : celles par case sont dans la feuille de route. */
    protected generalOrdersOf(orders: ExpeditionOrder[] | undefined): ExpeditionOrder[] {
        return generalOrders(orders);
    }

    /** Consignes perso d'une place, dans l'ordre d'apparition sur le tracé de la partie. */
    protected citizenOrdersOf(expedition_part: ExpeditionPart, citizen: CitizenExpedition): ExpeditionOrder[] {
        return sortOrdersByRoute(citizen.orders ?? [], expedition_part.map_route?.cells ?? null);
    }

    /** Liée à un tracé, la partie prend la direction du premier déplacement de son tracé : la rose des vents ne se choisit plus. */
    protected isDirectionLocked(expedition_part: ExpeditionPart): boolean {
        return expedition_part.map_route_id !== null;
    }

    /** Une feuille de route n'a d'intérêt qu'avec un tracé, des consignes par case, ou pour en poser. */
    protected showRoadbook(part: ExpeditionPart): boolean {
        if (part.map_route || (this.edition_mode() && this.editable())) return true;
        return (part.orders ?? []).some((order: ExpeditionOrder): boolean => order.hasCell())
            || part.citizens.some((citizen: CitizenExpedition): boolean => (citizen.orders ?? []).some((order: ExpeditionOrder): boolean => order.hasCell()));
    }

    /** Tracé choisi pour une partie : enregistré, la partie (et sa direction) revient par le hub. */
    protected async changePartRoute(expedition: Expedition, expedition_part: ExpeditionPart, map_route_id: number | null): Promise<void> {
        const updated: ExpeditionPart = Object.assign(new ExpeditionPart(), expedition_part, { map_route_id });
        try {
            await this.realtime_expeditions_service.updateExpeditionPart(expedition, updated);
        } catch {
            this.snackbar.errorSnackbar($localize`Le tracé n'a pas pu être lié à la partie.`);
        }
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {CitizenExpedition} citizen
     * @param {number} item_id
     */
    protected addItem(citizen: CitizenExpedition, item_id: number): void {
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items().find((item: Item): boolean => item.id === item_id));
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
    protected removeItem(citizen: CitizenExpedition, item_id: number): void {
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
    protected async emptyBag(citizen: CitizenExpedition): Promise<void> {
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            await this.realtime_expeditions_service.updateExpeditionBag(citizen);
        }
    }

    protected openReorganize(): void {
        this.dialog
            .open<EditPositionsComponent, EditPositionsData>(EditPositionsComponent, {
                data: { expeditions: this.expeditions() },
                width: '500px'
            })
            .afterClosed()
            .subscribe((new_expeditions: Expedition[]) => {
                (new_expeditions ?? []).forEach((new_expedition: Expedition, expedition_index: number) => {
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

                (new_expeditions ?? []).forEach((new_expedition: Expedition) => {
                    this.saveExpedition(new_expedition);
                });
            });
    }

    protected get spots(): number {
        let spots: number = 0;
        this.expeditions()?.forEach((expedition: Expedition) => {
            if (expedition.parts && expedition.parts.length > 0) {
                spots += expedition.parts[0].citizens.length || 0;
            }
        });
        return spots;
    }

    protected get objectsList(): ListForAddRemove[] {
        return [
            {
                label: $localize`Favoris`, list: this.all_items().filter((item: Item) => {
                    return FAVORITE_EXPEDITION_ITEMS_UID.some((uid: string) => uid === item.uid);
                })
            },
            { label: $localize`Banque`, list: this.bank_items() },
            { label: $localize`Tous`, list: this.all_items() },
        ];
    }

    protected async saveExpedition(expedition: Expedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpedition(this.selected_tab_index() + 1, expedition);
    }

    protected async saveExpeditionPart(expedition: Expedition, expedition_part: ExpeditionPart): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionPart(expedition, expedition_part);
    }

    /** Consigne cochée ou décochée : la liste se met à jour au retour du hub. */
    protected async saveOrder(order: ExpeditionOrder, done: boolean): Promise<void> {
        const updated: ExpeditionOrder = cloneOrder(order);
        updated.is_done = done;
        await this.realtime_expeditions_service.updateExpeditionOrder(updated);
    }

    protected toggleThirsty(citizen: CitizenExpedition): void {
        citizen.is_thirsty = !citizen.is_thirsty;
    }

    /** Enregistre la place ; choisie dans la première partie, la personne est recopiée sur la place vide de même rang des autres parties. */
    protected async saveCitizen(expedition_part: ExpeditionPart, citizen: CitizenExpedition, expedition_part_index?: number, expedition?: Expedition, citizen_index?: number): Promise<void> {
        console.log('expedition_part', expedition_part);
        if (expedition && expedition_part_index !== undefined && expedition_part_index !== null && citizen_index !== undefined && citizen_index !== null) {
            if (expedition_part_index === 0 && expedition?.parts.length > 1) {
                await this.realtime_expeditions_service.updateExpeditionCitizen(expedition_part, citizen);

                let i: number = 0;
                for (const part of expedition.parts) {
                    const citizen_in_array: CitizenExpedition = part.citizens[citizen_index];
                    if (i > 0 && citizen_in_array && !citizen_in_array.citizen_id && citizen_in_array.citizen_id !== citizen.citizen_id) {
                        // Envoyer `citizen` (et son id) déplacerait côté API la place de la partie 0 vers celle-ci.
                        citizen_in_array.citizen_id = citizen.citizen_id;
                        citizen_in_array.preinscrit = citizen.preinscrit;
                        citizen_in_array.preinscrit_job = citizen.preinscrit_job;
                        await this.realtime_expeditions_service.updateExpeditionCitizen(part, citizen_in_array);
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

    private async saveBag(citizen: CitizenExpedition): Promise<void> {
        await this.realtime_expeditions_service.updateExpeditionBag(citizen);
    }

    protected shareExpeditionForum(): void {
        let text: string = `[big][b][i]${$localize`Expéditions (J${this.selected_tab_index() + 1})`}[/i][/b][/big]\n`;

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
                    text += part.map_route?.label || '';
                }

                part.citizens.forEach((citizen_expedition: CitizenExpedition) => {
                    text += '\n:middot: ';
                    if (citizen_expedition.preinscrit) {
                        const citizen: Citizen | undefined = this.all_citizens()?.find((_citizen: Citizen) => _citizen.id === citizen_expedition.citizen_id);
                        text += `:${getCitizenFromId(this.all_citizens(), citizen_expedition.citizen_id)?.job?.value.id}: ` + citizen?.name || '';
                    } else if (citizen_expedition.preinscrit_job) {
                        text += `:${getCitizenFromId(this.all_citizens(), citizen_expedition.citizen_id)?.job?.value.id}:`;
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
    protected isDefaultExpanded(expedition: Expedition): boolean {
        if (this.edition_mode()) return true;
        const my_expedition: boolean = expedition.parts
            .some((part: ExpeditionPart) => part.citizens.some((citizen: CitizenExpedition) => citizen.citizen_id === this.me()?.id));
        if (my_expedition) return true;
        const am_i_somewhere: boolean = this.expeditions()
            .some((some_expedition: Expedition) => some_expedition.parts
                .some((part: ExpeditionPart) => part.citizens
                    .some((citizen: CitizenExpedition) => citizen.citizen_id === this.me()?.id)
                )
            );
        if (!am_i_somewhere && expedition.state === 'ready') return true;
        return false;
    }

    protected get preRegisteredJobs(): { count: number, job: string }[] {
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
                            pre_registered_jobs.push({ count: 1, job: citizen?.preinscrit_job });
                        }
                    } else if (citizen.preinscrit) {
                        const pre_registered_citizen: Citizen = <Citizen>getCitizenFromId(this.all_citizens(), citizen.citizen_id);
                        pre_registered_job = pre_registered_jobs
                            .find((_pre_registered_job: {
                                count: number,
                                job: string
                            }) => _pre_registered_job?.job === pre_registered_citizen?.job?.key);

                        if (pre_registered_job) {
                            pre_registered_job.count += 1;
                        } else {
                            pre_registered_jobs.push({ count: 1, job: <string>pre_registered_citizen?.job?.key });
                        }
                    }
                });
            }
        });
        return pre_registered_jobs;
    }

    /**
     * Nouvelle référence pour une partie modifiée sur place : la feuille de route et le choix du tracé, à base de
     * signaux, ne relisent une partie que si sa référence change.
     */
    private renewPart(expedition: Expedition, part: ExpeditionPart): void {
        const index: number = expedition.parts.indexOf(part);
        if (index > -1) {
            expedition.parts[index] = Object.assign(new ExpeditionPart(), part);
        }
    }

    /** Liste complète reçue avec son propriétaire : elle remplace l'ancienne ; sinon, les consignes reçues sont mises à jour ou ajoutées. */
    private mergeOrders(current: ExpeditionOrder[] | undefined, update: ExpeditionOrdersUpdate): ExpeditionOrder[] {
        const orders: ExpeditionOrder[] = update.owner_id !== null ? [...update.orders] : [...(current ?? [])];
        if (update.owner_id === null) {
            for (const order of update.orders) {
                const index: number = orders.findIndex((candidate: ExpeditionOrder): boolean => candidate.id === order.id);
                if (index > -1) {
                    orders[index] = order;
                } else {
                    orders.push(order);
                }
            }
        }
        return orders.sort((order_a: ExpeditionOrder, order_b: ExpeditionOrder): number => order_a.position - order_b.position);
    }

    private get registered(): Citizen[] {
        const registered: Citizen[] = [];
        this.expeditions()?.forEach((expedition: Expedition) => {
            expedition.parts.forEach((part: ExpeditionPart) => {
                part.citizens.forEach((citizen: CitizenExpedition) => {
                    if (getCitizenFromId(this.all_citizens(), citizen.citizen_id)
                        && !registered.some((pre_registered_citizen: Citizen) => pre_registered_citizen.id === citizen.citizen_id)) {
                        registered.push(<Citizen>getCitizenFromId(this.all_citizens(), citizen.citizen_id));
                    }
                });
            });
        });
        return registered;
    }
}

