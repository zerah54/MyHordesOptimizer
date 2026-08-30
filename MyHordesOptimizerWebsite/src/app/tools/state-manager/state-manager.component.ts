import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { forkJoin, Observable, of, Subject, switchMap } from 'rxjs';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { CitizenDayStateService } from '../../_abstract_model/services/citizen-day-state.service';
import { Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { CitizenStateStep } from '../../_abstract_model/types/citizen-state-step.class';
import { CitizenStateTrace } from '../../_abstract_model/types/citizen-state-trace.class';
import { CitizenState } from '../../_abstract_model/types/citizen-state.class';
import { Item } from '../../_abstract_model/types/item.class';
import { RankedOrder } from '../../_abstract_model/types/ranked-order.class';
import { CompactStepperComponent } from '../../_shared/compact-stepper/compact-stepper.component';
import { CompactToggleComponent } from '../../_shared/compact-toggle/compact-toggle.component';
import { IconApComponent } from '../../_shared/icon-ap/icon-ap.component';
import { IconEpComponent } from '../../_shared/icon-ep/icon-ep.component';
import { ListElementAddRemoveComponent } from '../../_shared/list-elements-add-remove/list-element-add-remove.component';

const angular_common: Imports = [CommonModule];
const components: Imports = [
    IconApComponent, IconEpComponent, CompactToggleComponent, CompactStepperComponent, ListElementAddRemoveComponent
];
const material_modules: Imports = [
    MatButtonModule, MatCardModule, MatDividerModule, MatIconModule, MatListModule, MatTooltipModule
];

type HydrationStatus = 'hydrated' | 'thirst1' | 'thirst2';

/** Une ligne du constructeur de séquence : soit un item choisi, soit un déplacement. */
interface StepEntry {
    step: CitizenStateStep;
    label: string;
    /** Item consommé, pour l'icône de la ligne d'historique — absent pour un déplacement. */
    item?: Item;
}

/** Un candidat de {@link RankedOrder}, ids résolus en objets pour l'affichage. */
interface RankedOrderView {
    items: Item[];
    tier: string;
    total_distance: number;
    final_state: CitizenState;
}

/** Payload d'un déclenchement de {@link StateManagerComponent.updateRanking}. */
interface RankingTrigger {
    state: CitizenState;
    item_ids: number[];
}

/** Une ligne affichée dans l'historique : l'action jouée et l'état qui en résulte. */
interface TraceRow {
    label: string;
    item?: Item;
    is_move: boolean;
    is_near_zone: boolean;
    state: CitizenState;
    ap_delta: number;
    sp_delta: number;
    added_statuses: string[];
    pdc: number;
}

@Component({
    selector: 'mho-state-manager',
    templateUrl: './state-manager.component.html',
    styleUrls: ['./state-manager.component.scss'],
    imports: [...angular_common, ...components, ...material_modules]
})
export class StateManagerComponent implements OnInit {
    private readonly api: ApiService = inject(ApiService);
    private readonly state_service: CitizenDayStateService = inject(CitizenDayStateService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected items: Item[] = [];
    /** Groupe unique proposé par le sac (`mho-list-element-add-remove`) pour ajouter un objet au sac de départ. */
    protected bag_lists: ListForAddRemove[] = [];
    protected readonly locale: string = moment.locale();
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly ap_icon: string = 'icons/ap_small' + (this.locale === 'de' ? '' : '_' + this.locale) + '.gif';
    protected readonly ep_icon: string = 'icons/sp_small' + (this.locale === 'de' ? '' : '_' + this.locale) + '.gif';
    /** Icônes des objets `bike_#00`/`shoe_#00`/`car_door_#00`, peuplées en {@link ngOnInit} depuis la liste complète des items. */
    protected bike_icon: string = '';
    protected shoe_icon: string = '';
    protected defence_cp_icon: string = '';
    /** Seul objet du jeu taggé `defence_cp` (voir CitizenPdcRules côté API) — car_door_#00. */
    private static readonly DEFENCE_CP_ITEM_UID: string = 'car_door_#00';
    protected readonly shield_icon: string = 'item/item_shield.gif';

    // --- Groupes de statuts (icônes à bascule) ---
    protected readonly hydration_options: StatusEnum[] = [StatusEnum.THIRST1, StatusEnum.THIRST2];
    protected readonly party_options: StatusEnum[] = [StatusEnum.DRUNK, StatusEnum.HUNGOVER, StatusEnum.DRUGGED, StatusEnum.ADDICT];
    protected readonly condition_options: StatusEnum[] = [StatusEnum.TIRED];

    // --- État de départ ---
    protected ap: number = 6;
    protected sp: number = 0;
    protected wounded: boolean = false;
    protected is_eclaireur: boolean = false;
    protected has_bike: boolean = false;
    protected has_shoes: boolean = false;
    protected walking_distance: number = 0;
    protected hydration_status: HydrationStatus = 'hydrated';
    protected party_statuses: string[] = [];
    protected condition_statuses: string[] = [];
    protected has_shield: boolean = false;
    protected has_defence_cp_item: boolean = false;
    protected is_guide: boolean = false;
    protected zone_citizen_count: number = 0;
    protected has_clean_pdc_perk: boolean = false;
    protected has_hydrated_pdc_perk: boolean = false;
    protected has_sober_pdc_perk: boolean = false;
    protected has_base_zone_control_perk: boolean = true;
    protected is_role_ghoul: boolean = false;
    /** Option de base du groupe hydratation : absence de soif, distincte du statut buff "Hydraté" (voir status_hydrated.gif). */
    protected readonly not_thirsty_label: string = $localize`Pas soif`;
    protected readonly clean_perk_icon: string = StatusEnum.CLEAN.img;
    protected readonly hydrated_perk_icon: string = StatusEnum.HYDRATED.img;
    protected readonly sober_perk_icon: string = StatusEnum.SOBER.img;

    // --- Constructeur de séquence ---
    /** Objets emportés au départ — se vide au fil des étapes jouées, voir {@link remainingBag}. */
    protected starting_bag: Item[] = [];
    protected steps: StepEntry[] = [];
    /** Ordre du meilleur candidat (1er classé), selon l'état courant — pilote {@link orderedRemainingBag}. */
    protected best_order: Item[] = [];
    /** Tous les ordres de consommation distincts du sac, du plus optimisé au pire — aperçu en lecture seule. */
    protected ranked_orders: RankedOrderView[] = [];

    // --- Résultat ---
    protected rows: TraceRow[] = [];
    /** État de départ tel que renvoyé par le serveur (PDC calculé) — voir {@link currentState}. Absent tant qu'aucun appel n'a abouti. */
    protected computed_starting_state?: CitizenState;

    // Déclencheur de {@link updateRanking}, passé par switchMap : sans ça, deux appels successifs
    // (ex. toggle rapide d'un perk PDC) peuvent résoudre dans le désordre et la réponse la plus
    // ancienne écrase l'état affiché le plus récent.
    private readonly ranking_trigger: Subject<RankingTrigger> = new Subject();

    public ngOnInit(): void {
        this.ranking_trigger.pipe(
            switchMap((trigger: RankingTrigger): Observable<RankedOrder[]> =>
                trigger.item_ids.length === 0 ? of([]) : this.state_service.rankOrders(trigger.state, trigger.item_ids)),
            takeUntilDestroyed(this.destroy_ref),
        ).subscribe((orders: RankedOrder[]) => {
            this.ranked_orders = orders.map((candidate: RankedOrder) => ({
                items: this.resolveOrder(candidate.order, this.starting_bag),
                tier: StateManagerComponent.TIER_LABELS[candidate.tier] ?? candidate.tier,
                total_distance: candidate.total_distance,
                final_state: candidate.final_state,
            }));
            this.best_order = this.ranked_orders[0]?.items ?? [];
        });

        forkJoin({
            items: this.api.getItems(),
            impactful_uids: this.state_service.getItemsWithStateImpact(),
        })
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(({ items, impactful_uids }: { items: Item[]; impactful_uids: string[] }) => {
                const impactful_uid_set: Set<string> = new Set(impactful_uids);
                this.items = items.filter((item: Item) => impactful_uid_set.has(item.uid));
                this.bag_lists = [{ label: $localize`Objets`, list: this.items }];
                this.bike_icon = items.find((item: Item) => item.uid === 'bike_#00')?.img ?? '';
                this.shoe_icon = items.find((item: Item) => item.uid === 'shoe_#00')?.img ?? '';
                this.defence_cp_icon = items.find((item: Item) => item.uid === StateManagerComponent.DEFENCE_CP_ITEM_UID)?.img ?? '';
                this.updateRanking();
            });

        // Le PDC (et tout champ calculé côté serveur) n'existe pas tant qu'aucun appel n'a été fait :
        // sans ça, "État actuel" afficherait 0 avant la moindre interaction.
        this.compute();
    }

    /** Ajoute un objet au sac de départ, pour {@link mho-list-element-add-remove}. */
    protected addToBag(item_id: number): void {
        const item: Item | undefined = this.items.find((item: Item) => item.id === item_id);
        if (item) {
            this.starting_bag.push(item);
            this.updateRanking();
        }
    }

    /** Retire une occurrence d'un objet du sac de départ. */
    protected removeFromBag(item_id: number): void {
        const index: number = this.starting_bag.findIndex((item: Item) => item.id === item_id);
        if (index > -1) {
            this.starting_bag.splice(index, 1);
            this.updateRanking();
        }
    }

    /** Vide le sac de départ. */
    protected emptyBagContent(): void {
        this.starting_bag = [];
        this.updateRanking();
    }

    /** {@link remainingBag} trié selon {@link best_order} (retombe sur l'ordre d'ajout tant que le classement n'est pas encore à jour). */
    protected orderedRemainingBag(): Item[] {
        const remaining: Item[] = this.remainingBag();
        const rank: Map<number, number> = new Map(this.best_order.map((item: Item, index: number) => [item.id, index]));
        return [...remaining].sort((a: Item, b: Item) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
    }

    /** Sac de départ moins les objets déjà consommés par la séquence en cours. */
    protected remainingBag(): Item[] {
        const remaining: Item[] = [...this.starting_bag];
        for (const entry of this.steps) {
            if (!entry.item) continue;
            const index: number = remaining.findIndex((item: Item) => item.id === entry.item?.id);
            if (index > -1) {
                remaining.splice(index, 1);
            }
        }
        return remaining;
    }

    /** Clic sur un objet du sac restant : ajoute l'étape de consommation et relance aussitôt le calcul. */
    protected useItem(item: Item): void {
        this.steps.push({
            step: CitizenStateStep.item(item.id),
            label: item.label[this.locale] ?? item.label['en'],
            item
        });
        this.compute();
    }

    /** Ajoute une étape de déplacement à la séquence et relance aussitôt le calcul. */
    protected addMoveStep(is_near_zone: boolean): void {
        this.steps.push({
            step: CitizenStateStep.move(is_near_zone),
            label: is_near_zone ? $localize`Déplacement (Zone 3km)` : $localize`Déplacement`
        });
        this.compute();
    }

    /** Ajoute une étape « chausser des baskets » à la séquence et relance aussitôt le calcul. */
    protected addEquipShoesStep(): void {
        this.steps.push({ step: CitizenStateStep.equipShoes(), label: $localize`Baskets` });
        this.compute();
    }

    /** Ajoute une étape « monter à vélo » à la séquence et relance aussitôt le calcul. */
    protected addMountBikeStep(): void {
        this.steps.push({ step: CitizenStateStep.mountBike(), label: $localize`Monter à vélo` });
        this.compute();
    }

    /** Ajoute une étape « descendre du vélo » à la séquence et relance aussitôt le calcul. */
    protected addDismountBikeStep(): void {
        this.steps.push({ step: CitizenStateStep.dismountBike(), label: $localize`Descendre du vélo` });
        this.compute();
    }

    /** Ajoute une étape « ramasser un objet de défense de zone » à la séquence et relance aussitôt le calcul. */
    protected addPickupDefenceCpItemStep(): void {
        this.steps.push({ step: CitizenStateStep.pickupDefenceCpItem(), label: $localize`Ramasse un objet de défense de zone` });
        this.compute();
    }

    /** Ajoute une étape « se transformer en goule » à la séquence et relance aussitôt le calcul. */
    protected addBecomeGhoulStep(): void {
        this.steps.push({ step: CitizenStateStep.becomeGhoul(), label: $localize`Se transforme en goule` });
        this.compute();
    }

    /** Vrai si l'objet de défense de zone n'est pas déjà signalé en possession, d'après l'état de départ et la séquence jouée. */
    protected canPickupDefenceCpItem(): boolean {
        return !this.currentEquipment().has_defence_cp_item;
    }

    /** Vrai si le citoyen n'est pas déjà une goule, d'après l'état de départ et la séquence jouée : on ne se goulifie qu'une fois. */
    protected canBecomeGhoul(): boolean {
        return !this.currentEquipment().is_role_ghoul;
    }

    /** Vrai si un déplacement est encore jouable : il reste des PA/PE, ou un objet du sac peut en restituer. */
    protected canMove(): boolean {
        const state: CitizenState = this.currentState();
        return state.ap + state.sp > 0 || this.remainingBag().length > 0;
    }

    /** Vrai si le vélo n'a pas encore été utilisé aujourd'hui : ni monté au départ, ni monté puis descendu dans la séquence. */
    protected canMountBike(): boolean {
        const equipment = this.currentEquipment();
        return !equipment.has_bike && !equipment.bike_used;
    }

    /** Vrai si le citoyen est actuellement à vélo, d'après l'état de départ et la séquence jouée. */
    protected canDismountBike(): boolean {
        return this.currentEquipment().has_bike;
    }

    /** Vrai si les baskets ne sont pas encore chaussées, d'après l'état de départ et la séquence jouée. */
    protected canEquipShoes(): boolean {
        return !this.currentEquipment().has_shoes;
    }

    /** Rejoue localement les étapes vélo/baskets/objet de défense/goulification de la séquence, sans appel réseau. */
    private currentEquipment(): { has_bike: boolean; has_shoes: boolean; bike_used: boolean; has_defence_cp_item: boolean; is_role_ghoul: boolean } {
        let has_bike: boolean = this.has_bike;
        let has_shoes: boolean = this.has_shoes;
        let bike_used: boolean = this.has_bike;
        let has_defence_cp_item: boolean = this.has_defence_cp_item;
        let is_role_ghoul: boolean = this.is_role_ghoul;
        for (const entry of this.steps) {
            if (entry.step.type === 'mount_bike') {
                has_bike = true;
                bike_used = true;
            } else if (entry.step.type === 'dismount_bike') {
                has_bike = false;
            } else if (entry.step.type === 'equip_shoes') {
                has_shoes = true;
            } else if (entry.step.type === 'pickup_defence_cp_item') {
                has_defence_cp_item = true;
            } else if (entry.step.type === 'become_ghoul') {
                is_role_ghoul = true;
            }
        }
        return { has_bike, has_shoes, bike_used, has_defence_cp_item, is_role_ghoul };
    }

    /** Retire une étape de la séquence et relance aussitôt le calcul. */
    protected removeStep(index: number): void {
        this.steps.splice(index, 1);
        this.compute();
    }

    /** Ajoute ou retire une clé de statut d'une liste multi-sélection (party/condition), pour {@link mho-compact-toggle}. */
    protected toggleMultiStatus(list: string[], key: string, on: boolean): void {
        const index: number = list.indexOf(key);
        if (on && index === -1) {
            list.push(key);
        } else if (!on && index !== -1) {
            list.splice(index, 1);
        }
    }

    /** Bascule l'état d'hydratation, exclusif entre hydraté/thirst1/thirst2. */
    protected setHydration(key: string, on: boolean): void {
        this.hydration_status = (on ? key : 'hydrated') as HydrationStatus;
    }

    /** Construit une seule fois (StatusEnum.getByKey rescanne tous les statuts à chaque appel — trop coûteux dans une boucle de template). */
    private static readonly STATUS_LABELS: Record<string, string> = Object.fromEntries(
        StatusEnum.getAllValues<StatusEnum>().map((status: StatusEnum) => [status.key, status.label])
    );

    /** Libellé humain d'une clé de statut technique (thirst1, wound1, ...), pour les tooltips d'icônes. */
    protected statusLabel(status: string): string {
        return StateManagerComponent.STATUS_LABELS[status] ?? status;
    }

    /** Clés stables renvoyées par CitizenState/RankOrders (voir CitizenStateOrderRankingEngine côté API), jamais affichées telles quelles. */
    private static readonly TIER_LABELS: Record<string, string> = {
        none: $localize`Rien`,
        drugged: $localize`Drogué`,
        drunk: $localize`Alcoolisé`,
        thirsty: $localize`Soif`,
        wounded: $localize`Blessé`,
        addicted: $localize`Dépendant`,
        dehydrated: $localize`Déshydraté`,
        dead: $localize`Mort`,
    };

    /** État courant : dernière étape de la trace, sinon l'état de départ calculé côté serveur (PDC inclus) une fois {@link compute} passé, sinon l'état brut. */
    protected currentState(): CitizenState {
        if (this.rows.length > 0) return this.rows[this.rows.length - 1].state;
        return this.startingState();
    }

    /** État de départ calculé côté serveur (PDC inclus) une fois {@link compute} passé, sinon l'état brut — jamais affecté par la séquence jouée. */
    private startingState(): CitizenState {
        return this.computed_starting_state ?? this.buildStartingState();
    }

    /** Résout une liste d'ids (avec doublons éventuels) en objets du sac fourni, dans l'ordre donné. */
    private resolveOrder(item_ids: number[], bag: Item[]): Item[] {
        const pool: Item[] = [...bag];
        return item_ids.map((item_id: number) => {
            const index: number = pool.findIndex((item: Item) => item.id === item_id);
            return index > -1 ? pool.splice(index, 1)[0] : undefined;
        }).filter((item: Item | undefined): item is Item => item !== undefined);
    }

    /**
     * Recalcule le classement des ordres de consommation du sac de départ complet selon l'état de
     * départ — indépendant de la séquence déjà jouée. Passe par {@link ranking_trigger} (switchMap)
     * plutôt que de s'abonner ici : un appel qui répond après un appel plus récent (ex. deux toggles
     * rapprochés) ne doit jamais écraser son résultat.
     */
    private updateRanking(): void {
        this.ranking_trigger.next({
            state: this.startingState(),
            item_ids: this.starting_bag.map((item: Item) => item.id),
        });
    }

    /** Rejoue la séquence courante sur l'état de départ courant — toujours appelé, même sans étape, pour que l'état de départ (PDC inclus) soit calculé côté serveur dès le chargement. */
    protected compute(): void {
        const starting_state: CitizenState = this.buildStartingState();

        this.state_service.simulate(starting_state, this.steps.map((entry: StepEntry) => entry.step))
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((trace: CitizenStateTrace) => {
                this.computed_starting_state = trace.starting_state;
                let previous: CitizenState = trace.starting_state;
                this.rows = trace.steps.map((result, index) => {
                    const entry: StepEntry | undefined = this.steps[index];
                    const state: CitizenState = result.state_after;
                    const row: TraceRow = {
                        label: entry?.label ?? result.description,
                        item: entry?.item,
                        is_move: entry?.step.type === 'move',
                        is_near_zone: !!entry?.step.is_near_zone,
                        state,
                        ap_delta: state.ap - previous.ap,
                        sp_delta: state.sp - previous.sp,
                        added_statuses: state.statuses.filter((s: string) => !previous.statuses.includes(s)),
                        pdc: state.pdc,
                    };
                    previous = state;
                    return row;
                });
                this.updateRanking();
            });
    }

    private buildStartingState(): CitizenState {
        const starting_state: CitizenState = new CitizenState();
        starting_state.ap = this.ap;
        starting_state.sp = this.sp;
        starting_state.wounded = this.wounded;
        starting_state.is_eclaireur = this.is_eclaireur;
        starting_state.has_bike = this.has_bike;
        starting_state.has_shoes = this.has_shoes;
        starting_state.walking_distance = this.walking_distance;
        starting_state.statuses = [
            ...this.party_statuses,
            ...this.condition_statuses,
            ...(this.hydration_status === 'hydrated' ? [] : [this.hydration_status]),
            // wound1..wound6 sont strictement équivalents en jeu (isWounded = OR des 6) : un seul contrôle "Blessé" suffit.
            // wound1 seul (pas tg_meta_wound, tag interne sans icône) : Remove() purge toute la famille au soin.
            ...(this.wounded ? ['wound1'] : []),
        ];
        starting_state.has_shield = this.has_shield;
        starting_state.has_defence_cp_item = this.has_defence_cp_item;
        starting_state.is_guide = this.is_guide;
        starting_state.zone_citizen_count = this.zone_citizen_count;
        starting_state.has_clean_pdc_perk = this.has_clean_pdc_perk;
        starting_state.has_hydrated_pdc_perk = this.has_hydrated_pdc_perk;
        starting_state.has_sober_pdc_perk = this.has_sober_pdc_perk;
        starting_state.has_base_zone_control_perk = this.has_base_zone_control_perk;
        starting_state.is_role_ghoul = this.is_role_ghoul;
        return starting_state;
    }
}
