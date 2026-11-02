import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import moment from 'moment';

import { DailyActionEnum, displayableDailyActions } from '../../../_abstract_model/enum/daily-action.enum';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { PlanningDataService, PlanningDay, PlanningStatic } from '../../../_abstract_model/services/planning-data.service';
import { TownTypeId } from '../../../_abstract_model/types/_types';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { availabilityIn } from '../../../_core/utilities/building-tree.util';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { bannedPoolForced, bannedPoolShown } from './budget.util';
import { BuildingProgress } from './building-progress.util';
import { BuildingUpgradesDTO } from './building-upgrades.types';
import { HomeUpgradeRef, homeUpgradeRefs } from './home-upgrades.util';
import { KeyedDebounce } from './keyed-debounce.util';
import { BuildingPlanContentDTO, BuildingPlanDTO, BuildingPlansDTO, emptyPlanContent, PlanPool, PlanTaskDTO, TownBuildingStateDTO } from './plan.types';
import { PlanAlert, planAlerts } from './plan-alerts.util';
import { BuildingRef, CitizenRef, DayEvaluation, evaluateDays, HomeLevelRef } from './plan-evaluation.util';
import { buildDayInputs } from './plan-inputs.util';
import { bankMap, buildingRefs, citizenRefs, hasSlaveryOf, homeLevelRefs, itemValueMap } from './planning-data.util';
import { sanitizeContent, ToggleContext } from './program-edit.util';
import { TaskCheckService } from './task-check.service';
import { withTaskIds } from './task-id.util';
import { taskLockKey } from './task-status.util';

/** Nombre de jours futurs proposés en plus d'aujourd'hui. */
const FUTURE_DAYS: number = 7;

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
    private readonly _conflict: WritableSignal<{ author: string | null } | null> = signal(null);
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

    public readonly current_day: number = getTown()?.day ?? 1;
    public readonly loading: Signal<boolean> = this._loading.asReadonly();
    public readonly saving: Signal<boolean> = this._saving.asReadonly();
    public readonly load_failed: Signal<boolean> = this._load_failed.asReadonly();
    public readonly conflict: Signal<{ author: string | null } | null> = this._conflict.asReadonly();
    public readonly selected_day: Signal<number> = this._selected_day.asReadonly();
    public readonly draft: Signal<BuildingPlanContentDTO | null> = this._draft.asReadonly();
    public readonly dirty: Signal<boolean> = this._dirty.asReadonly();

    public constructor() {
        inject(DestroyRef).onDestroy((): void => this.edits.cancelAll());
    }

    /** Droit d'écriture : citoyen d'une ville non terminée, hors mode observateur, sur aujourd'hui ou un jour à venir. */
    public readonly can_edit: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly() && this._selected_day() >= this.current_day);

    /** Droit d'écriture des réglages de la ville (valeurs d'objets), quel que soit le jour affiché. */
    public readonly can_edit_settings: Signal<boolean> = computed((): boolean =>
        this.plans_dto()?.access.canEdit === true && !this.town_context.isReadonly());

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

    /** Niveaux de maison du référentiel, indexés par niveau. */
    public readonly homes: Signal<ReadonlyMap<number, HomeLevelRef>> = computed((): ReadonlyMap<number, HomeLevelRef> => {
        const data: PlanningStatic | null = this.static_data();
        if (data === null) {
            return new Map<number, HomeLevelRef>();
        }
        return homeLevelRefs(data.homes, new Map<string, number>(data.items.map((item: Item): [string, number] => [item.uid, item.id])), moment.locale());
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
            return displayableDailyActions(null);
        }
        const built_ids: number[] = evaluation === null
            ? (this.static_data()?.state.buildings ?? []).filter((state: TownBuildingStateDTO): boolean => state.isBuilt).map((state: TownBuildingStateDTO): number => state.buildingId)
            : Array.from(evaluation.progressAfter.values()).filter((progress: BuildingProgress): boolean => progress.built).map((progress: BuildingProgress): number => progress.buildingId);
        return displayableDailyActions(new Set<string>(built_ids
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
            },
            error: (): void => {
                this._load_failed.set(true);
                this._loading.set(false);
            }
        });
    }

    /**
     * Change de jour : sélectionne la proposition effective (ou la première) et charge les jours manquants.
     * @param {number} day Jour à afficher.
     */
    public selectDay(day: number): void {
        this._selected_day.set(day);
        this.selectPlanForDay(day);
        this.ensureDaysLoaded(day);
    }

    /**
     * Sélectionne une proposition du jour ; la copie de travail précédente est abandonnée.
     * @param {number | null} plan_id Identifiant de la proposition.
     */
    public selectPlan(plan_id: number | null): void {
        this.selected_plan_id.set(plan_id);
        this.resetDraft();
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

    /** Supprime la proposition sélectionnée. */
    public deletePlan(): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        if (!this.can_edit() || plan === null) {
            return;
        }
        this.plan_service.deletePlan(plan.id).subscribe({
            next: (): void => {
                this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({ ...dto, plans: dto.plans.filter((candidate: BuildingPlanDTO): boolean => candidate.id !== plan.id) }));
                this.selectPlanForDay(this._selected_day());
            }
        });
    }

    /** Rend la proposition sélectionnée effective pour son jour. */
    public setEffective(): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        if (!this.can_edit() || plan === null) {
            return;
        }
        this.plan_service.setEffective(plan.id).subscribe({
            next: (updated: BuildingPlanDTO): void => {
                this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({
                    ...dto,
                    plans: dto.plans.map((candidate: BuildingPlanDTO): BuildingPlanDTO => {
                        if (candidate.day !== updated.day) {
                            return candidate;
                        }
                        return candidate.id === updated.id ? updated : { ...candidate, isEffective: false };
                    })
                }));
            }
        });
    }

    /**
     * Modifie la copie de travail (copie profonde puis mutation) ; ignoré sans droit d'écriture.
     * @param {(content: BuildingPlanContentDTO) => void} mutate Modification à appliquer à la copie.
     */
    public updateDraft(mutate: (content: BuildingPlanContentDTO) => void): void {
        const draft: BuildingPlanContentDTO | null = this._draft();
        if (!this.can_edit() || draft === null) {
            return;
        }
        const copy: BuildingPlanContentDTO = cloneContent(draft);
        mutate(copy);
        this._draft.set(copy);
        this._dirty.set(true);
        this.revision++;
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

    /** Enregistre la copie de travail avec la version lue ; un 409 recharge les propositions et signale le conflit. */
    public save(): void {
        this.flushEdits();
        const plan: BuildingPlanDTO | null = this.selected_plan();
        const draft: BuildingPlanContentDTO | null = this._draft();
        if (!this.can_edit() || plan === null || draft === null || !this._dirty() || this._saving()) {
            return;
        }
        const sent: number = this.revision;
        this._saving.set(true);
        this.plan_service.savePlan({ id: plan.id, version: plan.version, day: plan.day, name: plan.name, content: sanitizeContent(draft) }).subscribe({
            next: (saved: BuildingPlanDTO): void => {
                this.replacePlan(saved);
                this._dirty.set(this.revision !== sent);
                this._saving.set(false);
            },
            error: (error: unknown): void => {
                if (error instanceof HttpErrorResponse && error.status === 409) {
                    this.reloadAfterConflict(plan.id);
                } else {
                    this._saving.set(false);
                }
            }
        });
    }

    /**
     * Renomme la proposition sélectionnée ; enregistre le contenu déjà enregistré, la copie de travail reste à enregistrer.
     * @param {string} name Nouveau nom (rogné ; vide ou inchangé = ignoré).
     */
    public renamePlan(name: string): void {
        const plan: BuildingPlanDTO | null = this.selected_plan();
        const trimmed: string = name.trim();
        if (!this.can_edit() || plan === null || trimmed === '' || trimmed === plan.name || this._saving()) {
            return;
        }
        this._saving.set(true);
        this.plan_service.savePlan({ id: plan.id, version: plan.version, day: plan.day, name: trimmed, content: plan.content }).subscribe({
            next: (saved: BuildingPlanDTO): void => {
                this.replacePlan(saved);
                this._saving.set(false);
            },
            error: (error: unknown): void => {
                if (error instanceof HttpErrorResponse && error.status === 409) {
                    this.reloadAfterConflict(plan.id);
                } else {
                    this._saving.set(false);
                }
            }
        });
    }

    /** Ferme la bannière de conflit ; la copie de travail est conservée et s'enregistrera sur la version rechargée. */
    public dismissConflict(): void {
        this._conflict.set(null);
    }

    /**
     * Enregistre les valeurs en PA des objets avec la version des réglages lue.
     * @param {Record<string, number>} values Valeurs par identifiant d'objet.
     */
    public saveItemValues(values: Record<string, number>): void {
        const plans: BuildingPlansDTO | null = this.plans_dto();
        if (!this.can_edit_settings() || plans === null) {
            return;
        }
        this.plan_service.saveSettings({ itemValues: values, version: plans.settingsVersion }).subscribe({
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
        const release = (): void => this._pending_checks.update((pending: ReadonlySet<string>): ReadonlySet<string> => {
            const next: Set<string> = new Set<string>(pending);
            next.delete(key);
            return next;
        });
        this.task_check.setDone(citizen, task, done, this._selected_day()).subscribe({
            next: (): void => {
                release();
                this.citizens_revision.update((revision: number): number => revision + 1);
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
        this.resetDraft();
    }

    private resetDraft(): void {
        this.edits.cancelAll();
        const plan: BuildingPlanDTO | null = this.selected_plan();
        this._draft.set(plan === null ? null : cloneContent(plan.content));
        this._dirty.set(false);
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

    private addPlan(name: string, content: BuildingPlanContentDTO): void {
        if (!this.can_edit() || this._saving()) {
            return;
        }
        this._saving.set(true);
        this.plan_service.savePlan({ day: this._selected_day(), name, content }).subscribe({
            next: (saved: BuildingPlanDTO): void => {
                this.updatePlans((dto: BuildingPlansDTO): BuildingPlansDTO => ({ ...dto, plans: [...dto.plans, saved] }));
                this.selected_plan_id.set(saved.id);
                this.resetDraft();
                this._saving.set(false);
            },
            error: (): void => this._saving.set(false)
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

    private reloadAfterConflict(plan_id: number): void {
        this.plan_service.getPlans().subscribe({
            next: (dto: BuildingPlansDTO): void => {
                this.plans_dto.set(withPlanTaskIds(dto));
                const reloaded: BuildingPlanDTO | undefined = dto.plans.find((plan: BuildingPlanDTO): boolean => plan.id === plan_id);
                this._conflict.set({ author: reloaded?.authorName ?? null });
                this._saving.set(false);
            },
            error: (): void => this._saving.set(false)
        });
    }
}
