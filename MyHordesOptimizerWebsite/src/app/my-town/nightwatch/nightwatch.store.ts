import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin, Observable } from 'rxjs';

import { PlanLockDTO } from '../../_abstract_model/realtime-services/realtime-building-plans.service';
import { RealtimeNightwatchPlansService } from '../../_abstract_model/realtime-services/realtime-nightwatch-plans.service';
import { NightwatchPlanService } from '../../_abstract_model/services/nightwatch-plan.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown, getUserId } from '../../_core/utilities/localstorage.util';
import { simulatedNightwatchCitizens } from '../../pre-town/simulated-citizens.util';
import { PlanConflict, PlanLockState, PlanSaveState } from '../buildings/planning/planning.store';
import {
    emptyNightwatchContent,
    NightwatchCitizenStateDTO,
    NightwatchPlanContentDTO,
    NightwatchPlanDTO,
    NightwatchPlanRequestDTO,
    NightwatchPlansDTO,
    NightwatchReferentialDTO,
    NightwatchStateDTO,
    NightwatchWatcherDTO
} from './nightwatch.types';
import { NightwatchAttackService } from './nightwatch-attack.service';
import { compareTotals, compareWatchers, WatcherGap } from './nightwatch-compare.util';
import {
    deathRisk,
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
import { ChestStock, computeCost, computeStock, CostSummary, StockLine, StockSources } from './nightwatch-stock.util';

/** Nombre de jours futurs proposés en plus d'aujourd'hui. */
const FUTURE_DAYS: number = 7;

/** Délai d'enregistrement automatique après la dernière modification de la copie de travail. */
export const NIGHTWATCH_AUTOSAVE_DELAY_MS: number = 400;

/** Attente maximale d'une saisie continue avant enregistrement : chaque enregistrement entretient la main (30 s d'inactivité côté API). */
export const NIGHTWATCH_AUTOSAVE_MAX_WAIT_MS: number = 10000;

/** Âge (heures) au-delà duquel le contenu d'un coffre est signalé comme périmé dans le bilan. */
export const STALE_CHEST_HOURS: number = 24;

/** Statuts du plan sans équivalent dans l'état réel (chien) : repris tels quels du plan pour le réel. */
export const PLAN_ONLY_STATUSES: readonly string[] = ['dog', 'dogSteak'];

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

    private readonly _loading: WritableSignal<boolean> = signal(false);
    private readonly _load_failed: WritableSignal<boolean> = signal(false);
    private readonly _conflict: WritableSignal<PlanConflict | null> = signal<PlanConflict | null>(null);
    private readonly plans_dto: WritableSignal<NightwatchPlansDTO | null> = signal(null);
    private readonly _referential: WritableSignal<NightwatchReferentialDTO | null> = signal(null);
    private readonly _state: WritableSignal<NightwatchStateDTO | null> = signal(null);
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

    public readonly current_day: number = getTown()?.day ?? 1;

    /** Ville de la page, relevée à l'ouverture : l'enregistrement de sortie part après que le contexte a changé. */
    private readonly map_id: number | undefined = getTown()?.town_id;
    public readonly loading: Signal<boolean> = this._loading.asReadonly();
    public readonly load_failed: Signal<boolean> = this._load_failed.asReadonly();
    public readonly conflict: Signal<PlanConflict | null> = this._conflict.asReadonly();
    public readonly selected_day: Signal<number> = this._selected_day.asReadonly();
    public readonly draft: Signal<NightwatchPlanContentDTO | null> = this._draft.asReadonly();
    public readonly dirty: Signal<boolean> = this._dirty.asReadonly();
    public readonly save_state: Signal<PlanSaveState> = this._save_state.asReadonly();
    public readonly referential: Signal<NightwatchReferentialDTO | null> = this._referential.asReadonly();
    public readonly state: Signal<NightwatchStateDTO | null> = this._state.asReadonly();

    /** Main sur la proposition sélectionnée. */
    public readonly lock: Signal<PlanLockState> = computed((): PlanLockState => this.lockOf(this.selected_plan_id()));

    /** Propositions de la ville. */
    public readonly plans: Signal<NightwatchPlanDTO[]> = computed((): NightwatchPlanDTO[] => this.plans_dto()?.plans ?? []);

    /** Droit d'écriture, main mise à part : citoyen, hors mode observateur, sur aujourd'hui ou un jour à venir (jour passé : lecture seule). */
    public readonly can_write: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly() && this._selected_day() >= this.current_day);

    /** Droit de modifier la proposition affichée : refusé tant qu'une autre connexion a la main. */
    public readonly can_edit: Signal<boolean> = computed((): boolean => this.can_write() && this.lock().kind !== 'other');

    /** Jour modifiable sans proposition : la création est proposée. */
    public readonly can_create: Signal<boolean> = computed((): boolean => this.can_write() && this.plans_of_day().length === 0);

    /** Jours proposés : d'aujourd'hui à aujourd'hui + 7 (ou au lendemain du jour affiché), plus les jours passés qui ont une proposition. */
    public readonly days: Signal<number[]> = computed((): number[] => {
        const days: Set<number> = new Set<number>();
        const last_day: number = Math.max(this.current_day + FUTURE_DAYS, this._selected_day() + 1);
        for (let day: number = this.current_day; day <= last_day; day++) {
            days.add(day);
        }
        for (const plan of this.plans()) {
            days.add(plan.day);
        }
        return Array.from(days).sort((a: number, b: number): number => a - b);
    });

    public readonly plans_of_day: Signal<NightwatchPlanDTO[]> = computed((): NightwatchPlanDTO[] =>
        this.plans().filter((plan: NightwatchPlanDTO): boolean => plan.day === this._selected_day()));

    public readonly selected_plan: Signal<NightwatchPlanDTO | null> = computed((): NightwatchPlanDTO | null =>
        this.plans_of_day().find((plan: NightwatchPlanDTO): boolean => plan.id === this.selected_plan_id()) ?? null);

    /** Contexte de calcul ; nul tant que le référentiel et l'état ne sont pas chargés. */
    private readonly context: Signal<NightwatchContext | null> = computed((): NightwatchContext | null => {
        const referential: NightwatchReferentialDTO | null = this._referential();
        const state: NightwatchStateDTO | null = this._state();
        return referential === null || state === null ? null : {
            referential,
            town_is_panda: state.townIsPanda,
            round_path_level: state.roundPathLevel,
            has_guard_room: state.hasGuardRoom,
            has_sprinkler: state.hasSprinkler,
            built_building_uids: new Set<string>(state.builtBuildingUids)
        };
    });

    /** Au moins un veilleur du brouillon porte le Discours rassurant. */
    private readonly discourse_active: Signal<boolean> = computed((): boolean =>
        (this._draft()?.watchers ?? []).some((watcher: NightwatchWatcherDTO): boolean => watcher.hasDiscourse));

    /** Veilleurs du brouillon tels que prévus. */
    private readonly planned: Signal<PlannedWatcher[]> = computed((): PlannedWatcher[] => {
        const state: NightwatchStateDTO | null = this._state();
        return (this._draft()?.watchers ?? []).map((watcher: NightwatchWatcherDTO): PlannedWatcher => ({
            user_id: watcher.userId,
            items: watcher.items,
            items_broken: {},
            statuses: watcher.statuses.filter((status: string): boolean => status !== NOT_GHOUL_KEY),
            is_ghoul: plannedGhoul(watcher.statuses, this.citizenState(watcher.userId)?.isGhoul === true),
            past_watches: watcher.pastWatches ?? state?.pastWatches[watcher.userId] ?? 0,
            is_pro: false,
            hero_bonus: 0,
            baths: 0
        }));
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
        this.destroy_ref.onDestroy((): void => {
            void this.leavePlan(true);
        });
        this.follow(this.realtime.plan_saved$, (plan: NightwatchPlanDTO): void => this.onPlanSaved(plan));
        this.follow(this.realtime.plan_deleted$, (plan_id: number): void => this.onPlanDeleted(plan_id));
        this.follow(this.realtime.plan_effective_changed$, (plan: NightwatchPlanDTO): void => this.markEffective(plan));
        this.follow(this.realtime.plan_lock_changed$, (lock: PlanLockDTO): void => this.onLockChanged(lock));
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
                this._selected_day.set(this.current_day);
                this.selectPlanForDay(this.current_day);
                this.loadAttack(this.current_day);
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
     * Attribue une quantité d'un objet à un veilleur ; une quantité nulle retire l'objet.
     * @param {number} user_id Citoyen.
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité attribuée.
     */
    public setItem(user_id: number, item_id: number, quantity: number): void {
        this.updateWatcher(user_id, (watcher: NightwatchWatcherDTO): void => {
            if (quantity > 0) {
                watcher.items[item_id] = quantity;
            } else {
                delete watcher.items[item_id];
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
            content.attackOverride = attack;
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
     * Sélectionne la proposition effective du jour (ou la première) et en fait la copie de travail.
     * @param {number} day Jour affiché.
     */
    private selectPlanForDay(day: number): void {
        const of_day: NightwatchPlanDTO[] = this.plans().filter((plan: NightwatchPlanDTO): boolean => plan.day === day);
        const chosen: NightwatchPlanDTO | undefined = of_day.find((plan: NightwatchPlanDTO): boolean => plan.isEffective) ?? of_day[0];
        this.selected_plan_id.set(chosen?.id ?? null);
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
     * Crée une proposition au jour sélectionné puis la sélectionne ; le serveur donne la main sur la nouvelle à cette connexion.
     * @param {string} name Nom.
     * @param {NightwatchPlanContentDTO} content Contenu.
     */
    private addPlan(name: string, content: NightwatchPlanContentDTO): void {
        if (!this.can_write() || this.creating) {
            return;
        }
        this.creating = true;
        const request: NightwatchPlanRequestDTO = { day: this._selected_day(), name: name.slice(0, 64), content };
        this.plan_service.savePlan(request, this.realtime.connectionId(), this.map_id).subscribe({
            next: (saved: NightwatchPlanDTO): void => {
                this.creating = false;
                this.replacePlan(saved);
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

    /** Relit les propositions (refus de main, coupure) ; la copie de travail suit si rien n'attend. */
    private reloadPlans(): void {
        this.plan_service.getPlans(this.map_id).subscribe({
            next: (dto: NightwatchPlansDTO): void => {
                this.plans_dto.set(dto);
                if (!this._dirty()) {
                    this.resyncDraft();
                }
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
