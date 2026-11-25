import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter, forkJoin, Observable, take } from 'rxjs';

import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { PlanLockDTO } from '../../_abstract_model/realtime-services/realtime-building-plans.service';
import { RealtimeNightwatchPlansService } from '../../_abstract_model/realtime-services/realtime-nightwatch-plans.service';
import { ApiService } from '../../_abstract_model/services/api.service';
import { BuildingPlanService } from '../../_abstract_model/services/building-plan.service';
import { NightwatchPlanService } from '../../_abstract_model/services/nightwatch-plan.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Building } from '../../_abstract_model/types/building.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { currentDeepLinkId, DEEP_LINK_PARAMS, replaceDeepLinkParams } from '../../_core/utilities/deep-link.util';
import { getTown, getUserId } from '../../_core/utilities/localstorage.util';
import { plannableDays } from '../../_shared/day-selector/plannable-days';
import { simulatedNightwatchCitizens } from '../../pre-town/simulated-citizens.util';
import { BuildingPlanDTO, BuildingPlansDTO, BuildingPlanStateDTO, TownDefenseStateDTO } from '../buildings/planning/plan.types';
import { PlanConflict, PlanLockState, PlanSaveState } from '../buildings/planning/planning.store';
import {
    emptyNightwatchContent,
    NightwatchCitizenStateDTO,
    NightwatchCityDefenseDTO,
    NightwatchItemDefDTO,
    NightwatchPlanContentDTO,
    NightwatchPlanDTO,
    NightwatchPlanRequestDTO,
    NightwatchPlansDTO,
    NightwatchReferentialDTO,
    NightwatchSimulationDTO,
    NightwatchSimulationRequestDTO,
    NightwatchStateDTO,
    NightwatchWatcherDTO
} from './nightwatch.types';
import { NightwatchAttackService } from './nightwatch-attack.service';
import { compareTotals, compareWatchers, WatcherGap } from './nightwatch-compare.util';
import {
    buildingFlags,
    deathRisk,
    itemDefense,
    NightwatchContext,
    PlannedWatcher,
    RealWatcher,
    SurvivalTier,
    survivalTier,
    townWatchDefense,
    WatcherAlert,
    watcherAlerts,
    watcherCap,
    watcherDefense
} from './nightwatch-model.util';
import { PlannedBuildings, plannedBuildings, RealBuildings } from './nightwatch-planned-buildings.util';
import {
    CityDefenseValues,
    offeredCapacity,
    remainingStock,
    remainingToCover,
    resolvedCityDefense,
    simulationPastWatches,
    verdict
} from './nightwatch-simulation.util';
import { ChestStock, computeCost, computeStock, CostSummary, StockLine, StockSources } from './nightwatch-stock.util';

/** Délai d'enregistrement automatique après la dernière modification de la copie de travail. */
export const NIGHTWATCH_AUTOSAVE_DELAY_MS: number = 400;

/** Attente maximale d'une saisie continue avant enregistrement : chaque enregistrement entretient la main (30 s d'inactivité côté API). */
export const NIGHTWATCH_AUTOSAVE_MAX_WAIT_MS: number = 10000;

/** Âge (heures) au-delà duquel le contenu d'un coffre est signalé comme périmé dans le bilan. */
export const STALE_CHEST_HOURS: number = 24;

/** Statuts du plan sans équivalent dans l'état réel (chien) : repris tels quels du plan pour le réel. */
export const PLAN_ONLY_STATUSES: readonly string[] = ['dog', 'dogSteak'];

/** Plafond des saisies numériques entières (limite de l'API). */
const MAX_INPUT: number = 100000;

/**
 * Saisie numérique bornée : nul conservé, plancher 0, plafond, arrondie à l'entier sauf mention contraire.
 * @param {number | null} value Saisie.
 * @param {number} max Plafond.
 * @param {boolean} integer Arrondir à l'entier.
 * @returns {number | null} Valeur bornée.
 */
function clampInput(value: number | null, max: number, integer: boolean = true): number | null {
    if (value === null) {
        return null;
    }
    return Math.min(max, Math.max(0, integer ? Math.round(value) : value));
}

/**
 * Poste de défense borné : coefficient FDD décimal plafonné à 10, niveau AD inchangé (-1 = non construit), les autres entiers.
 * @param {keyof NightwatchCityDefenseDTO} field Poste.
 * @param {number | null} value Saisie.
 * @returns {number | null} Valeur bornée.
 */
function cityDefenseInput(field: keyof NightwatchCityDefenseDTO, value: number | null): number | null {
    if (field === 'adLevel') {
        return value;
    }
    return field === 'fddCoefficient' ? clampInput(value, 10, false) : clampInput(value, MAX_INPUT);
}

/** Goule forcée dans le plan. */
const GHOUL_KEY: string = 'ghoul';
/** Goule retirée dans le plan, alors que la page citoyens la renseigne goule. */
const NOT_GHOUL_KEY: string = 'notGhoul';

/**
 * Goule retenue pour un veilleur : la saisie du plan l'emporte sur l'état de la page citoyens.
 * @param {readonly string[]} statuses Statuts prévus du veilleur.
 * @param {boolean} real Goule d'après la page citoyens.
 * @returns {boolean} Vrai si goule.
 */
function plannedGhoul(statuses: readonly string[], real: boolean): boolean {
    return statuses.includes(GHOUL_KEY) ? true : statuses.includes(NOT_GHOUL_KEY) ? false : real;
}

type OtherLock = Extract<PlanLockState, { kind: 'other' }>;

/** Main de cette connexion, avec la connexion qui l'a obtenue : une reconnexion en change et la rend caduque. */
interface HeldLock {
    kind: 'mine';
    connection_id: string;
}

type KnownLock = OtherLock | HeldLock;

const FREE_LOCK: PlanLockState = { kind: 'free' };
const MINE_LOCK: PlanLockState = { kind: 'mine' };

/** Calculs d'un veilleur du brouillon. */
export interface NightwatchWatcherRow {
    user_id: number;
    name: string;
    past_watches: number;
    defense: number;
    risk: number;
    tier: SurvivalTier;
    alerts: WatcherAlert[];
}

/** Totaux du brouillon : défense prévue/réelle, marge contre l'attaque estimée, coûts, effectif et plafond. */
export interface NightwatchTotals {
    defense: number;
    real_defense: number;
    /** Défense prévue - attaque estimée ; `null` si l'attaque est inconnue. */
    planned_margin: number | null;
    /** Défense réelle - attaque estimée ; `null` si l'attaque est inconnue. */
    real_margin: number | null;
    cost: CostSummary;
    watcher_count: number;
    cap: number;
}

/** Places de sac et encombrants offerts par les veilleurs d'un jour. */
export type OfferedCapacity = ReturnType<typeof offeredCapacity>;

/** Verdict de couverture d'un jour de simulation. */
export type SimulationVerdict = ReturnType<typeof verdict>;

/** Veilleur d'un jour de simulation. */
export interface SimulationWatcherView {
    user_id: number;
    risk: number;
    defense: number;
}

/** Calculs d'un jour de la simulation sélectionnée ; reste et verdict nuls tant que l'attaque est inconnue. */
export interface SimulationDayView {
    day: number;
    plan_id: number;
    attack: number | null;
    defense: CityDefenseValues;
    remaining: number | null;
    watch_defense: number;
    offered: OfferedCapacity;
    stock: Record<number, number>;
    verdict: SimulationVerdict | null;
    watchers: SimulationWatcherView[];
}

/**
 * Défense des objets du stuff global qu'aucun veilleur ne porte.
 * @param {NightwatchPlanContentDTO} content Contenu de la proposition.
 * @param {NightwatchContext} ctx Contexte de calcul du jour.
 * @returns {number} Défense de veille des objets non attribués.
 */
function unassignedDefense(content: NightwatchPlanContentDTO, ctx: NightwatchContext): number {
    let defense: number = 0;
    for (const [id, quantity] of Object.entries(content.globalItems ?? {})) {
        const item_id: number = Number(id);
        const assigned: number = content.watchers.reduce((sum: number, watcher: NightwatchWatcherDTO): number => sum + (watcher.items[item_id] ?? 0), 0);
        defense += Math.max(0, quantity - assigned) * itemDefense(item_id, ctx);
    }
    return defense;
}

/**
 * Copie profonde d'un contenu de plan.
 * @param {NightwatchPlanContentDTO} content Contenu à copier.
 * @returns {NightwatchPlanContentDTO} Copie indépendante.
 */
function cloneContent(content: NightwatchPlanContentDTO): NightwatchPlanContentDTO {
    return JSON.parse(JSON.stringify(content)) as NightwatchPlanContentDTO;
}

/**
 * État et actions de la page des plans de veille. Fourni par le composant racine de la page (jamais `providedIn: 'root'` :
 * il ouvre le hub temps réel).
 */
@Injectable()
export class NightwatchStore {

    private readonly plan_service: NightwatchPlanService = inject(NightwatchPlanService);
    private readonly realtime: RealtimeNightwatchPlansService = inject(RealtimeNightwatchPlansService);
    private readonly town_context: TownContextService = inject(TownContextService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly attack_service: NightwatchAttackService = inject(NightwatchAttackService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly building_plan_service: BuildingPlanService = inject(BuildingPlanService);
    private readonly api: ApiService = inject(ApiService);
    private readonly router: Router = inject(Router);
    private readonly town_service: TownService = inject(TownService);
    /** Niveau Endurant MHO de chaque citoyen (taille du sac) ; vide tant que les citoyens ne sont pas chargés. */
    private readonly endurance_levels: WritableSignal<ReadonlyMap<number, number | null>> = signal<ReadonlyMap<number, number | null>>(new Map<number, number | null>());
    /** Propositions de Chantiers de la ville ; vides tant qu'elles manquent. */
    private readonly building_plans: WritableSignal<BuildingPlanDTO[]> = signal<BuildingPlanDTO[]>([]);
    /** Uid de chaque chantier, par identifiant ; nul tant que le référentiel manque. */
    private readonly building_uids: WritableSignal<ReadonlyMap<number, string> | null> = signal<ReadonlyMap<number, string> | null>(null);
    /** Défense de chaque chantier, par uid ; vide tant que le référentiel manque. */
    private readonly building_defences: WritableSignal<ReadonlyMap<string, number>> = signal<ReadonlyMap<string, number>>(new Map<string, number>());
    /** Uid de chaque objet, par identifiant ; vide tant que le catalogue manque. */
    private readonly item_uids: WritableSignal<ReadonlyMap<number, string>> = signal<ReadonlyMap<number, string>>(new Map<number, string>());

    private readonly _loading: WritableSignal<boolean> = signal(false);
    private readonly _load_failed: WritableSignal<boolean> = signal(false);
    private readonly _conflict: WritableSignal<PlanConflict | null> = signal<PlanConflict | null>(null);
    private readonly plans_dto: WritableSignal<NightwatchPlansDTO | null> = signal(null);
    private readonly _referential: WritableSignal<NightwatchReferentialDTO | null> = signal(null);
    private readonly _state: WritableSignal<NightwatchStateDTO | null> = signal(null);
    /** État du jour courant relevé à l'ouverture : veilles réelles et banque des simulations (l'état d'un autre jour compte ses plans effectifs). */
    private readonly today_state: WritableSignal<NightwatchStateDTO | null> = signal<NightwatchStateDTO | null>(null);
    /** Défense réelle de la ville poste par poste ; nulle tant qu'elle manque. */
    private readonly town_defense: WritableSignal<TownDefenseStateDTO | null> = signal<TownDefenseStateDTO | null>(null);
    /** Attaque lue par jour pour les simulations. */
    private readonly simulation_attacks: WritableSignal<ReadonlyMap<number, number | null>> = signal<ReadonlyMap<number, number | null>>(new Map<number, number | null>());
    /** Jours dont l'attaque a déjà été demandée. */
    private readonly requested_attack_days: Set<number> = new Set<number>();
    private readonly _selected_simulation_id: WritableSignal<number | null> = signal<number | null>(null);
    private readonly _estimated_attack: WritableSignal<number | null> = signal<number | null>(null);
    private readonly _selected_day: WritableSignal<number> = signal(getTown()?.day ?? 1);
    private readonly selected_plan_id: WritableSignal<number | null> = signal(null);
    private readonly _draft: WritableSignal<NightwatchPlanContentDTO | null> = signal(null);
    private readonly _dirty: WritableSignal<boolean> = signal(false);
    private readonly _save_state: WritableSignal<PlanSaveState> = signal<PlanSaveState>('idle');
    /** Main connue par proposition (absente = libre). */
    private readonly locks: WritableSignal<ReadonlyMap<number, KnownLock>> = signal<ReadonlyMap<number, KnownLock>>(new Map<number, KnownLock>());
    /** Prise de main en cours par proposition, partagée par les demandes simultanées. */
    private readonly lock_requests: Map<number, Promise<PlanLockState>> = new Map<number, Promise<PlanLockState>>();
    /** Compteur de modifications de la copie de travail (sait si elle a bougé pendant un envoi). */
    private revision: number = 0;
    private autosave_timer: ReturnType<typeof setTimeout> | null = null;
    /** Échéance de l'enregistrement d'une modification en attente, fixée à sa première modification. */
    private autosave_deadline: number | null = null;
    /** Écriture en cours : une seule à la fois, chacune part avec la version rendue par la précédente. */
    private in_flight: Promise<boolean> | null = null;
    /** Incrémenté à chaque remplacement de la copie de travail : une réponse tardive ne touche pas à la suivante. */
    private draft_epoch: number = 0;
    private creating: boolean = false;
    /** Enregistrement d'une simulation en cours : un seul à la fois. */
    private simulation_saving: boolean = false;
    /** Modification de simulation arrivée pendant un enregistrement, à renvoyer ensuite. */
    private simulation_save_pending: boolean = false;

    public readonly current_day: number = getTown()?.day ?? 1;

    /** Ville de la page, relevée à l'ouverture : l'enregistrement de sortie part après que le contexte a changé. */
    private readonly map_id: number | undefined = getTown()?.town_id;
    public readonly loading: Signal<boolean> = this._loading.asReadonly();
    public readonly load_failed: Signal<boolean> = this._load_failed.asReadonly();
    public readonly conflict: Signal<PlanConflict | null> = this._conflict.asReadonly();
    public readonly selected_day: Signal<number> = this._selected_day.asReadonly();

    private readonly _copied_items: WritableSignal<Record<number, number> | null> = signal<Record<number, number> | null>(null);
    /** Stuff copié par « Copier le stuff », nul tant que rien n'a été copié. */
    public readonly copied_items: Signal<Record<number, number> | null> = this._copied_items.asReadonly();
    public readonly draft: Signal<NightwatchPlanContentDTO | null> = this._draft.asReadonly();
    public readonly dirty: Signal<boolean> = this._dirty.asReadonly();
    public readonly save_state: Signal<PlanSaveState> = this._save_state.asReadonly();
    public readonly referential: Signal<NightwatchReferentialDTO | null> = this._referential.asReadonly();
    public readonly state: Signal<NightwatchStateDTO | null> = this._state.asReadonly();

    /** Main sur la proposition sélectionnée. */
    public readonly lock: Signal<PlanLockState> = computed((): PlanLockState => this.lockOf(this.selected_plan_id()));

    /** Propositions de la ville. */
    public readonly plans: Signal<NightwatchPlanDTO[]> = computed((): NightwatchPlanDTO[] => this.plans_dto()?.plans ?? []);

    /** Simulations de la ville. */
    public readonly simulations: Signal<NightwatchSimulationDTO[]> = computed((): NightwatchSimulationDTO[] => this.plans_dto()?.simulations ?? []);

    public readonly selected_simulation_id: Signal<number | null> = this._selected_simulation_id.asReadonly();

    private readonly selected_simulation: Signal<NightwatchSimulationDTO | null> = computed((): NightwatchSimulationDTO | null =>
        this.simulations().find((simulation: NightwatchSimulationDTO): boolean => simulation.id === this._selected_simulation_id()) ?? null);

    /** Modification des simulations : citoyen hors mode observateur, quel que soit le jour affiché. */
    public readonly can_edit_simulations: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly());

    /** Droit d'écriture, main mise à part : citoyen, hors mode observateur, sur aujourd'hui ou un jour à venir (jour passé : lecture seule). */
    public readonly can_write: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly() && this._selected_day() >= this.current_day);

    /** Droit de modifier la proposition affichée : refusé tant qu'une autre connexion a la main. */
    public readonly can_edit: Signal<boolean> = computed((): boolean => this.can_write() && this.lock().kind !== 'other');

    /** Jour modifiable sans proposition : la création est proposée. */
    public readonly can_create: Signal<boolean> = computed((): boolean => this.can_write() && this.plans_of_day().length === 0);

    /** Jours proposés : voir `plannableDays`. */
    public readonly days: Signal<number[]> = computed((): number[] =>
        plannableDays(this.current_day, this.plans().map((plan: NightwatchPlanDTO): number => plan.day)));

    public readonly plans_of_day: Signal<NightwatchPlanDTO[]> = computed((): NightwatchPlanDTO[] =>
        this.plans().filter((plan: NightwatchPlanDTO): boolean => plan.day === this._selected_day()));

    public readonly selected_plan: Signal<NightwatchPlanDTO | null> = computed((): NightwatchPlanDTO | null =>
        this.plans_of_day().find((plan: NightwatchPlanDTO): boolean => plan.id === this.selected_plan_id()) ?? null);

    /**
     * Chantiers au soir du jour affiché d'après les propositions de Chantiers (relues à l'ouverture et à chaque changement de jour) ;
     * nul pour un jour passé ou tant que le référentiel des chantiers manque.
     */
    public readonly planned_buildings: Signal<PlannedBuildings | null> = computed((): PlannedBuildings | null => {
        const uids: ReadonlyMap<number, string> | null = this.building_uids();
        const state: NightwatchStateDTO | null = this._state();
        if (uids === null || state === null) {
            return null;
        }
        const real: RealBuildings = { built_uids: state.builtBuildingUids, round_path_level: state.roundPathLevel };
        return plannedBuildings(this.building_plans(), uids, real, this.current_day, this._selected_day(), this._draft()?.buildingPlanId ?? null);
    });

    /** Propositions de Chantiers du jour affiché, dont la veille peut retenir une. */
    public readonly building_plans_of_day: Signal<BuildingPlanDTO[]> = computed((): BuildingPlanDTO[] =>
        this.building_plans().filter((plan: BuildingPlanDTO): boolean => plan.day === this._selected_day()));

    /** Contexte de calcul ; nul tant que le référentiel et l'état ne sont pas chargés. */
    private readonly context: Signal<NightwatchContext | null> = computed((): NightwatchContext | null => {
        const referential: NightwatchReferentialDTO | null = this._referential();
        const state: NightwatchStateDTO | null = this._state();
        return referential === null || state === null ? null : {
            referential,
            town_is_panda: state.townIsPanda,
            ...buildingFlags(state, this.planned_buildings())
        };
    });

    /** Au moins un veilleur du brouillon porte le Discours rassurant. */
    private readonly discourse_active: Signal<boolean> = computed((): boolean =>
        (this._draft()?.watchers ?? []).some((watcher: NightwatchWatcherDTO): boolean => watcher.hasDiscourse));

    /** Veilleurs du brouillon tels que prévus. */
    private readonly planned: Signal<PlannedWatcher[]> = computed((): PlannedWatcher[] => {
        const state: NightwatchStateDTO | null = this._state();
        const simulation_id: number | null | undefined = this.selected_plan()?.simulationId;
        const day: number = this._selected_day();
        return (this._draft()?.watchers ?? []).map((watcher: NightwatchWatcherDTO): PlannedWatcher => {
            const past: number = simulation_id === null || simulation_id === undefined
                ? state?.pastWatches[watcher.userId] ?? 0
                : this.simulationPast(simulation_id, day, watcher.userId);
            return this.plannedWatcher(watcher, watcher.pastWatches ?? past);
        });
    });

    /** Jours de la simulation sélectionnée. */
    public readonly simulation_days: Signal<SimulationDayView[]> = computed((): SimulationDayView[] => {
        const simulation: NightwatchSimulationDTO | null = this.selected_simulation();
        const referential: NightwatchReferentialDTO | null = this._referential();
        const state: NightwatchStateDTO | null = this._state();
        if (simulation === null || referential === null || state === null) {
            return [];
        }
        const days: NightwatchPlanDTO[] = this.simulationPlans(simulation.id);
        const prefill: CityDefenseValues = this.defensePrefill();
        const planned_of_days: (PlannedBuildings | null)[] = days.map((plan: NightwatchPlanDTO): PlannedBuildings | null =>
            this.plannedOfDay(state, plan.day, plan.content.buildingPlanId ?? null));
        const defenses: CityDefenseValues[] = resolvedCityDefense(days, planned_of_days.map((planned: PlannedBuildings | null): CityDefenseValues =>
            ({ ...prefill, buildings: prefill.buildings + this.plannedBuildingsDefence(state, planned) })));
        const item_uids: ReadonlyMap<number, string> = this.item_uids();
        const single_use_ids: ReadonlySet<number> = new Set<number>(Object.entries(referential.items)
            .filter(([, def]: [string, NightwatchItemDefDTO]): boolean => def.usage === 'single')
            .map(([id]: [string, NightwatchItemDefDTO]): number => Number(id)));
        const attacks: ReadonlyMap<number, number | null> = this.simulation_attacks();
        return days.map((plan: NightwatchPlanDTO, index: number): SimulationDayView => {
            const ctx: NightwatchContext = { referential, town_is_panda: state.townIsPanda, ...buildingFlags(state, planned_of_days[index]) };
            const discourse: boolean = plan.content.watchers.some((watcher: NightwatchWatcherDTO): boolean => watcher.hasDiscourse);
            const watchers: SimulationWatcherView[] = plan.content.watchers.map((watcher: NightwatchWatcherDTO): SimulationWatcherView => {
                const input: PlannedWatcher = this.plannedWatcher(watcher, watcher.pastWatches ?? this.simulationPast(simulation.id, plan.day, watcher.userId));
                return { user_id: watcher.userId, risk: deathRisk(input, ctx), defense: watcherDefense(input, ctx, discourse) };
            });
            const watchers_defense: number = townWatchDefense(watchers.map((watcher: SimulationWatcherView): number => watcher.defense));
            const watch_defense: number = watchers_defense + unassignedDefense(plan.content, ctx);
            const attack: number | null = plan.content.attackOverride ?? attacks.get(plan.day) ?? null;
            const remaining: number | null = attack === null ? null : remainingToCover(attack, defenses[index], plan.content);
            return {
                day: plan.day,
                plan_id: plan.id,
                attack,
                defense: defenses[index],
                remaining,
                watch_defense,
                offered: offeredCapacity(plan.content.watchers.map((watcher: NightwatchWatcherDTO): Parameters<typeof offeredCapacity>[0][number] => ({
                    endurance_level: this.enduranceLevel(watcher.userId),
                    item_uids: Object.keys(watcher.items)
                        .map((id: string): string | undefined => item_uids.get(Number(id)))
                        .filter((uid: string | undefined): uid is string => uid !== undefined),
                    is_guardian: this.citizenState(watcher.userId)?.jobUid === JobEnum.GUARDIAN.key
                }))),
                stock: remainingStock(simulation.stock, days, plan.day, single_use_ids),
                verdict: remaining === null ? null : verdict(remaining, watch_defense, watchers.length === 0 ? 0 : watchers_defense / watchers.length),
                watchers
            };
        });
    });

    /** État réel des veilleurs du brouillon ; les statuts chien sont repris du plan. */
    private readonly real: Signal<RealWatcher[]> = computed((): RealWatcher[] => this.planned().map((planned: PlannedWatcher): RealWatcher => {
        const citizen: NightwatchCitizenStateDTO | undefined = this.citizenState(planned.user_id);
        const statuses: string[] = planned.statuses.filter((status: string): boolean => PLAN_ONLY_STATUSES.includes(status));
        if (citizen?.isDrugged === true) {
            statuses.push('drugged');
        }
        if (citizen?.isDrunk === true) {
            statuses.push('drunk');
        }
        if (citizen?.isThirsty === true) {
            statuses.push('thirsty');
        }
        if (citizen?.isImmune === true) {
            statuses.push('immune');
        }
        return { ...planned, items: citizen?.bag ?? {}, items_broken: citizen?.bagBroken ?? {}, statuses, is_ghoul: citizen?.isGhoul === true };
    }));

    /** Défense, risque, palier et alertes de chaque veilleur du brouillon. */
    public readonly watcher_rows: Signal<NightwatchWatcherRow[]> = computed((): NightwatchWatcherRow[] => {
        const ctx: NightwatchContext | null = this.context();
        if (ctx === null) {
            return [];
        }
        const discourse: boolean = this.discourse_active();
        return this.planned().map((planned: PlannedWatcher): NightwatchWatcherRow => {
            const risk: number = deathRisk(planned, ctx);
            return {
                user_id: planned.user_id,
                name: this.citizenState(planned.user_id)?.name ?? '?',
                past_watches: planned.past_watches,
                defense: watcherDefense(planned, ctx, discourse),
                risk,
                tier: survivalTier(risk),
                alerts: watcherAlerts(planned, ctx)
            };
        });
    });

    /** Le brouillon compte plus de veilleurs que le plafond du Chemin de ronde. */
    public readonly over_cap: Signal<boolean> = computed((): boolean => {
        const ctx: NightwatchContext | null = this.context();
        return ctx !== null && (this._draft()?.watchers.length ?? 0) > watcherCap(ctx);
    });

    /** Écarts entre le plan et l'état réel, par veilleur. */
    public readonly gaps: Signal<WatcherGap[]> = computed((): WatcherGap[] => {
        const ctx: NightwatchContext | null = this.context();
        return ctx === null ? [] : compareWatchers(this.planned(), this.real(), ctx, this.discourse_active());
    });

    /** Bilan des objets requis par le brouillon. */
    public readonly stock_lines: Signal<StockLine[]> = computed((): StockLine[] => {
        const state: NightwatchStateDTO | null = this._state();
        const draft: NightwatchPlanContentDTO | null = this._draft();
        if (state === null || draft === null) {
            return [];
        }
        const sources: StockSources = {
            bags: {}, bags_broken: {}, chests: [], bank: state.bank, bank_broken: state.bankBroken,
            desert: state.desert, desert_broken: state.desertBroken, manual: draft.manualStock
        };
        for (const citizen of state.citizens) {
            sources.bags[citizen.userId] = citizen.bag;
            sources.bags_broken[citizen.userId] = citizen.bagBroken;
            sources.chests.push(<ChestStock>{ user_id: citizen.userId, items: citizen.chest, items_broken: citizen.chestBroken, updated_at: citizen.chestUpdatedAt ?? null });
        }
        return computeStock(this.planned(), sources, new Date(), STALE_CHEST_HOURS);
    });

    /** Attaque lue pour le jour (surcharge du plan de chantiers ou estimation), hors surcharge du plan de veille ; `null` si inconnue. */
    public readonly estimated_attack: Signal<number | null> = this._estimated_attack.asReadonly();

    /** Attaque retenue : surcharge du plan de veille, sinon attaque lue pour le jour (surcharge du plan de chantiers ou estimation) ; `null` si inconnue. */
    public readonly attack: Signal<number | null> = computed((): number | null => this._draft()?.attackOverride ?? this._estimated_attack());

    /** Totaux du brouillon ; nuls tant que le calcul n'est pas possible. */
    public readonly totals: Signal<NightwatchTotals | null> = computed((): NightwatchTotals | null => {
        const ctx: NightwatchContext | null = this.context();
        const draft: NightwatchPlanContentDTO | null = this._draft();
        if (ctx === null || draft === null) {
            return null;
        }
        const attack: number | null = this.attack();
        const compared: { planned: number; real: number; margin_vs_attack: number | null } = compareTotals(this.gaps(), attack);
        const defense: number = townWatchDefense(this.watcher_rows().map((row: NightwatchWatcherRow): number => row.defense));
        return {
            defense,
            real_defense: compared.real,
            planned_margin: attack === null ? null : defense - attack,
            real_margin: compared.margin_vs_attack,
            cost: computeCost(this.stock_lines(), ctx.referential),
            watcher_count: draft.watchers.length,
            cap: watcherCap(ctx)
        };
    });

    /** Suit les événements temps réel ; la main tenue est libérée à la destruction du store. */
    public constructor() {
        // L'URL suit le jour et la proposition affichés (lien partageable), une fois les propositions chargées.
        effect((): void => {
            const day: number = this._selected_day();
            const plan_id: number | null = this.selected_plan_id();
            if (this.plans_dto() !== null) {
                untracked((): void => replaceDeepLinkParams(this.router, { [DEEP_LINK_PARAMS.day]: day, [DEEP_LINK_PARAMS.plan]: plan_id }));
            }
        });
        this.destroy_ref.onDestroy((): void => {
            void this.leavePlan(true);
        });
        this.follow(this.realtime.plan_saved$, (plan: NightwatchPlanDTO): void => this.onPlanSaved(plan));
        this.follow(this.realtime.plan_deleted$, (plan_id: number): void => this.onPlanDeleted(plan_id));
        this.follow(this.realtime.plan_effective_changed$, (plan: NightwatchPlanDTO): void => this.markEffective(plan));
        this.follow(this.realtime.plan_lock_changed$, (lock: PlanLockDTO): void => this.onLockChanged(lock));
        this.follow(this.realtime.simulations_changed$, (): void => this.reloadPlans());
        this.follow(this.realtime.reconnected$, (): void => {
            void this.onReconnected();
        });
    }

    /**
     * En pré-ville, remplace les citoyens de l'état par les citoyens simulés.
     * @param {NightwatchStateDTO} state État reçu.
     * @returns {NightwatchStateDTO} État à afficher.
     */
    private withSimulatedCitizens(state: NightwatchStateDTO): NightwatchStateDTO {
        const simulated: number | null = this.town_context.isPreTown() ? this.town_context.simulatedCitizens() : null;
        return simulated === null ? state : { ...state, citizens: simulatedNightwatchCitizens(simulated) };
    }

    /** Charge propositions, référentiel et état du jour, puis sélectionne la proposition du jour. */
    public load(): void {
        this._loading.set(true);
        this._load_failed.set(false);
        forkJoin({
            plans: this.plan_service.getPlans(this.map_id),
            referential: this.plan_service.getReferential(),
            state: this.plan_service.getState(this.current_day, this.map_id)
        }).subscribe({
            next: (data: { plans: NightwatchPlansDTO; referential: NightwatchReferentialDTO; state: NightwatchStateDTO }): void => {
                this.plans_dto.set(data.plans);
                this._referential.set(data.referential);
                this._state.set(this.withSimulatedCitizens(data.state));
                this.today_state.set(this._state());
                this._selected_day.set(this.current_day);
                this.selectPlanForDay(this.current_day);
                this.loadAttack(this.current_day);
                this.loadBuildingPlans();
                this.loadTownDefense();
                this.loadItemUids();
                this.loadBuildingUids();
                this.loadEnduranceLevels();
                this.openDeepLink();
                this._loading.set(false);
                // Le hub suit la ville du jeton reçu à l'ouverture de la connexion : la remettre à jour avant de relire les mains.
                void this.realtime.ensureTown().then((): Promise<void> => this.refreshLocks()).catch((error: unknown): void => console.warn('EnsureTown', error));
            },
            error: (): void => {
                this._load_failed.set(true);
                this._loading.set(false);
            }
        });
    }

    /**
     * Change de jour après avoir quitté la proposition affichée : sélectionne la proposition effective (ou la première) et relit l'état du jour.
     * @param {number} day Jour à afficher.
     */
    public selectDay(day: number): void {
        void this.leavePlan(true);
        this._selected_day.set(day);
        this.selectPlanForDay(day);
        this.loadAttack(day);
        this.loadBuildingPlans();
        this.plan_service.getState(day, this.map_id).subscribe({
            next: (state: NightwatchStateDTO): void => {
                if (this._selected_day() === day) {
                    this._state.set(this.withSimulatedCitizens(state));
                }
            },
            error: (): void => {
                if (this._selected_day() === day) {
                    // L'état du jour précédent ne doit pas passer pour celui du nouveau jour.
                    this._state.set(null);
                    this.snackbar.errorSnackbar($localize`Impossible de lire l'état de la ville pour ce jour`);
                }
            }
        });
    }

    /** Ouvre le jour et la proposition demandés par le lien de la page (`?day=&plan=`), s'ils existent. */
    private openDeepLink(): void {
        const day: number | null = currentDeepLinkId(this.router, DEEP_LINK_PARAMS.day);
        if (day !== null && day !== this._selected_day() && this.days().includes(day)) {
            this.selectDay(day);
        }
        const plan_id: number | null = currentDeepLinkId(this.router, DEEP_LINK_PARAMS.plan);
        if (plan_id !== null && plan_id !== this.selected_plan_id() && this.plans_of_day().some((plan: NightwatchPlanDTO): boolean => plan.id === plan_id)) {
            this.selectPlan(plan_id);
        }
    }

    /** Relit les propositions de Chantiers ; sans elles, rien n'est prévu. */
    private loadBuildingPlans(): void {
        this.building_plan_service.getPlans(this.map_id).pipe(take(1), takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (dto: BuildingPlansDTO): void => this.building_plans.set(dto.plans),
            error: (error: unknown): void => console.warn('Chantiers indisponibles pour la veille', error)
        });
    }

    /** Lit la défense réelle de la ville ; sans elle, les postes des simulations partent de 0. */
    private loadTownDefense(): void {
        this.building_plan_service.getState(true, this.map_id).pipe(take(1), takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (state: BuildingPlanStateDTO): void => this.town_defense.set(state.defense),
            error: (error: unknown): void => console.warn('Défense de la ville indisponible pour les simulations', error)
        });
    }

    /**
     * Pré-remplissage de la défense des simulations : défense réelle de la ville, la veille exclue.
     * @returns {CityDefenseValues} Postes du premier jour sans saisie.
     */
    private defensePrefill(): CityDefenseValues {
        const defense: TownDefenseStateDTO | null = this.town_defense();
        return {
            wall: defense?.base ?? 0,
            bankDefenseItems: defense?.items ?? 0,
            // Coefficient inconnu : les ODs comptent pour leur valeur brute.
            fddCoefficient: defense?.itemsMul ?? 1,
            homes: defense?.citizenHomes ?? 0,
            guardians: defense?.citizenGuardians ?? 0,
            souls: defense?.souls ?? 0,
            cemetery: defense?.cadavers ?? 0,
            buildings: defense?.buildings ?? 0,
            upgrades: defense?.upgrades ?? 0,
            guardTowerPa: 0,
            eveningVote: 0,
            dumpContribution: 0,
            adLevel: -1
        };
    }

    /**
     * Chantiers au soir d'un jour d'après les propositions de Chantiers.
     * @param {NightwatchStateDTO} state État réel.
     * @param {number} day Jour.
     * @param {number | null} building_plan_id Proposition de Chantiers retenue ; nulle = l'effective.
     * @returns {PlannedBuildings | null} Chantiers prévus ; nuls pour un jour passé ou sans référentiel des chantiers.
     */
    private plannedOfDay(state: NightwatchStateDTO, day: number, building_plan_id: number | null): PlannedBuildings | null {
        const uids: ReadonlyMap<number, string> | null = this.building_uids();
        const real: RealBuildings = { built_uids: state.builtBuildingUids, round_path_level: state.roundPathLevel };
        return uids === null ? null : plannedBuildings(this.building_plans(), uids, real, this.current_day, day, building_plan_id);
    }

    /**
     * Défense des chantiers prévus mais pas encore construits.
     * @param {NightwatchStateDTO} state État réel.
     * @param {PlannedBuildings | null} planned Chantiers prévus au soir du jour.
     * @returns {number} Défense ajoutée à celle des chantiers réels.
     */
    private plannedBuildingsDefence(state: NightwatchStateDTO, planned: PlannedBuildings | null): number {
        if (planned === null) {
            return 0;
        }
        const defences: ReadonlyMap<string, number> = this.building_defences();
        let defence: number = 0;
        for (const uid of planned.built_uids) {
            if (!state.builtBuildingUids.includes(uid)) {
                defence += defences.get(uid) ?? 0;
            }
        }
        return defence;
    }

    /** Charge le catalogue des objets (uid par identifiant) ; sans lui, les extensions de sac sont ignorées. */
    private loadItemUids(): void {
        this.api.getItems().pipe(take(1), takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (items: Item[]): void => this.item_uids.set(new Map<number, string>(items.map((item: Item): [number, string] => [item.id, item.uid]))),
            error: (error: unknown): void => console.warn('Catalogue des objets indisponible pour les simulations', error)
        });
    }

    /**
     * Veilleur tel que prévu pour le calcul.
     * @param {NightwatchWatcherDTO} watcher Veilleur de la proposition.
     * @param {number} past_watches Veilles passées retenues.
     * @returns {PlannedWatcher} Entrée du moteur.
     */
    private plannedWatcher(watcher: NightwatchWatcherDTO, past_watches: number): PlannedWatcher {
        return {
            user_id: watcher.userId,
            items: watcher.items,
            items_broken: {},
            statuses: watcher.statuses.filter((status: string): boolean => status !== NOT_GHOUL_KEY),
            is_ghoul: plannedGhoul(watcher.statuses, this.citizenState(watcher.userId)?.isGhoul === true),
            past_watches,
            is_pro: false,
            hero_bonus: 0,
            baths: 0
        };
    }

    /**
     * Propositions d'une simulation par jour croissant ; la proposition sélectionnée y figure avec sa copie de travail.
     * @param {number} simulation_id Simulation.
     * @returns {NightwatchPlanDTO[]} Propositions.
     */
    private simulationPlans(simulation_id: number): NightwatchPlanDTO[] {
        const draft: NightwatchPlanContentDTO | null = this._draft();
        const selected_id: number | null = this.selected_plan_id();
        return this.plans()
            .filter((plan: NightwatchPlanDTO): boolean => plan.simulationId === simulation_id)
            .map((plan: NightwatchPlanDTO): NightwatchPlanDTO => (plan.id === selected_id && draft !== null ? { ...plan, content: draft } : plan))
            .sort((a: NightwatchPlanDTO, b: NightwatchPlanDTO): number => a.day - b.day);
    }

    /**
     * Veilles passées d'un citoyen dans une simulation : réelles au jour courant plus celles de la simulation entre le jour courant et le jour considéré.
     * @param {number} simulation_id Simulation.
     * @param {number} day Jour considéré.
     * @param {number} user_id Citoyen.
     * @returns {number} Nombre de veilles.
     */
    private simulationPast(simulation_id: number, day: number, user_id: number): number {
        return simulationPastWatches(this.simulationPlans(simulation_id), day, user_id, this.today_state()?.pastWatches[user_id] ?? 0, this.current_day);
    }

    /**
     * Proposition d'une simulation pour un jour.
     * @param {number} simulation_id Simulation.
     * @param {number} day Jour.
     * @returns {NightwatchPlanDTO | undefined} Proposition, absente hors des jours de la simulation.
     */
    private simulationPlanOfDay(simulation_id: number, day: number): NightwatchPlanDTO | undefined {
        return this.plans().find((plan: NightwatchPlanDTO): boolean => plan.simulationId === simulation_id && plan.day === day);
    }

    /** Lit l'attaque des jours de la simulation sélectionnée pas encore demandés. */
    private loadSimulationAttacks(): void {
        const simulation_id: number | null = this._selected_simulation_id();
        if (simulation_id === null) {
            return;
        }
        for (const plan of this.simulationPlans(simulation_id)) {
            const day: number = plan.day;
            if (this.requested_attack_days.has(day)) {
                continue;
            }
            this.requested_attack_days.add(day);
            this.attack_service.attackOfDay(day).pipe(takeUntilDestroyed(this.destroy_ref)).subscribe((attack: number | null): void => {
                this.simulation_attacks.update((attacks: ReadonlyMap<number, number | null>): ReadonlyMap<number, number | null> =>
                    new Map<number, number | null>(attacks).set(day, attack));
            });
        }
    }

    /**
     * Sélectionne une simulation et sa proposition du jour affiché (jour courant si elle ne couvre pas le jour affiché) ;
     * sans simulation, revient à la proposition effective du jour.
     * @param {number | null} simulation_id Simulation ; nulle pour n'en suivre aucune.
     */
    public selectSimulation(simulation_id: number | null): void {
        this._selected_simulation_id.set(simulation_id);
        this.loadSimulationAttacks();
        const day: number = this._selected_day();
        if (simulation_id !== null && this.simulationPlanOfDay(simulation_id, day) === undefined && day !== this.current_day) {
            this.selectDay(this.current_day);
            return;
        }
        const plan: NightwatchPlanDTO | undefined = simulation_id === null ? this.planOfDay(day) : this.simulationPlanOfDay(simulation_id, day);
        if (plan !== undefined && plan.id !== this.selected_plan_id()) {
            this.selectPlan(plan.id);
        }
    }

    /**
     * Crée une simulation jusqu'au dernier jour à défendre, stock de départ = banque, puis l'ouvre.
     * @param {string} name Nom.
     * @param {number} last_day Dernier jour à défendre.
     */
    public createSimulation(name: string, last_day: number): void {
        if (!this.can_edit_simulations()) {
            return;
        }
        const request: NightwatchSimulationRequestDTO = { name, lastDay: last_day, stock: { ...(this.today_state()?.bank ?? {}) } };
        this.plan_service.saveSimulation(request, this.realtime.connectionId(), this.map_id).subscribe({
            next: (saved: NightwatchSimulationDTO): void => this.reloadPlans(saved.id),
            error: (): void => this.reloadPlans()
        });
    }

    /**
     * Renomme la simulation sélectionnée.
     * @param {string} name Nouveau nom (rogné ; vide = ignoré).
     */
    public renameSimulation(name: string): void {
        const trimmed: string = name.trim();
        if (trimmed !== '') {
            this.updateSimulation({ name: trimmed });
        }
    }

    /**
     * Change le dernier jour à défendre ; le serveur crée ou supprime les propositions concernées.
     * @param {number} last_day Dernier jour.
     */
    public setSimulationLastDay(last_day: number): void {
        this.updateSimulation({ lastDay: last_day });
    }

    /**
     * Quantité d'un objet du stock de départ ; une quantité nulle le retire.
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité.
     */
    public setSimulationStock(item_id: number, quantity: number): void {
        const stock: Record<number, number> = { ...(this.selected_simulation()?.stock ?? {}) };
        if (quantity > 0) {
            stock[item_id] = quantity;
        } else {
            delete stock[item_id];
        }
        this.updateSimulation({ stock });
    }

    /** Vide le stock de départ en un seul enregistrement. */
    public clearSimulationStock(): void {
        this.updateSimulation({ stock: {} });
    }

    /**
     * Duplique la simulation sélectionnée (avec ses propositions) et ouvre la copie.
     * @param {string} name Nom de la copie.
     */
    public duplicateSimulation(name: string): void {
        const simulation: NightwatchSimulationDTO | null = this.selected_simulation();
        if (!this.can_edit_simulations() || simulation === null) {
            return;
        }
        this.plan_service.duplicateSimulation(simulation.id, name, this.realtime.connectionId(), this.map_id).subscribe({
            next: (copy: NightwatchSimulationDTO): void => this.reloadPlans(copy.id),
            error: (): void => this.reloadPlans()
        });
    }

    /** Supprime la simulation sélectionnée ; ses propositions effectives restent, détachées. */
    public deleteSimulation(): void {
        const simulation: NightwatchSimulationDTO | null = this.selected_simulation();
        if (!this.can_edit_simulations() || simulation === null) {
            return;
        }
        this.plan_service.deleteSimulation(simulation.id, this.realtime.connectionId(), this.map_id).subscribe({
            next: (): void => {
                this._selected_simulation_id.set(null);
                this.reloadPlans();
            },
            error: (): void => this.reloadPlans()
        });
    }

    /**
     * Applique tout de suite la modification de la simulation sélectionnée, puis l'enregistre ; pendant un envoi, les modifications
     * suivantes s'accumulent et repartent ensemble sur la version rendue.
     * @param {Partial<Pick<NightwatchSimulationRequestDTO, 'name' | 'lastDay' | 'stock'>>} changes Champs modifiés.
     */
    private updateSimulation(changes: Partial<Pick<NightwatchSimulationRequestDTO, 'name' | 'lastDay' | 'stock'>>): void {
        const simulation: NightwatchSimulationDTO | null = this.selected_simulation();
        if (!this.can_edit_simulations() || simulation === null) {
            return;
        }
        this.replaceSimulation({ ...simulation, ...changes });
        if (this.simulation_saving) {
            this.simulation_save_pending = true;
            return;
        }
        this.sendSimulation(simulation.id);
    }

    /**
     * Envoie l'état local d'une simulation ; enchaîne l'envoi suivant si des modifications sont arrivées entre-temps.
     * @param {number} simulation_id Simulation.
     */
    private sendSimulation(simulation_id: number): void {
        const simulation: NightwatchSimulationDTO | undefined = this.simulations().find((candidate: NightwatchSimulationDTO): boolean => candidate.id === simulation_id);
        if (simulation === undefined) {
            return;
        }
        this.simulation_saving = true;
        this.simulation_save_pending = false;
        const request: NightwatchSimulationRequestDTO = {
            id: simulation.id, version: simulation.version, name: simulation.name, lastDay: simulation.lastDay, stock: simulation.stock
        };
        this.plan_service.saveSimulation(request, this.realtime.connectionId(), this.map_id).subscribe({
            next: (saved: NightwatchSimulationDTO): void => {
                this.simulation_saving = false;
                if (this.simulation_save_pending) {
                    const local: NightwatchSimulationDTO | undefined = this.simulations().find((candidate: NightwatchSimulationDTO): boolean => candidate.id === simulation_id);
                    if (local !== undefined) {
                        this.replaceSimulation({ ...local, version: saved.version });
                    }
                    this.sendSimulation(simulation_id);
                    return;
                }
                this.reloadPlans();
            },
            error: (error: unknown): void => {
                this.simulation_saving = false;
                this.simulation_save_pending = false;
                if (error instanceof HttpErrorResponse && error.status === 409) {
                    this.snackbar.warningSnackbar($localize`La simulation a été modifiée entre-temps : elle a été rechargée.`);
                }
                this.reloadPlans();
            }
        });
    }

    /**
     * Remplace localement une simulation de la liste (modification affichée avant son enregistrement).
     * @param {NightwatchSimulationDTO} simulation Simulation modifiée.
     */
    private replaceSimulation(simulation: NightwatchSimulationDTO): void {
        this.plans_dto.update((dto: NightwatchPlansDTO | null): NightwatchPlansDTO | null => dto === null ? null : {
            ...dto,
            simulations: (dto.simulations ?? []).map((candidate: NightwatchSimulationDTO): NightwatchSimulationDTO => candidate.id === simulation.id ? simulation : candidate)
        });
    }

    /**
     * Poste de défense de la ville saisi pour le jour ; nul = valeur reportée ou pré-remplie.
     * @param {keyof NightwatchCityDefenseDTO} field Poste.
     * @param {number | null} value Valeur.
     */
    public setCityDefense(field: keyof NightwatchCityDefenseDTO, value: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.cityDefense = { ...(content.cityDefense ?? {}), [field]: cityDefenseInput(field, value) };
        });
    }

    /**
     * Quantité d'un objet du stuff global du jour, jamais sous le total attribué aux veilleurs ; une quantité nulle le retire.
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité.
     */
    public setGlobalItem(item_id: number, quantity: number): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            const globals: Record<number, number> = { ...(content.globalItems ?? {}) };
            const assigned: number = content.watchers.reduce((sum: number, watcher: NightwatchWatcherDTO): number => sum + (watcher.items[item_id] ?? 0), 0);
            const floored: number = Math.max(quantity, assigned);
            if (floored > 0) {
                globals[item_id] = floored;
            } else {
                delete globals[item_id];
            }
            content.globalItems = globals;
        });
    }

    /**
     * Débordement autorisé.
     * @param {number | null} value Valeur, ou `null`.
     */
    public setAllowedOverflow(value: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.allowedOverflow = clampInput(value, MAX_INPUT);
        });
    }

    /**
     * Pourcentage retranché à l'attaque.
     * @param {number | null} value Pourcentage, ou `null`.
     */
    public setAttackReduction(value: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.attackReductionPercent = clampInput(value, 100);
        });
    }

    /**
     * Dégâts du réacteur.
     * @param {number | null} value Dégâts, ou `null`.
     */
    public setReactorDamage(value: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.reactorDamage = clampInput(value, MAX_INPUT);
        });
    }

    /**
     * Niveau Endurant MHO d'un citoyen (taille du sac).
     * @param {number} user_id Citoyen.
     * @returns {number | null} Niveau, nul s'il est inconnu.
     */
    public enduranceLevel(user_id: number): number | null {
        return this.endurance_levels().get(user_id) ?? null;
    }

    /** Charge le niveau Endurant des citoyens ; sans eux, la taille des sacs reste inconnue. */
    private loadEnduranceLevels(): void {
        this.town_service.getCitizens().pipe(take(1), takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (info: CitizenInfo): void => this.endurance_levels.set(new Map<number, number | null>(
                info.citizens.map((citizen: Citizen): [number, number | null] => [citizen.id, citizen.hero_skills.e]))),
            error: (error: unknown): void => console.warn('Citoyens indisponibles pour les sacs de veille', error)
        });
    }

    /** Charge le référentiel des chantiers (uid par identifiant). */
    private loadBuildingUids(): void {
        this.api.getBuildings().pipe(take(1), takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (buildings: Building[]): void => {
                this.building_uids.set(new Map<number, string>(buildings.map((building: Building): [number, string] => [building.id, building.uid])));
                this.building_defences.set(new Map<string, number>(buildings.map((building: Building): [string, number] => [building.uid, building.defence ?? 0])));
            },
            error: (error: unknown): void => console.warn('Référentiel des chantiers indisponible pour la veille', error)
        });
    }

    /**
     * Choisit la proposition de Chantiers du jour sur laquelle s'appuie la veille.
     * @param {number | null} building_plan_id Proposition ; nulle = l'effective.
     */
    public setBuildingPlan(building_plan_id: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.buildingPlanId = building_plan_id;
        });
    }

    /**
     * Lit l'attaque estimée d'un jour ; l'attaque précédente est oubliée en attendant.
     * @param {number} day Jour affiché.
     */
    private loadAttack(day: number): void {
        this._estimated_attack.set(null);
        this.attack_service.attackOfDay(day).pipe(takeUntilDestroyed(this.destroy_ref)).subscribe((attack: number | null): void => {
            if (this._selected_day() === day) {
                this._estimated_attack.set(attack);
            }
        });
    }

    /**
     * Sélectionne une proposition du jour après avoir quitté la précédente.
     * @param {number | null} plan_id Identifiant de la proposition.
     */
    public selectPlan(plan_id: number | null): void {
        void this.leavePlan(true);
        this.selected_plan_id.set(plan_id);
        this._conflict.set(null);
        this.resetDraft();
    }

    /**
     * Avant de quitter la page : enregistre ce qui attend, puis libère la main. Sur un échec, la main est gardée.
     * @returns {Promise<boolean>} Faux si l'enregistrement a échoué (la sortie demande alors confirmation).
     */
    public leave(): Promise<boolean> {
        return this.leavePlan(false);
    }

    /** Prend la main sur la proposition affichée, même si une autre connexion la tient (elle en est prévenue). */
    public takeLock(): void {
        const plan_id: number | null = this.selected_plan_id();
        if (!this.can_write() || plan_id === null) {
            return;
        }
        void this.realtime.takePlanLock(plan_id).then(
            (lock: PlanLockDTO): void => {
                this.applyLock(lock);
            },
            (error: unknown): void => console.warn('TakePlanLock', error)
        );
    }

    /**
     * Crée une proposition vide au jour sélectionné et la sélectionne.
     * @param {string} name Nom de la proposition.
     */
    public createPlan(name: string): void {
        this.addPlan(name, emptyNightwatchContent());
    }

    /**
     * Crée une proposition au jour sélectionné à partir de la copie de travail courante.
     * @param {string} name Nom de la proposition (par défaut, celui de la proposition affichée suivi de « (copie) »).
     */
    public duplicatePlan(name: string = `${this.selected_plan()?.name ?? ''} (copie)`.trim()): void {
        const current: NightwatchPlanContentDTO | null = this._draft() ?? this.selected_plan()?.content ?? null;
        this.addPlan(name, current === null ? emptyNightwatchContent() : cloneContent(current));
    }

    /** Supprime la proposition sélectionnée, après avoir pris la main. */
    public deletePlan(): void {
        const plan: NightwatchPlanDTO | null = this.selected_plan();
        if (!this.can_edit() || plan === null) {
            return;
        }
        void this.removePlan(plan.id);
    }

    /** Rend la proposition sélectionnée effective pour son jour, même sous la main d'un autre. */
    public setEffective(): void {
        const plan: NightwatchPlanDTO | null = this.selected_plan();
        if (!this.can_write() || plan === null) {
            return;
        }
        this.plan_service.setEffective(plan.id, this.realtime.connectionId(), this.map_id).subscribe({
            next: (updated: NightwatchPlanDTO): void => this.markEffective(updated)
        });
    }

    /**
     * Renomme la proposition sélectionnée sous la main ; le contenu enregistré est réécrit, la copie de travail reste à enregistrer.
     * @param {string} name Nouveau nom (rogné ; vide ou inchangé = ignoré).
     */
    public renamePlan(name: string): void {
        const plan: NightwatchPlanDTO | null = this.selected_plan();
        const trimmed: string = name.trim();
        if (!this.can_edit() || plan === null || trimmed === '' || trimmed === plan.name) {
            return;
        }
        void this.rename(plan.id, trimmed);
    }

    /**
     * Ajoute un veilleur au brouillon (sans effet s'il y est déjà).
     * @param {number} user_id Citoyen.
     */
    public addWatcher(user_id: number): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            if (!content.watchers.some((watcher: NightwatchWatcherDTO): boolean => watcher.userId === user_id)) {
                content.watchers.push({ userId: user_id, statuses: [], items: {}, pastWatches: null, hasDiscourse: false, note: null });
            }
        });
    }

    /**
     * Retire un veilleur du brouillon.
     * @param {number} user_id Citoyen.
     */
    public removeWatcher(user_id: number): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.watchers = content.watchers.filter((watcher: NightwatchWatcherDTO): boolean => watcher.userId !== user_id);
        });
    }

    /**
     * Remplace veilleurs et consignes par ceux d'un jour ; attaque et stock saisis restent ceux de la proposition affichée.
     * @param {number} from_day Jour source : sa proposition effective, sinon la première (la copie de travail pour le jour affiché).
     */
    public copyPlanFromDay(from_day: number): void {
        const copied: NightwatchPlanContentDTO | null = this.copySource(from_day);
        if (copied !== null) {
            this.updateDraft((content: NightwatchPlanContentDTO): void => {
                content.watchers = copied.watchers;
                content.instructions = copied.instructions;
            });
        }
    }

    /**
     * Crée sur un autre jour une proposition reprenant veilleurs et consignes d'un jour ; jamais vers un jour passé.
     * @param {number} from_day Jour source.
     * @param {number} to_day Jour cible.
     * @param {string} name Nom de la nouvelle proposition.
     */
    public copyPlanBetweenDays(from_day: number, to_day: number, name: string): void {
        if (to_day < this.current_day) {
            return;
        }
        const copied: NightwatchPlanContentDTO | null = this.copySource(from_day);
        if (copied !== null) {
            this.addPlan(name, copied, to_day);
        }
    }

    /**
     * Veilleurs et consignes d'un jour, prêts à copier : veilles passées recalculées (le nombre de nuits change), attaque et stock vides.
     * @param {number} from_day Jour source.
     * @returns {NightwatchPlanContentDTO | null} Contenu copié, nul si le jour n'a pas de proposition.
     */
    private copySource(from_day: number): NightwatchPlanContentDTO | null {
        const source: NightwatchPlanContentDTO | null | undefined = from_day === this._selected_day() ? this._draft() : this.planOfDay(from_day)?.content;
        if (source === null || source === undefined) {
            return null;
        }
        const copied: NightwatchPlanContentDTO = cloneContent(source);
        return {
            ...emptyNightwatchContent(),
            instructions: copied.instructions ?? null,
            watchers: copied.watchers.map((watcher: NightwatchWatcherDTO): NightwatchWatcherDTO => ({ ...watcher, pastWatches: null }))
        };
    }

    /**
     * Mémorise le stuff d'un veilleur pour le coller sur un autre (y compris d'une autre proposition ou d'un autre jour).
     * @param {number} user_id Citoyen copié.
     */
    public copyItems(user_id: number): void {
        const watcher: NightwatchWatcherDTO | undefined = this.draft()?.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === user_id);
        if (watcher !== undefined) {
            this._copied_items.set({ ...watcher.items });
        }
    }

    /**
     * Remplace le stuff d'un veilleur par le stuff copié ; rien si aucun n'a été copié.
     * @param {number} user_id Citoyen visé.
     */
    public pasteItems(user_id: number): void {
        const copied: Record<number, number> | null = this._copied_items();
        if (copied !== null) {
            this.updateWatcher(user_id, (watcher: NightwatchWatcherDTO): void => {
                watcher.items = { ...copied };
            });
        }
    }

    /**
     * Attribue une quantité d'un objet à un veilleur ; une quantité nulle retire l'objet.
     * @param {number} user_id Citoyen.
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité attribuée.
     */
    public setItem(user_id: number, item_id: number, quantity: number): void {
        const simulation_id: number | null | undefined = this.selected_plan()?.simulationId;
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            const watcher: NightwatchWatcherDTO | undefined = content.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === user_id);
            if (watcher === undefined) {
                return;
            }
            if (quantity > 0) {
                watcher.items[item_id] = quantity;
            } else {
                delete watcher.items[item_id];
            }
            if (simulation_id === null || simulation_id === undefined) {
                return;
            }
            // Simulation : les attributions sont un sous-ensemble du stuff global, qui grandit si besoin.
            const assigned: number = content.watchers.reduce((sum: number, candidate: NightwatchWatcherDTO): number => sum + (candidate.items[item_id] ?? 0), 0);
            const globals: Record<number, number> = content.globalItems ?? {};
            if (assigned > (globals[item_id] ?? 0)) {
                content.globalItems = { ...globals, [item_id]: assigned };
            }
        });
    }

    /**
     * Active ou désactive un statut prévu d'un veilleur.
     * @param {number} user_id Citoyen.
     * @param {string} status Clé du statut.
     */
    public toggleStatus(user_id: number, status: string): void {
        if (status === GHOUL_KEY) {
            this.toggleGhoul(user_id);
            return;
        }
        this.updateWatcher(user_id, (watcher: NightwatchWatcherDTO): void => {
            if (watcher.statuses.includes(status)) {
                watcher.statuses = watcher.statuses.filter((candidate: string): boolean => candidate !== status);
                return;
            }
            // Chien avec et sans steak s'excluent.
            const excluded: string = status === 'dog' ? 'dogSteak' : status === 'dogSteak' ? 'dog' : '';
            watcher.statuses = [...watcher.statuses.filter((candidate: string): boolean => candidate !== excluded), status];
        });
    }

    /**
     * Goule d'un veilleur : prévue dans le plan, sinon renseignée dans la page citoyens.
     * @param {number} user_id Citoyen.
     * @returns {boolean} Vrai si goule.
     */
    public isGhoul(user_id: number): boolean {
        const watcher: NightwatchWatcherDTO | undefined = this._draft()?.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === user_id);
        return plannedGhoul(watcher?.statuses ?? [], this.citizenState(user_id)?.isGhoul === true);
    }

    /**
     * Inverse la goule d'un veilleur ; la saisie du plan n'est gardée que si elle diffère de la page citoyens.
     * @param {number} user_id Citoyen.
     */
    private toggleGhoul(user_id: number): void {
        const real: boolean = this.citizenState(user_id)?.isGhoul === true;
        const wanted: boolean = !this.isGhoul(user_id);
        this.updateWatcher(user_id, (watcher: NightwatchWatcherDTO): void => {
            const others: string[] = watcher.statuses.filter((candidate: string): boolean => candidate !== GHOUL_KEY && candidate !== NOT_GHOUL_KEY);
            watcher.statuses = wanted === real ? others : [...others, wanted ? GHOUL_KEY : NOT_GHOUL_KEY];
        });
    }

    /**
     * Fixe le nombre de veilles passées d'un veilleur ; `null` revient à la valeur déduite des plans effectifs précédents.
     * @param {number} user_id Citoyen.
     * @param {number | null} past_watches Nombre de veilles, ou `null`.
     */
    public setPastWatches(user_id: number, past_watches: number | null): void {
        this.updateWatcher(user_id, (watcher: NightwatchWatcherDTO): void => {
            watcher.pastWatches = past_watches;
        });
    }

    /**
     * Attribue le Discours rassurant à un veilleur ; un seul veilleur le porte, l'activer le retire aux autres.
     * @param {number} user_id Citoyen.
     * @param {boolean} active Vrai pour l'attribuer, faux pour le retirer.
     */
    public setDiscourse(user_id: number, active: boolean): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            for (const watcher of content.watchers) {
                watcher.hasDiscourse = active && watcher.userId === user_id;
            }
        });
    }

    /**
     * Consignes libres du plan.
     * @param {string | null} instructions Texte, ou `null`.
     */
    public setInstructions(instructions: string | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.instructions = instructions;
        });
    }

    /**
     * Attaque estimée imposée à la place de l'estimation.
     * @param {number | null} attack Attaque, ou `null`.
     */
    public setAttackOverride(attack: number | null): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            content.attackOverride = clampInput(attack, MAX_INPUT);
        });
    }

    /**
     * Stock saisi à la main pour un objet ; une quantité nulle le retire.
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité.
     */
    public setManualStock(item_id: number, quantity: number): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            if (quantity > 0) {
                content.manualStock[item_id] = quantity;
            } else {
                delete content.manualStock[item_id];
            }
        });
    }

    /**
     * Modifie la copie de travail (copie profonde puis mutation), prend la main si elle est libre et relance l'enregistrement
     * automatique ; ignoré sans droit d'écriture. Main refusée : modification annulée ; échec technique : modification gardée.
     * @param {(content: NightwatchPlanContentDTO) => void} mutate Modification à appliquer à la copie.
     */
    public updateDraft(mutate: (content: NightwatchPlanContentDTO) => void): void {
        const plan_id: number | null = this.selected_plan_id();
        const draft: NightwatchPlanContentDTO | null = this._draft();
        if (!this.can_edit() || plan_id === null || draft === null) {
            return;
        }
        const copy: NightwatchPlanContentDTO = cloneContent(draft);
        mutate(copy);
        this._draft.set(copy);
        this._dirty.set(true);
        this.revision++;
        this._save_state.set('pending');
        this.scheduleAutosave();
        if (this.lockOf(plan_id).kind === 'free') {
            const epoch: number = this.draft_epoch;
            void this.acquireLock(plan_id, (state: OtherLock): void => this.refuseEdit(state)).catch((error: unknown): void => {
                console.warn('AcquirePlanLock', error);
                if (epoch === this.draft_epoch) {
                    this._save_state.set('error');
                }
            });
        }
    }

    /**
     * Enregistre la copie de travail avec la version lue, sous la main (prise si besoin) ; 409 : rechargement et conflit signalé,
     * copie gardée ; 423 : main perdue, copie remplacée par la proposition rechargée et conflit signalé.
     */
    public save(): void {
        void this.persist();
    }

    /** Ferme la bannière de conflit ; la copie de travail conservée s'enregistre alors sur la version rechargée. */
    public dismissConflict(): void {
        this._conflict.set(null);
        if (this._dirty()) {
            this.scheduleAutosave();
        }
    }

    /**
     * Modifie un veilleur du brouillon.
     * @param {number} user_id Citoyen.
     * @param {(watcher: NightwatchWatcherDTO) => void} mutate Modification.
     */
    private updateWatcher(user_id: number, mutate: (watcher: NightwatchWatcherDTO) => void): void {
        this.updateDraft((content: NightwatchPlanContentDTO): void => {
            const watcher: NightwatchWatcherDTO | undefined = content.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === user_id);
            if (watcher !== undefined) {
                mutate(watcher);
            }
        });
    }

    /**
     * Citoyen de l'état réel.
     * @param {number} user_id Citoyen.
     * @returns {NightwatchCitizenStateDTO | undefined} Citoyen, s'il est connu.
     */
    public citizenState(user_id: number): NightwatchCitizenStateDTO | undefined {
        return this._state()?.citizens.find((citizen: NightwatchCitizenStateDTO): boolean => citizen.userId === user_id);
    }

    /**
     * Proposition de référence d'un jour : l'effective, sinon la première.
     * @param {number} day Jour.
     * @returns {NightwatchPlanDTO | undefined} Proposition, absente si le jour n'en a aucune.
     */
    private planOfDay(day: number): NightwatchPlanDTO | undefined {
        const of_day: NightwatchPlanDTO[] = this.plans().filter((plan: NightwatchPlanDTO): boolean => plan.day === day);
        return of_day.find((plan: NightwatchPlanDTO): boolean => plan.isEffective) ?? of_day[0];
    }

    /**
     * Sélectionne la proposition effective du jour (ou la première) et en fait la copie de travail.
     * @param {number} day Jour affiché.
     */
    private selectPlanForDay(day: number): void {
        const simulation_id: number | null = this._selected_simulation_id();
        const of_simulation: NightwatchPlanDTO | undefined = simulation_id === null ? undefined : this.simulationPlanOfDay(simulation_id, day);
        this.selected_plan_id.set((of_simulation ?? this.planOfDay(day))?.id ?? null);
        this._conflict.set(null);
        this.resetDraft();
    }

    /** Remplace la copie de travail par la proposition sélectionnée ; enregistrement automatique en attente abandonné. */
    private resetDraft(): void {
        this.cancelAutosave();
        this.draft_epoch++;
        const plan: NightwatchPlanDTO | null = this.selected_plan();
        this._draft.set(plan === null ? null : cloneContent(plan.content));
        this._dirty.set(false);
        this._save_state.set('idle');
    }

    /** Recale la copie de travail sur la proposition sélectionnée, ou sur celle du jour si elle a disparu. */
    private resyncDraft(): void {
        if (this.selected_plan() === null) {
            this.selectPlanForDay(this._selected_day());
        } else {
            this.resetDraft();
        }
    }

    /**
     * Quitte la proposition affichée : enregistre ce qui attend, puis libère la main. Sur un échec, la main n'est gardée que si
     * la proposition reste affichée.
     * @param {boolean} switching La proposition est quittée quoi qu'il arrive (autre sélection, destruction de la page).
     * @returns {Promise<boolean>} Faux si l'enregistrement a échoué ou n'a pas pu partir.
     */
    private async leavePlan(switching: boolean): Promise<boolean> {
        const plan_id: number | null = this.selected_plan_id();
        const saved: boolean = await this.persist();
        if (plan_id !== null && (saved || switching)) {
            void this.releaseLock(plan_id);
        }
        return saved;
    }

    /**
     * Crée une proposition puis l'affiche ; le serveur donne la main sur la nouvelle à cette connexion.
     * @param {string} name Nom.
     * @param {NightwatchPlanContentDTO} content Contenu.
     * @param {number} day Jour de la proposition, par défaut le jour affiché.
     */
    private addPlan(name: string, content: NightwatchPlanContentDTO, day: number = this._selected_day()): void {
        if (!this.can_write() || this.creating) {
            return;
        }
        this.creating = true;
        const request: NightwatchPlanRequestDTO = { day, name: name.slice(0, 64), content };
        this.plan_service.savePlan(request, this.realtime.connectionId(), this.map_id).subscribe({
            next: (saved: NightwatchPlanDTO): void => {
                this.creating = false;
                this.replacePlan(saved);
                if (saved.day !== this._selected_day()) {
                    this.selectDay(saved.day);
                }
                this.selectPlan(saved.id);
            },
            error: (): void => {
                this.creating = false;
            }
        });
    }

    /**
     * Remplace (ou ajoute) une proposition enregistrée dans la liste locale.
     * @param {NightwatchPlanDTO} saved Proposition renvoyée par l'API.
     */
    private replacePlan(saved: NightwatchPlanDTO): void {
        this.plans_dto.update((dto: NightwatchPlansDTO | null): NightwatchPlansDTO | null => (dto === null ? null : {
            ...dto,
            plans: dto.plans.some((plan: NightwatchPlanDTO): boolean => plan.id === saved.id)
                ? dto.plans.map((plan: NightwatchPlanDTO): NightwatchPlanDTO => (plan.id === saved.id ? saved : plan))
                : [...dto.plans, saved]
        }));
    }

    /**
     * Après un refus d'écriture : recharge les propositions et, si la proposition est toujours affichée, signale le conflit ; la
     * copie abandonnée est remplacée par la proposition rechargée, une fois celle-ci arrivée.
     * @param {number} plan_id Proposition refusée.
     * @param {boolean} abandon_draft Copie de travail abandonnée (main perdue) plutôt que gardée (409).
     * @returns {Promise<void>} Résolue une fois le rechargement terminé (aucune écriture ne part avant, sur une version périmée).
     */
    private reloadAfterConflict(plan_id: number, abandon_draft: boolean): Promise<void> {
        return new Promise<void>((resolve: () => void): void => {
            const abandon: () => void = (): void => {
                if (this.selected_plan_id() !== plan_id) {
                    return;
                }
                this.resyncDraft();
                if (this.selected_plan_id() === plan_id) {
                    this._conflict.set({ plan_id, author: this.holderName(plan_id), kept: false });
                } else {
                    this.snackbar.warningSnackbar($localize`Cette proposition a été supprimée`);
                }
            };
            this.plan_service.getPlans(this.map_id).subscribe({
                next: (dto: NightwatchPlansDTO): void => {
                    this.plans_dto.set(dto);
                    if (abandon_draft) {
                        abandon();
                    } else if (this.selected_plan_id() === plan_id) {
                        const reloaded: NightwatchPlanDTO | undefined = dto.plans.find((plan: NightwatchPlanDTO): boolean => plan.id === plan_id);
                        this._conflict.set({ plan_id, author: reloaded?.lastUpdateInfo?.userName ?? reloaded?.authorName ?? null, kept: true });
                    }
                    resolve();
                },
                error: (): void => {
                    if (abandon_draft) {
                        abandon();
                    }
                    resolve();
                }
            });
        });
    }

    /**
     * Main perdue avec une écriture en attente (423, reprise par un autre) : traité comme un conflit, mais la copie, qui ne peut
     * plus s'enregistrer, est abandonnée ; la bannière rend la perte visible et nomme le détenteur connu.
     * @param {number} plan_id Proposition.
     * @returns {Promise<void>} Résolue une fois la proposition rechargée.
     */
    private loseDraft(plan_id: number): Promise<void> {
        this.cancelAutosave();
        if (this.lockOf(plan_id).kind !== 'other') {
            void this.refreshLocks().then((): void => {
                const conflict: PlanConflict | null = this._conflict();
                if (conflict !== null && conflict.plan_id === plan_id && !conflict.kept) {
                    this._conflict.set({ ...conflict, author: this.holderName(plan_id) ?? conflict.author });
                }
            });
        }
        return this.reloadAfterConflict(plan_id, true);
    }

    /**
     * Enregistre la copie de travail en attente : attend l'écriture en cours, prend la main si besoin, puis envoie.
     * @returns {Promise<boolean>} Vrai si plus rien n'attend ; faux si l'enregistrement a échoué ou n'a pas pu partir.
     */
    private async persist(): Promise<boolean> {
        this.cancelAutosave();
        const epoch: number = this.draft_epoch;
        if (this.in_flight !== null) {
            return (await this.settleWrites()) && epoch === this.draft_epoch ? this.persist() : false;
        }
        const plan_id: number | null = this.selected_plan_id();
        if (plan_id === null || !this._dirty()) {
            return true;
        }
        if (!this.can_write()) {
            return false;
        }
        const lock: PlanLockState = this.lockOf(plan_id);
        if (lock.kind === 'other') {
            await this.loseDraft(plan_id);
            return false;
        }
        const conflict: PlanConflict | null = this._conflict();
        if (conflict !== null && conflict.kept && conflict.plan_id === plan_id) {
            // Bannière de 409 pas encore lue : enregistrer écraserait la version de l'autre à son insu.
            this._save_state.set('error');
            return false;
        }
        if (this.realtime.connectionId() === null) {
            // Hub coupé : sans en-tête de connexion, le serveur répondrait 423 ; la reconnexion relancera l'enregistrement.
            this._save_state.set('error');
            return false;
        }
        if (lock.kind === 'free') {
            try {
                await this.acquireLock(plan_id, (): void => {
                    void this.loseDraft(plan_id);
                });
            } catch (error: unknown) {
                console.warn('AcquirePlanLock', error);
                if (epoch === this.draft_epoch) {
                    this._save_state.set('error');
                }
                return false;
            }
            return epoch === this.draft_epoch && this.lockOf(plan_id).kind === 'mine' ? this.persist() : false;
        }
        return this.sendDraft();
    }

    /**
     * Envoie la copie de travail de la proposition sélectionnée, avec la version lue.
     * @returns {Promise<boolean>} Vrai si l'enregistrement est accepté.
     */
    private sendDraft(): Promise<boolean> {
        const plan: NightwatchPlanDTO | null = this.selected_plan();
        const draft: NightwatchPlanContentDTO | null = this._draft();
        if (plan === null || draft === null) {
            return Promise.resolve(true);
        }
        const sent: number = this.revision;
        const epoch: number = this.draft_epoch;
        const mark: (state: PlanSaveState) => void = (state: PlanSaveState): void => {
            if (epoch === this.draft_epoch) {
                this._save_state.set(state);
            }
        };
        mark('saving');
        return this.write(plan.id, { id: plan.id, version: plan.version, day: plan.day, name: plan.name, content: draft }, (): void => {
            if (epoch === this.draft_epoch) {
                this._dirty.set(this.revision !== sent);
                mark(this._dirty() ? 'pending' : 'saved');
            }
        }, (): void => mark('error'));
    }

    /**
     * Écrit une proposition existante, une écriture à la fois. 409 : rechargement et conflit, copie gardée ; 423 : main perdue.
     * Les refus sont ignorés si la copie de travail a été remplacée entre-temps.
     * @param {number} plan_id Proposition.
     * @param {NightwatchPlanRequestDTO} request Requête.
     * @param {() => void} on_saved Suite d'une écriture acceptée, après mise à jour de la proposition.
     * @param {() => void} on_failed Suite d'un échec autre que 423.
     * @returns {Promise<boolean>} Vrai si l'écriture est acceptée ; jamais rejetée.
     */
    private write(plan_id: number, request: NightwatchPlanRequestDTO, on_saved: () => void, on_failed: () => void): Promise<boolean> {
        let finish: (ok: boolean) => void = (): void => undefined;
        const done: Promise<boolean> = new Promise<boolean>((resolve: (ok: boolean) => void): void => {
            finish = resolve;
        });
        const end: (ok: boolean) => void = (ok: boolean): void => {
            if (this.in_flight === done) {
                this.in_flight = null;
            }
            finish(ok);
        };
        const epoch: number = this.draft_epoch;
        this.in_flight = done;
        this.plan_service.savePlan(request, this.realtime.connectionId(), this.map_id).subscribe({
            next: (saved: NightwatchPlanDTO): void => {
                this.replacePlan(saved);
                on_saved();
                end(true);
            },
            error: (error: unknown): void => {
                const status: number = error instanceof HttpErrorResponse ? error.status : 0;
                if (status === 423 && epoch === this.draft_epoch) {
                    void this.loseDraft(plan_id).then((): void => end(false));
                    return;
                }
                on_failed();
                if (status === 409 && epoch === this.draft_epoch) {
                    void this.reloadAfterConflict(plan_id, false).then((): void => end(false));
                    return;
                }
                end(false);
            }
        });
        return done;
    }

    /**
     * Attend la fin des écritures en cours.
     * @returns {Promise<boolean>} Faux si l'une a échoué.
     */
    private async settleWrites(): Promise<boolean> {
        let ok: boolean = true;
        while (this.in_flight !== null) {
            ok = (await this.in_flight) && ok;
        }
        return ok;
    }

    /**
     * Renomme sous la main, après les écritures en cours, avec le contenu et la version enregistrés.
     * @param {number} plan_id Proposition.
     * @param {string} name Nouveau nom.
     */
    private async rename(plan_id: number, name: string): Promise<void> {
        if (!(await this.holdLock(plan_id))) {
            return;
        }
        while (this.in_flight !== null) {
            await this.settleWrites();
        }
        const plan: NightwatchPlanDTO | undefined = this.plans().find((candidate: NightwatchPlanDTO): boolean => candidate.id === plan_id);
        if (plan === undefined || plan.name === name || this.lockOf(plan_id).kind !== 'mine') {
            return;
        }
        await this.write(plan_id, { id: plan.id, version: plan.version, day: plan.day, name, content: plan.content }, (): void => undefined, (): void => undefined);
    }

    /**
     * Supprime sous la main, après l'écriture en cours.
     * @param {number} plan_id Proposition.
     */
    private async removePlan(plan_id: number): Promise<void> {
        if (!(await this.holdLock(plan_id))) {
            return;
        }
        this.cancelAutosave();
        while (this.in_flight !== null) {
            await this.settleWrites();
        }
        if (this.lockOf(plan_id).kind !== 'mine') {
            return;
        }
        this.plan_service.deletePlan(plan_id, this.realtime.connectionId(), this.map_id).subscribe({
            next: (): void => this.dropPlan(plan_id),
            error: (): void => undefined
        });
    }

    /**
     * Proposition supprimée par un autre ; si une modification y attendait, sa perte est signalée.
     * @param {number} plan_id Proposition.
     */
    private onPlanDeleted(plan_id: number): void {
        if (plan_id === this.selected_plan_id() && this._dirty()) {
            this.snackbar.warningSnackbar($localize`Cette proposition a été supprimée`);
        }
        this.dropPlan(plan_id);
    }

    /**
     * Retire une proposition supprimée ; si c'était la sélection, bascule sur une autre proposition du jour.
     * @param {number} plan_id Proposition.
     */
    private dropPlan(plan_id: number): void {
        this.plans_dto.update((dto: NightwatchPlansDTO | null): NightwatchPlansDTO | null => (dto === null
            ? null
            : { ...dto, plans: dto.plans.filter((candidate: NightwatchPlanDTO): boolean => candidate.id !== plan_id) }));
        this.setLock(plan_id, null);
        if (this.selected_plan_id() === plan_id) {
            this.selectPlanForDay(this._selected_day());
        }
    }

    /**
     * Rend une proposition effective pour son jour, les autres du même jour cessent de l'être. Sous notre main, ou pour la
     * sélection quand une modification attend, seule l'étoile change : adopter la version reçue ferait écraser sans 409.
     * @param {NightwatchPlanDTO} updated Proposition devenue effective.
     */
    private markEffective(updated: NightwatchPlanDTO): void {
        const keep: boolean = this.lockOf(updated.id).kind === 'mine' || (updated.id === this.selected_plan_id() && this._dirty());
        this.plans_dto.update((dto: NightwatchPlansDTO | null): NightwatchPlansDTO | null => (dto === null ? null : {
            ...dto,
            plans: dto.plans.map((candidate: NightwatchPlanDTO): NightwatchPlanDTO => {
                if (candidate.day !== updated.day) {
                    return candidate;
                }
                if (candidate.id !== updated.id) {
                    return { ...candidate, isEffective: false };
                }
                return keep ? { ...candidate, isEffective: true } : updated;
            })
        }));
    }

    /** Relance le minuteur d'enregistrement automatique, sans dépasser l'échéance fixée à la première modification. */
    private scheduleAutosave(): void {
        const now: number = Date.now();
        this.autosave_deadline ??= now + NIGHTWATCH_AUTOSAVE_MAX_WAIT_MS;
        const delay: number = Math.min(NIGHTWATCH_AUTOSAVE_DELAY_MS, Math.max(0, this.autosave_deadline - now));
        this.clearAutosaveTimer();
        this.autosave_timer = setTimeout((): void => {
            this.autosave_timer = null;
            this.autosave_deadline = null;
            this.save();
        }, delay);
    }

    /** Annule l'enregistrement automatique en attente. */
    private cancelAutosave(): void {
        this.clearAutosaveTimer();
        this.autosave_deadline = null;
    }

    /** Arrête le minuteur d'enregistrement automatique en gardant l'échéance. */
    private clearAutosaveTimer(): void {
        if (this.autosave_timer !== null) {
            clearTimeout(this.autosave_timer);
            this.autosave_timer = null;
        }
    }

    /**
     * Main connue sur une proposition ; la nôtre, obtenue sous une autre connexion (reconnexion), compte comme libre.
     * @param {number | null} plan_id Proposition.
     * @returns {PlanLockState} Main ; libre si inconnue.
     */
    private lockOf(plan_id: number | null): PlanLockState {
        const known: KnownLock | undefined = plan_id === null ? undefined : this.locks().get(plan_id);
        if (known === undefined) {
            return FREE_LOCK;
        }
        if (known.kind === 'other') {
            return known;
        }
        return known.connection_id === this.realtime.connectionId() ? MINE_LOCK : FREE_LOCK;
    }

    /**
     * Pseudo de la personne qui a la main sur une proposition.
     * @param {number} plan_id Proposition.
     * @returns {string | null} Pseudo, nul si la main n'est pas à une autre connexion.
     */
    private holderName(plan_id: number): string | null {
        const lock: PlanLockState = this.lockOf(plan_id);
        return lock.kind === 'other' ? this.citizenName(lock.userId) : null;
    }

    /**
     * Main vue de cette connexion.
     * @param {PlanLockDTO} lock Verrou reçu du hub.
     * @returns {KnownLock | null} Main ; nulle si la proposition est libre.
     */
    private knownLockOf(lock: PlanLockDTO): KnownLock | null {
        if (lock.holderUserId === null || lock.holderConnectionId === null) {
            return null;
        }
        if (lock.holderConnectionId === this.realtime.connectionId()) {
            return { kind: 'mine', connection_id: lock.holderConnectionId };
        }
        return { kind: 'other', userId: lock.holderUserId, sameUser: lock.holderUserId === getUserId() };
    }

    /**
     * Enregistre un verrou reçu du hub.
     * @param {PlanLockDTO} lock Verrou.
     * @returns {PlanLockState} Main résultante.
     */
    private applyLock(lock: PlanLockDTO): PlanLockState {
        this.setLock(lock.planId, this.knownLockOf(lock));
        return this.lockOf(lock.planId);
    }

    /**
     * Remplace la main connue d'une proposition.
     * @param {number} plan_id Proposition.
     * @param {KnownLock | null} known Main ; nulle si libre.
     */
    private setLock(plan_id: number, known: KnownLock | null): void {
        this.locks.update((locks: ReadonlyMap<number, KnownLock>): ReadonlyMap<number, KnownLock> => {
            const next: Map<number, KnownLock> = new Map<number, KnownLock>(locks);
            if (known === null) {
                next.delete(plan_id);
            } else {
                next.set(plan_id, known);
            }
            return next;
        });
    }

    /**
     * Prend la main sur une proposition ; une demande en cours pour la même proposition est partagée, et seul son initiateur
     * traite un refus. Refusée par notre connexion d'avant une coupure (pas encore expirée côté serveur) : reprise d'office.
     * @param {number} plan_id Proposition.
     * @param {(state: OtherLock) => void} on_refused Traitement du refus, appliqué si la copie de travail n'a pas changé entre-temps.
     * @returns {Promise<PlanLockState>} Main résultante ; rejetée en cas d'échec technique (hub coupé, accès refusé).
     */
    private acquireLock(plan_id: number, on_refused: (state: OtherLock) => void): Promise<PlanLockState> {
        const pending: Promise<PlanLockState> | undefined = this.lock_requests.get(plan_id);
        if (pending !== undefined) {
            return pending;
        }
        const epoch: number = this.draft_epoch;
        const request: Promise<PlanLockState> = this.realtime.acquirePlanLock(plan_id)
            .then((lock: PlanLockDTO): PlanLockDTO | Promise<PlanLockDTO> => (this.heldByStaleConnection(lock) ? this.realtime.takePlanLock(plan_id) : lock))
            .then((lock: PlanLockDTO): PlanLockState => {
                const state: PlanLockState = this.applyLock(lock);
                if (state.kind === 'other' && epoch === this.draft_epoch) {
                    on_refused(state);
                }
                return state;
            })
            .finally((): void => {
                this.lock_requests.delete(plan_id);
            });
        this.lock_requests.set(plan_id, request);
        return request;
    }

    /**
     * Verrou tenu par la connexion qui nous avait donné la main, remplacée depuis par une reconnexion.
     * @param {PlanLockDTO} lock Verrou renvoyé par le hub.
     * @returns {boolean} Vrai si la main est encore la nôtre, sous l'ancienne connexion.
     */
    private heldByStaleConnection(lock: PlanLockDTO): boolean {
        const known: KnownLock | undefined = this.locks().get(lock.planId);
        return known?.kind === 'mine' && lock.holderConnectionId === known.connection_id && known.connection_id !== this.realtime.connectionId();
    }

    /**
     * Main pour une écriture demandée par l'utilisateur (renommage, suppression).
     * @param {number} plan_id Proposition.
     * @returns {Promise<boolean>} Vrai si la main est tenue ; faux sur refus (copie annulée, message) ou échec technique.
     */
    private async holdLock(plan_id: number): Promise<boolean> {
        if (this.lockOf(plan_id).kind === 'mine') {
            return true;
        }
        try {
            return (await this.acquireLock(plan_id, (state: OtherLock): void => this.refuseEdit(state))).kind === 'mine';
        } catch (error: unknown) {
            console.warn('AcquirePlanLock', error);
            return false;
        }
    }

    /**
     * Main refusée à une action de l'utilisateur : la modification est annulée, la proposition rechargée et l'auteur prévenu.
     * @param {OtherLock} state Détenteur.
     */
    private refuseEdit(state: OtherLock): void {
        this.resetDraft();
        this.reloadPlans();
        this.snackbar.warningSnackbar($localize`${this.citizenName(state.userId)}:pseudo: modifie déjà cette proposition`);
    }

    /**
     * Libère la main sur une proposition quittée, après les écritures en cours. Hub coupé : le serveur l'a déjà libérée.
     * @param {number} plan_id Proposition.
     */
    private async releaseLock(plan_id: number): Promise<void> {
        while (this.in_flight !== null) {
            await this.settleWrites();
        }
        if (this.lockOf(plan_id).kind !== 'mine' || this.realtime.connectionId() === null) {
            return;
        }
        try {
            await this.realtime.releasePlanLock(plan_id);
        } catch (error: unknown) {
            console.warn('ReleasePlanLock', error);
        }
    }

    /**
     * Relit les mains de la ville (ouverture, reconnexion, main perdue) ; ignoré sans droit d'écriture, le hub refusant la lecture.
     * @returns {Promise<void>} Résolue une fois les mains relues (ou la lecture refusée).
     */
    private async refreshLocks(): Promise<void> {
        if (this.plans_dto()?.access.canEdit !== true || this.town_context.isReadonly()) {
            return;
        }
        try {
            const locks: PlanLockDTO[] = await this.realtime.getPlanLocks();
            const known: Map<number, KnownLock> = new Map<number, KnownLock>();
            for (const lock of locks) {
                const state: KnownLock | null = this.knownLockOf(lock);
                if (state !== null) {
                    known.set(lock.planId, state);
                }
            }
            this.locks.set(known);
        } catch (error: unknown) {
            console.warn('GetPlanLocks', error);
        }
    }

    /**
     * Relit propositions et simulations (refus de main, coupure, simulation modifiée) ; la copie de travail suit si rien n'attend.
     * Une simulation disparue est désélectionnée.
     * @param {number | null} open_simulation_id Simulation à ouvrir une fois relue.
     */
    private reloadPlans(open_simulation_id: number | null = null): void {
        this.plan_service.getPlans(this.map_id).subscribe({
            next: (dto: NightwatchPlansDTO): void => {
                this.plans_dto.set(dto);
                if (this.selected_simulation() === null) {
                    this._selected_simulation_id.set(null);
                }
                if (!this._dirty()) {
                    this.resyncDraft();
                }
                if (open_simulation_id !== null) {
                    this.selectSimulation(open_simulation_id);
                }
                this.loadSimulationAttacks();
            },
            error: (error: unknown): void => console.warn('GetPlans', error)
        });
    }

    /**
     * Proposition enregistrée par une autre connexion. Sur la sélection modifiée localement, la version reçue est adoptée comme
     * base mais la copie de travail est gardée et un conflit est signalé : l'enregistrer ensuite écrasera la version de l'autre en
     * connaissance de cause. Sinon la copie de travail suit.
     * @param {NightwatchPlanDTO} plan Proposition reçue.
     */
    private onPlanSaved(plan: NightwatchPlanDTO): void {
        const selected: boolean = plan.id === this.selected_plan_id();
        this.replacePlan(plan);
        if (!selected) {
            return;
        }
        if (this._dirty()) {
            this.cancelAutosave();
            this._conflict.set({ plan_id: plan.id, author: plan.lastUpdateInfo?.userName ?? plan.authorName ?? null, kept: true });
        } else {
            this.resetDraft();
        }
    }

    /**
     * Verrou changé : la personne qui perd la main en est prévenue ; une modification pas encore partie suit le chemin du 423.
     * @param {PlanLockDTO} lock Verrou reçu.
     */
    private onLockChanged(lock: PlanLockDTO): void {
        const known: KnownLock | null = this.knownLockOf(lock);
        const selected: boolean = lock.planId === this.selected_plan_id();
        if (known?.kind !== 'other' || this.lockOf(lock.planId).kind !== 'mine') {
            this.setLock(lock.planId, known);
            return;
        }
        this.setLock(lock.planId, known);
        this.snackbar.warningSnackbar(known.sameUser
            ? $localize`Tu as pris la main dans un autre onglet`
            : $localize`${this.citizenName(known.userId)}:pseudo: a pris la main`);
        if (selected && this._dirty()) {
            void this.persist();
        }
    }

    /**
     * Reconnexion : la main de l'ancienne connexion compte déjà comme libre ; ce qui attend repart sous une main reprise, puis tout est relu.
     */
    private async onReconnected(): Promise<void> {
        if (this._dirty()) {
            await this.persist();
        }
        if (!this._dirty()) {
            this.reloadPlans();
        }
        await this.refreshLocks();
    }

    /**
     * Pseudo d'un citoyen de la ville.
     * @param {number} user_id Citoyen.
     * @returns {string} Pseudo, `?` s'il est inconnu.
     */
    private citizenName(user_id: number): string {
        return this.citizenState(user_id)?.name ?? '?';
    }

    /**
     * Applique un flux du hub tant que la page vit ; ignoré pour une ville observée, le hub suivant la ville du jeton.
     * @param {Observable<T>} source Flux.
     * @param {(value: T) => void} apply Traitement.
     */
    private follow<T>(source: Observable<T>, apply: (value: T) => void): void {
        source.pipe(filter((): boolean => !this.town_context.isReadonly()), takeUntilDestroyed(this.destroy_ref)).subscribe(apply);
    }
}
