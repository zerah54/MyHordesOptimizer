import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import moment from 'moment';
import { filter, Observable } from 'rxjs';

import { ItemEmotesDTO } from '../../../_abstract_model/dto/item.dto';
import { DailyActionEnum, planningDailyActions } from '../../../_abstract_model/enum/daily-action.enum';
import { PlanLockDTO, RealtimeBuildingPlansService } from '../../../_abstract_model/realtime-services/realtime-building-plans.service';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { TownTypeId } from '../../../_abstract_model/types/_types';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { SnackbarService } from '../../../_core/services/snackbar.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { availabilityIn } from '../../../_core/utilities/building-tree.util';
import { getTown, getUserId } from '../../../_core/utilities/localstorage.util';
import { bannedPoolForced, bannedPoolShown } from './budget.util';
import { BuildingProgress } from './building-progress.util';
import { BuildingUpgradesDTO } from './building-upgrades.types';
import { HomeUpgradeRef, homeUpgradeRefs } from './home-upgrades.util';
import { KeyedDebounce } from './keyed-debounce.util';
import {
    BuildingPlanContentDTO,
    BuildingPlanDTO,
    BuildingPlanRequestDTO,
    BuildingPlansDTO,
    emptyPlanContent,
    PlanPool,
    PlanTaskDTO,
    TownBuildingStateDTO
} from './plan.types';
import { PlanAlert, planAlerts } from './plan-alerts.util';
import { BuildingRef, CitizenRef, DayEvaluation, evaluateDays, homeCosts, HomeLevelRef, URBANISM_UID } from './plan-evaluation.util';
import { buildDayInputs } from './plan-inputs.util';
import { bankMap, buildingRefs, builtUidsOf, citizenRefs, hasSlaveryOf, homeLevelRefs, itemValueMap } from './planning-data.util';
import { sanitizeContent, ToggleContext } from './program-edit.util';
import { TaskCheckService } from './task-check.service';
import { withTaskIds } from './task-id.util';
import { taskLockKey } from './task-status.util';

/** Nombre de jours futurs proposés en plus d'aujourd'hui. */
const FUTURE_DAYS: number = 7;

/** Délai d'enregistrement automatique après la dernière modification de la copie de travail. */
export const AUTOSAVE_DELAY_MS: number = 2000;

/** Attente maximale d'une saisie continue avant enregistrement : chaque enregistrement entretient la main (30 s d'inactivité côté API). */
export const AUTOSAVE_MAX_WAIT_MS: number = 10000;

/** Main sur une proposition : libre, tenue par cette connexion, ou par une autre (`sameUser` : le même joueur, dans un autre onglet). */
export type PlanLockState = { kind: 'free' } | { kind: 'mine' } | { kind: 'other'; userId: number; sameUser: boolean };

/** Main tenue par une autre connexion. */
type OtherLock = Extract<PlanLockState, { kind: 'other' }>;

/** Main de cette connexion, avec l'identifiant de connexion qui l'a obtenue : une reconnexion en change et la rend caduque. */
interface HeldLock {
    kind: 'mine';
    connection_id: string;
}

/** Main connue d'une proposition qui n'est pas libre. */
type KnownLock = OtherLock | HeldLock;

/** État de l'enregistrement automatique de la copie de travail. */
export type PlanSaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * Écriture refusée sur la proposition `plan_id`, signalée par la bannière : `kept` vrai si la copie de travail est conservée
 * (409, enregistrer écrasera la version de `author`), faux si elle est abandonnée faute de main (`author` : la personne qui l'a).
 */
export interface PlanConflict {
    plan_id: number;
    author: string | null;
    kept: boolean;
}

const FREE_LOCK: PlanLockState = { kind: 'free' };
const MINE_LOCK: PlanLockState = { kind: 'mine' };

/**
 * Copie profonde d'un contenu de plan.
 * @param {BuildingPlanContentDTO} content Contenu à copier.
 * @returns {BuildingPlanContentDTO} Copie indépendante.
 */
function cloneContent(content: BuildingPlanContentDTO): BuildingPlanContentDTO {
    return JSON.parse(JSON.stringify(content)) as BuildingPlanContentDTO;
}

/**
 * Propositions dont chaque consigne a un identifiant (point d'entrée unique des propositions reçues).
 * @param {BuildingPlansDTO} dto Propositions reçues de l'API.
 * @returns {BuildingPlansDTO} Propositions complétées.
 */
function withPlanTaskIds(dto: BuildingPlansDTO): BuildingPlansDTO {
    return { ...dto, plans: dto.plans.map((plan: BuildingPlanDTO): BuildingPlanDTO => ({ ...plan, content: withTaskIds(plan.content, plan.id) })) };
}

/**
 * État et actions de la page de planification des chantiers. Fourni par le composant racine de la page.
 */
@Injectable()
export class PlanningStore {

    private readonly data_service: PlanningDataService = inject(PlanningDataService);
    private readonly plan_service: BuildingPlanService = inject(BuildingPlanService);
    private readonly town_context: TownContextService = inject(TownContextService);

    private readonly _loading: WritableSignal<boolean> = signal(false);
    private readonly _saving: WritableSignal<boolean> = signal(false);
    private readonly _load_failed: WritableSignal<boolean> = signal(false);
    private readonly _conflict: WritableSignal<PlanConflict | null> = signal<PlanConflict | null>(null);
    private readonly static_data: WritableSignal<PlanningStatic | null> = signal(null);
    private readonly plans_dto: WritableSignal<BuildingPlansDTO | null> = signal(null);
    private readonly loaded_days: WritableSignal<ReadonlyMap<number, PlanningDay>> = signal(new Map<number, PlanningDay>());
    private readonly requested_days: Set<number> = new Set<number>();
    private readonly _selected_day: WritableSignal<number> = signal(getTown()?.day ?? 1);
    private readonly selected_plan_id: WritableSignal<number | null> = signal(null);
    private readonly _draft: WritableSignal<BuildingPlanContentDTO | null> = signal(null);
    private readonly _dirty: WritableSignal<boolean> = signal(false);
    /** Saisies différées des champs de la page, abandonnées quand la copie de travail est remplacée. */
    private readonly edits: KeyedDebounce = new KeyedDebounce(400);
    /** Compteur de modifications de la copie de travail (sait si elle a bougé pendant un envoi). */
    private revision: number = 0;
    private readonly task_check: TaskCheckService = inject(TaskCheckService);
    private readonly citizens_revision: WritableSignal<number> = signal(0);
    private readonly _pending_checks: WritableSignal<ReadonlySet<string>> = signal<ReadonlySet<string>>(new Set<string>());
    private readonly realtime: RealtimeBuildingPlansService = inject(RealtimeBuildingPlansService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Main connue par proposition (absente = libre), déduite à la réception. */
    private readonly locks: WritableSignal<ReadonlyMap<number, KnownLock>> = signal<ReadonlyMap<number, KnownLock>>(new Map<number, KnownLock>());
    /** Prise de main en cours par proposition, partagée par les demandes simultanées. */
    private readonly lock_requests: Map<number, Promise<PlanLockState>> = new Map<number, Promise<PlanLockState>>();
    private readonly _save_state: WritableSignal<PlanSaveState> = signal<PlanSaveState>('idle');
    private autosave_timer: ReturnType<typeof setTimeout> | null = null;
    /** Échéance de l'enregistrement d'une modification en attente, fixée à sa première modification. */
    private autosave_deadline: number | null = null;
    /** Écriture de proposition en cours : une seule à la fois, chacune part avec la version rendue par la précédente. */
    private in_flight: Promise<boolean> | null = null;
    /** Incrémenté à chaque remplacement de la copie de travail : une réponse tardive ne touche pas à la suivante. */
    private draft_epoch: number = 0;
    private creating: boolean = false;

    public readonly current_day: number = getTown()?.day ?? 1;
    public readonly loading: Signal<boolean> = this._loading.asReadonly();
    public readonly saving: Signal<boolean> = this._saving.asReadonly();
    public readonly load_failed: Signal<boolean> = this._load_failed.asReadonly();
    public readonly conflict: Signal<PlanConflict | null> = this._conflict.asReadonly();
    public readonly selected_day: Signal<number> = this._selected_day.asReadonly();
    public readonly draft: Signal<BuildingPlanContentDTO | null> = this._draft.asReadonly();
    public readonly dirty: Signal<boolean> = this._dirty.asReadonly();
    public readonly save_state: Signal<PlanSaveState> = this._save_state.asReadonly();

    /** Main sur la proposition sélectionnée. */
    public readonly lock: Signal<PlanLockState> = computed((): PlanLockState => this.lockOf(this.selected_plan_id()));

    public constructor() {
        this.destroy_ref.onDestroy((): void => {
            void this.leavePlan(true);
        });
        this.follow(this.realtime.plan_saved$, (plan: BuildingPlanDTO): void => this.onPlanSaved(plan));
        this.follow(this.realtime.plan_deleted$, (plan_id: number): void => this.onPlanDeleted(plan_id));
        this.follow(this.realtime.plan_effective_changed$, (plan: BuildingPlanDTO): void => this.markEffective(plan));
        this.follow(this.realtime.settings_saved$, (settings: BuildingPlansDTO): void => this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => (
            { ...dto, itemValues: settings.itemValues, settingsVersion: settings.settingsVersion })));
        this.follow(this.realtime.plan_lock_changed$, (lock: PlanLockDTO): void => this.onLockChanged(lock));
        this.follow(this.realtime.task_checks_changed$, (user_id: number): void => this.reloadCitizen(user_id));
        this.follow(this.realtime.reconnected$, (): void => {
            void this.onReconnected();
        });
    }

    /** Droit d'écriture, main mise à part : citoyen d'une ville non terminée, hors mode observateur, sur aujourd'hui ou un jour à venir. */
    public readonly can_write: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly() && this._selected_day() >= this.current_day);

    /** Droit de modifier la proposition affichée : refusé tant qu'une autre connexion a la main. */
    public readonly can_edit: Signal<boolean> = computed((): boolean => this.can_write() && this.lock().kind !== 'other');

    /** Droit d'écriture des réglages de la ville (valeurs d'objets), quel que soit le jour affiché. */
    public readonly can_edit_settings: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly());

    /** Version des réglages de la ville (valeurs d'objets) ; nulle avant le chargement. */
    public readonly settings_version: Signal<number | null> = computed((): number | null => this.plans_dto()?.settingsVersion ?? null);

    /** Le joueur est citoyen de la ville (droit de lecture des propositions). */
    public readonly is_citizen: Signal<boolean> = computed((): boolean => this.plans_dto()?.access.isCitizen === true);

    /** Jours proposés : d'aujourd'hui à aujourd'hui + 7 ou au lendemain du jour affiché s'il est plus loin, plus les jours passés qui ont une proposition. */
    public readonly days: Signal<number[]> = computed((): number[] => {
        const days: Set<number> = new Set<number>();
        const last_day: number = Math.max(this.current_day + FUTURE_DAYS, this._selected_day() + 1);
        for (let day: number = this.current_day; day <= last_day; day++) {
            days.add(day);
        }
        for (const plan of this.plans_dto()?.plans ?? []) {
            days.add(plan.day);
        }
        return Array.from(days).sort((a: number, b: number): number => a - b);
    });

    public readonly plans_of_day: Signal<BuildingPlanDTO[]> = computed((): BuildingPlanDTO[] =>
        (this.plans_dto()?.plans ?? []).filter((plan: BuildingPlanDTO): boolean => plan.day === this._selected_day()));

    public readonly selected_plan: Signal<BuildingPlanDTO | null> = computed((): BuildingPlanDTO | null =>
        this.plans_of_day().find((plan: BuildingPlanDTO): boolean => plan.id === this.selected_plan_id()) ?? null);

    public readonly buildings: Signal<ReadonlyMap<number, BuildingRef>> = computed((): ReadonlyMap<number, BuildingRef> => {
        const data: PlanningStatic | null = this.static_data();
        return data === null ? new Map<number, BuildingRef>() : buildingRefs(data.buildings, data.state.buildings, this.hardMode(), moment.locale());
    });

    /** Chantiers présents dans l'état synchronisé de la ville (les autres sont « non débloqués »). */
    public readonly synced_ids: Signal<ReadonlySet<number>> = computed((): ReadonlySet<number> =>
        new Set<number>((this.static_data()?.state.buildings ?? []).map((state: TownBuildingStateDTO): number => state.buildingId)));

    /** Chantiers que la ville peut planifier : non désactivés pour son type, ou présents dans son état synchronisé. */
    public readonly plannable_buildings: Signal<BuildingRef[]> = computed((): BuildingRef[] => {
        const refs: ReadonlyMap<number, BuildingRef> = this.buildings();
        const synced: ReadonlySet<number> = this.synced_ids();
        const town_type: TownTypeId | null = getTown()?.town_type ?? null;
        return (this.static_data()?.buildings ?? [])
            .filter((building: Building): boolean => synced.has(building.id) || availabilityIn(building, town_type) !== 'Disabled')
            .map((building: Building): BuildingRef | undefined => refs.get(building.id))
            .filter((building: BuildingRef | undefined): building is BuildingRef => building !== undefined);
    });

    /** Référentiel brut des chantiers (icônes, paliers de plan, disponibilité). */
    public readonly catalog: Signal<readonly Building[]> = computed((): readonly Building[] => this.static_data()?.buildings ?? []);

    /** Ce qu'il faut pour cocher un chantier : parents, avancement au début du jour, pertes de la nuit ; nul sans évaluation. */
    public readonly toggle_context: Signal<ToggleContext | null> = computed((): ToggleContext | null => {
        const evaluation: DayEvaluation | null = this.evaluation();
        if (evaluation === null) {
            return null;
        }
        const parents: Map<number, number | null> = new Map<number, number | null>();
        this.buildings().forEach((building: BuildingRef, id: number): void => {
            parents.set(id, building.parentId);
        });
        return { parents, progress: evaluation.progressBefore, nightLoss: evaluation.nightLoss };
    });

    /** Agrandissements de maison sans limite d'un par jour : ville en chaos ou en Pandémonium. */
    public readonly unlimited_home_levels: Signal<boolean> = computed((): boolean => getTown()?.is_chaos === true || this.hardMode());

    /** Niveaux de maison du référentiel, indexés par niveau, au coût de la ville d'après l'état synchronisé. */
    public readonly homes: Signal<ReadonlyMap<number, HomeLevelRef>> = computed((): ReadonlyMap<number, HomeLevelRef> => {
        const data: PlanningStatic | null = this.static_data();
        if (data === null) {
            return new Map<number, HomeLevelRef>();
        }
        return homeCosts(
            homeLevelRefs(data.homes, new Map<string, number>(data.items.map((item: Item): [string, number] => [item.uid, item.id])), moment.locale()),
            builtUidsOf(data.buildings, data.state.buildings).has(URBANISM_UID)
        );
    });

    public readonly citizens: Signal<CitizenRef[]> = computed((): CitizenRef[] => citizenRefs(this.static_data()?.citizens ?? []));

    /** Citoyens vivants complets (métier, maison, actions…) ; nouveau tableau après chaque coche enregistrée. */
    public readonly citizens_full: Signal<Citizen[]> = computed((): Citizen[] => {
        this.citizens_revision();
        return (this.static_data()?.citizens ?? []).filter((citizen: Citizen): boolean => citizen.is_dead !== true);
    });

    /** Coche possible : citoyen de la ville, hors observateur, sur le jour en cours. */
    public readonly can_track: Signal<boolean> = computed((): boolean =>
        this.is_citizen() && !this.town_context.isReadonly() && this._selected_day() === this.current_day);

    /** Actions quotidiennes possibles ce jour : chantier construit, ou terminé par le programme du jour. */
    public readonly displayable_actions: Signal<DailyActionEnum[]> = computed((): DailyActionEnum[] => {
        const evaluation: DayEvaluation | null = this.evaluation();
        const refs: ReadonlyMap<number, BuildingRef> = this.buildings();
        if ((this.static_data()?.state.buildings ?? []).length === 0) {
            // Aucun chantier synchronisé : chantiers construits inconnus, supposés non construits.
            return planningDailyActions(null);
        }
        const built_ids: number[] = evaluation === null
            ? (this.static_data()?.state.buildings ?? []).filter((state: TownBuildingStateDTO): boolean => state.isBuilt).map((state: TownBuildingStateDTO): number => state.buildingId)
            : Array.from(evaluation.progressAfter.values()).filter((progress: BuildingProgress): boolean => progress.built).map((progress: BuildingProgress): number => progress.buildingId);
        return planningDailyActions(new Set<string>(built_ids
            .map((id: number): string | undefined => refs.get(id)?.uid)
            .filter((uid: string | undefined): uid is string => uid !== undefined)));
    });

    /** Améliorations de maison proposables dans une consigne. */
    public readonly home_upgrades: Signal<HomeUpgradeRef[]> = computed((): HomeUpgradeRef[] => {
        const data: PlanningStatic | null = this.static_data();
        return data === null ? [] : homeUpgradeRefs(data.homes);
    });

    public readonly item_values: Signal<ReadonlyMap<number, number>> = computed((): ReadonlyMap<number, number> => itemValueMap(this.plans_dto()?.itemValues ?? {}));

    public readonly bank: Signal<ReadonlyMap<number, number>> = computed((): ReadonlyMap<number, number> => bankMap(this.static_data()?.bank ?? []));

    public readonly items: Signal<readonly Item[]> = computed((): readonly Item[] => this.static_data()?.items ?? []);

    /** Évolutions des chantiers (niveaux, textes, valeurs par niveau) ; vides si l'API ne les fournit pas. */
    public readonly upgrades: Signal<BuildingUpgradesDTO> = computed((): BuildingUpgradesDTO => this.static_data()?.upgrades ?? {});
    /** Balises forum des objets, par uid. */
    public readonly item_emotes: Signal<ItemEmotesDTO> = computed((): ItemEmotesDTO => this.static_data()?.item_emotes ?? {});

    /** Évaluation du jour sélectionné, chaînée depuis aujourd'hui ; nulle pour un jour passé ou sans copie de travail. */
    public readonly evaluation: Signal<DayEvaluation | null> = computed((): DayEvaluation | null => {
        const data: PlanningStatic | null = this.static_data();
        const plans: BuildingPlansDTO | null = this.plans_dto();
        const draft: BuildingPlanContentDTO | null = this._draft();
        const day: number = this._selected_day();
        if (data === null || plans === null || draft === null || day < this.current_day) {
            return null;
        }
        const contents: BuildingPlanContentDTO[] = [];
        for (let current: number = this.current_day; current <= day; current++) {
            contents.push(current === day ? draft : (this.effectivePlanOf(plans, current)?.content ?? emptyPlanContent()));
        }
        const inputs: ReturnType<typeof buildDayInputs> = buildDayInputs(
            { data: { ...data, plans }, days: this.loaded_days(), hard_mode: this.hardMode(), locale: moment.locale() },
            this.current_day,
            contents
        );
        const evaluations: DayEvaluation[] = evaluateDays(inputs);
        return evaluations[evaluations.length - 1] ?? null;
    });

    /** BDE construit au jour affiché ; un jour passé n'a pas d'évaluation et lit l'état synchronisé. */
    private readonly has_slavery: Signal<boolean> = computed((): boolean => {
        const data: PlanningStatic | null = this.static_data();
        return this.evaluation()?.hasSlavery ?? (data !== null && hasSlaveryOf(data.buildings, data.state.buildings));
    });

    /** Poche des bannis affichée d'office : le réglage de la proposition ne peut pas la masquer. */
    public readonly banned_pool_forced: Signal<boolean> = computed((): boolean =>
        bannedPoolForced(this._draft() ?? emptyPlanContent(), this.citizens(), this.has_slavery()));

    /** Poche des bannis affichée sur la proposition. */
    public readonly banned_pool_shown: Signal<boolean> = computed((): boolean =>
        bannedPoolShown(this._draft() ?? emptyPlanContent(), this.citizens(), this.has_slavery()));

    /** Poches à afficher, dans l'ordre d'exécution. */
    public readonly visible_pools: Signal<PlanPool[]> = computed((): PlanPool[] => this.banned_pool_shown() ? ['banned', 'regular'] : ['regular']);

    /** Alertes du jour affiché. */
    public readonly alerts: Signal<PlanAlert[]> = computed((): PlanAlert[] => {
        const evaluation: DayEvaluation | null = this.evaluation();
        return evaluation === null ? [] : planAlerts(evaluation, this.buildings(), this.citizens(), this.banned_pool_shown());
    });

    /** Charge toutes les données de la page et sélectionne la proposition du jour. */
    public load(): void {
        this._loading.set(true);
        this._load_failed.set(false);
        this.data_service.loadStatic().subscribe({
            next: (data: PlanningStatic): void => {
                this.static_data.set(data);
                this.plans_dto.set(withPlanTaskIds(data.plans));
                this._selected_day.set(this.current_day);
                this.selectPlanForDay(this.current_day);
                this.ensureDaysLoaded(this.current_day);
                this._loading.set(false);
                // Le hub suit la ville du jeton reçu à l'ouverture de la connexion : la remettre à jour avant de relire les mains.
                void this.realtime.ensureTown().then((): Promise<void> => this.refreshLocks());
            },
            error: (): void => {
                this._load_failed.set(true);
                this._loading.set(false);
            }
        });
    }

    /**
     * Change de jour après avoir quitté la proposition affichée : sélectionne la proposition effective (ou la première) et charge les jours manquants.
     * @param {number} day Jour à afficher.
     */
    public selectDay(day: number): void {
        void this.leavePlan(true);
        this._selected_day.set(day);
        this.selectPlanForDay(day);
        this.ensureDaysLoaded(day);
    }

    /**
     * Sélectionne une proposition du jour après avoir quitté la précédente ; ce qui n'a pas pu partir tout de suite est abandonné.
     * @param {number | null} plan_id Identifiant de la proposition.
     */
    public selectPlan(plan_id: number | null): void {
        void this.leavePlan(true);
        this.selected_plan_id.set(plan_id);
        this._conflict.set(null);
        this.resetDraft();
    }

    /**
     * Avant de quitter la page : applique les saisies, enregistre tout de suite ce qui attend, puis libère la main si on la tient.
     * Sur un échec, la main est gardée : la personne peut rester et réessayer.
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
        this.addPlan(name, emptyPlanContent());
    }

    /**
     * Crée une proposition au jour sélectionné à partir de la copie de travail courante.
     * @param {string} name Nom de la proposition.
     */
    public duplicatePlan(name: string): void {
        this.flushEdits();
        const current: BuildingPlanContentDTO | null = this._draft() ?? this.selected_plan()?.content ?? null;
        this.addPlan(name, current === null ? emptyPlanContent() : sanitizeContent(current));
    }

    /** Supprime la proposition sélectionnée, après avoir pris la main (un refus n'envoie rien). */
    public deletePlan(): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        if (!this.can_edit() || plan === null) {
            return;
        }
        void this.removePlan(plan.id);
    }

    /** Rend la proposition sélectionnée effective pour son jour, même sous la main d'un autre. */
    public setEffective(): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        if (!this.can_write() || plan === null) {
            return;
        }
        this.plan_service.setEffective(plan.id, this.realtime.connectionId()).subscribe({
            next: (updated: BuildingPlanDTO): void => this.markEffective(updated)
        });
    }

    /**
     * Modifie la copie de travail (copie profonde puis mutation), prend la main si elle est libre, et relance l'enregistrement
     * automatique ; ignoré sans droit d'écriture. Main refusée : modification annulée ; échec technique : modification gardée.
     * @param {(content: BuildingPlanContentDTO) => void} mutate Modification à appliquer à la copie.
     */
    public updateDraft(mutate: (content: BuildingPlanContentDTO) => void): void {
        const plan_id: number | null = this.selected_plan_id();
        const draft: BuildingPlanContentDTO | null = this._draft();
        if (!this.can_edit() || plan_id === null || draft === null) {
            return;
        }
        const copy: BuildingPlanContentDTO = cloneContent(draft);
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
     * Modification différée (saisie dans un champ) : seule la dernière par clé s'applique, après un court délai ; abandonnée
     * si la copie de travail est remplacée entre-temps (autre proposition, autre jour).
     * @param {string} key Champ saisi.
     * @param {(content: BuildingPlanContentDTO) => void} mutate Modification à appliquer.
     */
    public deferEdit(key: string, mutate: (content: BuildingPlanContentDTO) => void): void {
        this.edits.schedule(key, (): void => this.updateDraft(mutate));
    }

    /** Applique tout de suite les saisies en attente (avant un enregistrement ou un changement de rangs). */
    public flushEdits(): void {
        this.edits.flush();
    }

    /**
     * Enregistre la copie de travail avec la version lue, sous la main (prise si besoin) ; 409 : rechargement et conflit signalé,
     * copie gardée ; 423 : main perdue, copie remplacée par la proposition rechargée et conflit signalé.
     */
    public save(): void {
        void this.persist();
    }

    /**
     * Renomme la proposition sélectionnée sous la main ; enregistre le contenu déjà enregistré, la copie de travail reste à enregistrer.
     * @param {string} name Nouveau nom (rogné ; vide ou inchangé = ignoré).
     */
    public renamePlan(name: string): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        const trimmed: string = name.trim();
        if (!this.can_edit() || plan === null || trimmed === '' || trimmed === plan.name) {
            return;
        }
        void this.rename(plan.id, trimmed);
    }

    /** Ferme la bannière de conflit ; la copie de travail conservée s'enregistre alors sur la version rechargée. */
    public dismissConflict(): void {
        this._conflict.set(null);
        if (this._dirty()) {
            this.scheduleAutosave();
        }
    }

    /**
     * Enregistre les valeurs en PA des objets avec la version des réglages sur laquelle elles ont été modifiées.
     * @param {Record<string, number>} values Valeurs par identifiant d'objet.
     * @param {number | null} version Version lue à la première modification ; nulle = version courante.
     */
    public saveItemValues(values: Record<string, number>, version: number | null = null): void {
        const plans: BuildingPlansDTO | null = this.plans_dto();
        if (!this.can_edit_settings() || plans === null) {
            return;
        }
        this.plan_service.saveSettings({ itemValues: values, version: version ?? plans.settingsVersion }, this.realtime.connectionId()).subscribe({
            next: (dto: BuildingPlansDTO): void => this.plans_dto.set(withPlanTaskIds(dto))
        });
    }

    /**
     * Marque une consigne faite ou non pour le jour affiché ; ignoré hors suivi ou pendant une écriture de la même consigne.
     * @param {number} user_id Citoyen concerné.
     * @param {PlanTaskDTO} task Consigne.
     * @param {boolean} done Nouvel état.
     */
    public setTaskDone(user_id: number, task: PlanTaskDTO, done: boolean): void {
        const citizen: Citizen | undefined = this.citizens_full().find((candidate: Citizen): boolean => candidate.id === user_id);
        const key: string = taskLockKey(user_id, task);
        if (!this.can_track() || citizen === undefined || this._pending_checks().has(key)) {
            return;
        }
        this._pending_checks.update((pending: ReadonlySet<string>): ReadonlySet<string> => new Set<string>(pending).add(key));
        const release: () => void = (): void => this._pending_checks.update((pending: ReadonlySet<string>): ReadonlySet<string> => {
            const next: Set<string> = new Set<string>(pending);
            next.delete(key);
            return next;
        });
        this.task_check.setDone(citizen, task, done, this._selected_day()).subscribe({
            next: (): void => {
                release();
                this.citizens_revision.update((revision: number): number => revision + 1);
                this.realtime.notifyTaskChecks(user_id).catch((error: unknown): void => console.warn('NotifyTaskChecks', error));
            },
            error: release
        });
    }

    /**
     * Écriture en cours pour cette consigne (ou une autre consigne de la même action).
     * @param {number} user_id Citoyen.
     * @param {PlanTaskDTO} task Consigne.
     * @returns {boolean} Vrai pendant l'écriture.
     */
    public isPending(user_id: number, task: PlanTaskDTO): boolean {
        return this._pending_checks().has(taskLockKey(user_id, task));
    }

    private hardMode(): boolean {
        return getTown()?.town_type === 'PANDE';
    }

    private effectivePlanOf(plans: BuildingPlansDTO, day: number): BuildingPlanDTO | undefined {
        return plans.plans.find((plan: BuildingPlanDTO): boolean => plan.day === day && plan.isEffective);
    }

    private selectPlanForDay(day: number): void {
        const of_day: BuildingPlanDTO[] = (this.plans_dto()?.plans ?? []).filter((plan: BuildingPlanDTO): boolean => plan.day === day);
        const chosen: BuildingPlanDTO | undefined = of_day.find((plan: BuildingPlanDTO): boolean => plan.isEffective) ?? of_day[0];
        this.selected_plan_id.set(chosen?.id ?? null);
        this._conflict.set(null);
        this.resetDraft();
    }

    /** Remplace la copie de travail par la proposition sélectionnée ; saisies et enregistrement automatique en attente abandonnés. */
    private resetDraft(): void {
        this.edits.cancelAll();
        this.cancelAutosave();
        this.draft_epoch++;
        const plan: BuildingPlanDTO | null = this.selected_plan();
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

    private ensureDaysLoaded(day: number): void {
        for (let current: number = this.current_day; current <= day; current++) {
            if (this.requested_days.has(current)) {
                continue;
            }
            this.requested_days.add(current);
            this.data_service.loadDay(current).subscribe({
                next: (loaded: PlanningDay): void => this.storeDay(current, loaded),
                error: (): void => this.storeDay(current, { expeditions: [], attack: null })
            });
        }
    }

    private storeDay(day: number, loaded: PlanningDay): void {
        this.loaded_days.update((days: ReadonlyMap<number, PlanningDay>): ReadonlyMap<number, PlanningDay> => new Map<number, PlanningDay>(days).set(day, loaded));
    }

    /**
     * Quitte la proposition affichée : applique les saisies, enregistre tout de suite ce qui attend, puis libère la main si on la
     * tient. Sur un échec, la main n'est gardée que si la proposition reste affichée.
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
     * Crée une proposition au jour sélectionné puis la sélectionne en quittant la précédente (ce qui y attend est enregistré) ;
     * le serveur donne la main sur la nouvelle à cette connexion. Indépendant des écritures en cours sur une autre proposition.
     * @param {string} name Nom.
     * @param {BuildingPlanContentDTO} content Contenu.
     */
    private addPlan(name: string, content: BuildingPlanContentDTO): void {
        if (!this.can_write() || this.creating) {
            return;
        }
        this.creating = true;
        this.plan_service.savePlan({ day: this._selected_day(), name, content }, this.realtime.connectionId()).subscribe({
            next: (saved: BuildingPlanDTO): void => {
                this.creating = false;
                this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({ ...dto, plans: [...dto.plans, saved] }));
                this.selectPlan(saved.id);
            },
            error: (): void => {
                this.creating = false;
            }
        });
    }

    private replacePlan(saved: BuildingPlanDTO): void {
        this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({
            ...dto,
            plans: dto.plans.some((plan: BuildingPlanDTO): boolean => plan.id === saved.id)
                ? dto.plans.map((plan: BuildingPlanDTO): BuildingPlanDTO => (plan.id === saved.id ? saved : plan))
                : [...dto.plans, saved]
        }));
    }

    private updatePlans(update: (dto: BuildingPlansDTO) => BuildingPlansDTO): void {
        this.plans_dto.update((dto: BuildingPlansDTO | null): BuildingPlansDTO | null => (dto === null ? null : withPlanTaskIds(update(dto))));
    }

    /**
     * Après un refus d'écriture : recharge les propositions et, si la proposition est toujours affichée, signale le conflit ; la
     * copie abandonnée est remplacée par la proposition rechargée, une fois celle-ci arrivée.
     * @param {number} plan_id Proposition refusée.
     * @param {boolean} abandon_draft Copie de travail abandonnée (main perdue) plutôt que gardée.
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
                    // Proposition disparue entre-temps : la sélection a basculé, la perte est annoncée sans bannière.
                    this.snackbar.warningSnackbar($localize`Cette proposition a été supprimée`);
                }
            };
            this.plan_service.getPlans().subscribe({
                next: (dto: BuildingPlansDTO): void => {
                    this.plans_dto.set(withPlanTaskIds(dto));
                    if (abandon_draft) {
                        abandon();
                    } else if (this.selected_plan_id() === plan_id) {
                        const reloaded: BuildingPlanDTO | undefined = dto.plans.find((plan: BuildingPlanDTO): boolean => plan.id === plan_id);
                        this._conflict.set({ plan_id, author: reloaded?.authorName ?? null, kept: true });
                    }
                    this._saving.set(false);
                    resolve();
                },
                error: (): void => {
                    if (abandon_draft) {
                        abandon();
                    }
                    this._saving.set(false);
                    resolve();
                }
            });
        });
    }

    /**
     * Main perdue avec une écriture en attente (423, reprise par un autre) : traité comme un conflit, mais la copie, qui ne peut
     * plus s'enregistrer, est abandonnée ; la bannière rend la perte visible. Rien n'attend le hub (il peut être coupé) : la
     * bannière nomme le dernier détenteur connu, complété quand les mains relues reviennent.
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
     * Enregistre la copie de travail en attente : attend l'écriture en cours, prend la main si besoin, puis envoie. Rien en cours
     * et main tenue : l'envoi part avant le premier `await` (la sélection peut changer juste après).
     * @returns {Promise<boolean>} Vrai si plus rien n'attend ; faux si l'enregistrement a échoué ou n'a pas pu partir.
     */
    private async persist(): Promise<boolean> {
        this.flushEdits();
        this.cancelAutosave();
        const epoch: number = this.draft_epoch;
        if (this.in_flight !== null) {
            // Une seule écriture à la fois : chaque attente repart du début, une autre a pu partir entre-temps.
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
            // Main obtenue : on reprend du début, une autre écriture a pu partir entre-temps.
            return epoch === this.draft_epoch && this.lockOf(plan_id).kind === 'mine' ? this.persist() : false;
        }
        return this.sendDraft();
    }

    /**
     * Envoie la copie de travail de la proposition sélectionnée, avec la version lue.
     * @returns {Promise<boolean>} Vrai si l'enregistrement est accepté.
     */
    private sendDraft(): Promise<boolean> {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        const draft: BuildingPlanContentDTO | null = this._draft();
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
        return this.write(plan.id, { id: plan.id, version: plan.version, day: plan.day, name: plan.name, content: sanitizeContent(draft) }, (): void => {
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
     * @param {BuildingPlanRequestDTO} request Requête.
     * @param {() => void} on_saved Suite d'une écriture acceptée, après mise à jour de la proposition.
     * @param {() => void} on_failed Suite d'un échec autre que 423.
     * @returns {Promise<boolean>} Vrai si l'écriture est acceptée ; jamais rejetée.
     */
    private write(plan_id: number, request: BuildingPlanRequestDTO, on_saved: () => void, on_failed: () => void): Promise<boolean> {
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
        this._saving.set(true);
        this.plan_service.savePlan(request, this.realtime.connectionId()).subscribe({
            next: (saved: BuildingPlanDTO): void => {
                this.replacePlan(saved);
                on_saved();
                this._saving.set(false);
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
                this._saving.set(false);
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
        // Revérifié au réveil : une autre attente a pu envoyer entre-temps ; l'envoi suit sans `await` intermédiaire.
        while (this.in_flight !== null) {
            await this.settleWrites();
        }
        const plan: BuildingPlanDTO | undefined = this.plans_dto()?.plans.find((candidate: BuildingPlanDTO): boolean => candidate.id === plan_id);
        if (plan === undefined || plan.name === name || this.lockOf(plan_id).kind !== 'mine') {
            return;
        }
        await this.write(plan_id, { id: plan.id, version: plan.version, day: plan.day, name, content: plan.content }, (): void => undefined, (): void => undefined);
    }

    /**
     * Supprime sous la main, après l'écriture en cours ; un 423 (course) est déjà signalé par la notification générique.
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
        this.plan_service.deletePlan(plan_id, this.realtime.connectionId()).subscribe({
            next: (): void => this.dropPlan(plan_id),
            error: (): void => undefined
        });
    }

    /**
     * Proposition supprimée par un autre ; si une modification y attendait, sa perte est signalée.
     * @param {number} plan_id Proposition.
     */
    private onPlanDeleted(plan_id: number): void {
        if (plan_id === this.selected_plan_id()) {
            // Une saisie encore dans son délai compte comme modification perdue.
            this.flushEdits();
            if (this._dirty()) {
                this.snackbar.warningSnackbar($localize`Cette proposition a été supprimée`);
            }
        }
        this.dropPlan(plan_id);
    }

    /**
     * Retire une proposition supprimée ; si c'était la sélection, bascule sur une autre proposition du jour.
     * @param {number} plan_id Proposition.
     */
    private dropPlan(plan_id: number): void {
        this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({ ...dto, plans: dto.plans.filter((candidate: BuildingPlanDTO): boolean => candidate.id !== plan_id) }));
        this.setLock(plan_id, null);
        if (this.selected_plan_id() === plan_id) {
            this.selectPlanForDay(this._selected_day());
        }
    }

    /**
     * Rend une proposition effective pour son jour, les autres du même jour cessent de l'être. Sous notre main, ou pour la
     * sélection quand une modification attend, seule l'étoile change : adopter la version reçue ferait écraser sans 409.
     * @param {BuildingPlanDTO} updated Proposition devenue effective.
     */
    private markEffective(updated: BuildingPlanDTO): void {
        const keep: boolean = this.lockOf(updated.id).kind === 'mine' || (updated.id === this.selected_plan_id() && this._dirty());
        this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({
            ...dto,
            plans: dto.plans.map((candidate: BuildingPlanDTO): BuildingPlanDTO => {
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
        this.autosave_deadline ??= now + AUTOSAVE_MAX_WAIT_MS;
        const delay: number = Math.min(AUTOSAVE_DELAY_MS, Math.max(0, this.autosave_deadline - now));
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
     * Main refusée à une action de l'utilisateur : la modification est annulée, la proposition rechargée (la version locale
     * a pu ne pas suivre pendant l'attente) et l'auteur prévenu.
     * @param {OtherLock} state Détenteur.
     */
    private refuseEdit(state: OtherLock): void {
        this.resetDraft();
        this.reloadPlans();
        this.snackbar.warningSnackbar($localize`${this.citizenName(state.userId)}:pseudo: modifie déjà cette proposition`);
    }

    /**
     * Libère la main sur une proposition quittée, après les écritures en cours (partie après la libération, une écriture
     * recevrait un 423). Hub coupé : le serveur l'a déjà libérée.
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
        if (!this.can_edit_settings()) {
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
        this.plan_service.getPlans().subscribe({
            next: (dto: BuildingPlansDTO): void => {
                this.plans_dto.set(withPlanTaskIds(dto));
                if (!this._dirty()) {
                    this.resyncDraft();
                }
            },
            error: (error: unknown): void => console.warn('GetPlans', error)
        });
    }

    /**
     * Proposition enregistrée par une autre connexion. Ignorée pour la sélection quand une modification attend (saisie dans
     * son délai comprise) : adopter sa version ferait écraser son travail sans 409. Sinon la copie de travail la suit.
     * @param {BuildingPlanDTO} plan Proposition reçue.
     */
    private onPlanSaved(plan: BuildingPlanDTO): void {
        const selected: boolean = plan.id === this.selected_plan_id();
        if (selected) {
            this.flushEdits();
        }
        if (selected && this._dirty()) {
            return;
        }
        this.replacePlan(plan);
        if (selected) {
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
        if (selected) {
            // Une saisie encore dans son délai rejoint la copie avant la perte de main : elle passe par la bannière au lieu de disparaître.
            this.flushEdits();
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
     * Reconnexion : la main de l'ancienne connexion compte déjà comme libre (identifiant différent) ; ce qui attend repart sous
     * une main reprise, puis tout est relu.
     */
    private async onReconnected(): Promise<void> {
        this.flushEdits();
        if (this._dirty()) {
            await this.persist();
        }
        if (!this._dirty()) {
            this.reloadPlans();
        }
        await this.refreshLocks();
    }

    /**
     * Relit un citoyen dont les coches ont changé ailleurs et le remplace dans les données de la page.
     * @param {number} user_id Citoyen.
     */
    private reloadCitizen(user_id: number): void {
        this.town_service.getCitizen(user_id).subscribe({
            next: (citizen: Citizen): void => {
                this.static_data.update((data: PlanningStatic | null): PlanningStatic | null => (data === null
                    ? null
                    : { ...data, citizens: data.citizens.map((candidate: Citizen): Citizen => (candidate.id === user_id ? citizen : candidate)) }));
                this.citizens_revision.update((revision: number): number => revision + 1);
            },
            error: (error: unknown): void => console.warn('GetCitizen', error)
        });
    }

    /**
     * Pseudo d'un citoyen de la ville.
     * @param {number} user_id Citoyen.
     * @returns {string} Pseudo, `?` s'il est inconnu.
     */
    private citizenName(user_id: number): string {
        return this.static_data()?.citizens.find((citizen: Citizen): boolean => citizen.id === user_id)?.name ?? '?';
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
