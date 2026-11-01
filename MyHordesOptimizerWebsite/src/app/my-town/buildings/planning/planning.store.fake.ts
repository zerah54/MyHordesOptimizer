import { computed, Signal, signal, WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

import { DailyActionEnum, displayableDailyActions } from '../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Building } from '../../../_abstract_model/types/building.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Home } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { bannedPoolForced, bannedPoolShown } from './budget.util';
import { BuildingProgress } from './building-progress.util';
import { HomeUpgradeRef } from './home-upgrades.util';
import { KeyedDebounce } from './keyed-debounce.util';
import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent, PlanPool, PlanTaskDTO } from './plan.types';
import { PlanAlert, planAlerts } from './plan-alerts.util';
import { BuildingRef, CitizenRef, DayEvaluation, DayInput, evaluateDay, HomeLevelRef, WORKSHOP_UID } from './plan-evaluation.util';
import { PlanningStore } from './planning.store';
import { ToggleContext } from './program-edit.util';
import { taskLockKey } from './task-status.util';

/** Chantiers de test : mur (reste à construire), atelier, porte construite et abîmée. */
export const FAKE_BUILDINGS: ReadonlyMap<number, BuildingRef> = new Map<number, BuildingRef>([
    [1, { id: 1, uid: 'wall', label: 'Mur', pa: 40, defence: 30, maxLife: 30, temporary: false, breakable: true, parentId: null, resources: [{ itemId: 5, count: 2 }] }],
    [2, { id: 2, uid: WORKSHOP_UID, label: 'Atelier', pa: 20, defence: 0, maxLife: 0, temporary: false, breakable: true, parentId: null, resources: [] }],
    [3, { id: 3, uid: 'gate', label: 'Porte', pa: 10, defence: 15, maxLife: 30, temporary: false, breakable: true, parentId: null, resources: [] }]
]);

/**
 * Référentiel brut correspondant à FAKE_BUILDINGS (icônes, parents, paliers).
 * @returns {Building[]} Chantiers du référentiel.
 */
export function fakeCatalog(): Building[] {
    return Array.from(FAKE_BUILDINGS.values()).map((ref: BuildingRef): Building => Object.assign(new Building(), {
        id: ref.id, uid: ref.uid, img: `building/${ref.uid}.gif`, label: { fr: ref.label, en: ref.label, de: ref.label, es: ref.label }, description: { fr: '' },
        parent_id: ref.parentId, display_order: ref.id, pa: ref.pa, defence: ref.defence, max_life: ref.maxLife,
        breakable: ref.breakable, temporary: ref.temporary, has_upgrade: ref.uid !== 'wall', rarity: 0, has_hard_mode: false, availability: {}
    }));
}

/** Citoyens de test : un normal, un banni, un technicien. */
export const FAKE_CITIZENS: CitizenRef[] = [
    { userId: 1, name: 'Alice', banned: false, technician: false, homeLevel: null },
    { userId: 2, name: 'Bob', banned: true, technician: false, homeLevel: null },
    { userId: 3, name: 'Chloé', banned: false, technician: true, homeLevel: 1 }
];

/** Citoyens de test d'une ville sans banni. */
export const FAKE_REGULAR_CITIZENS: CitizenRef[] = FAKE_CITIZENS.filter((citizen: CitizenRef): boolean => !citizen.banned);

/**
 * Citoyens complets de test, alignés sur FAKE_CITIZENS : Alice fouineuse (Coin sieste 1), Bob éclaireur banni, Chloé technicienne.
 * @returns {Citizen[]} Citoyens.
 */
export function fakeFullCitizens(): Citizen[] {
    const jobs: JobEnum[] = [JobEnum.SCAVENGER, JobEnum.SCOUT, JobEnum.TECHNICIAN];
    return FAKE_CITIZENS.map((ref: CitizenRef, index: number): Citizen => {
        const citizen: Citizen = Object.assign(new Citizen(), { id: ref.userId, name: ref.name, is_shunned: ref.banned, is_dead: false, job: jobs[index], daily_actions: [] as DailyAction[] });
        citizen.home = Object.assign(new Home(), {
            content: [
                { element: HomeEnum.HOUSE_LEVEL, value: ref.homeLevel ?? 0 },
                { element: HomeEnum.REST_LEVEL, value: index === 0 ? 1 : 0 }
            ]
        });
        return citizen;
    });
}

/** Améliorations de maison de test. */
export const FAKE_UPGRADES: HomeUpgradeRef[] = [
    { key: 'kitchenLevel', label: 'Cuisine', max_level: 4, levels: [{ level: 1, ap: 6 }, { level: 2, ap: 3 }] },
    { key: 'hasLock', label: 'Verrou', max_level: 1, levels: [{ level: 1, ap: 6 }] }
];

/** Niveaux de maison de test. */
export const FAKE_HOMES: ReadonlyMap<number, HomeLevelRef> = new Map<number, HomeLevelRef>([
    [1, { level: 1, label: 'Zelt', def: 1, ap: 2, apUrbanism: 2, resources: [] }],
    [2, { level: 2, label: 'Baracke', def: 4, ap: 4, apUrbanism: 3, resources: [{ itemId: 5, count: 1 }] }]
]);

/**
 * Évaluation réelle d'un contenu de plan sur les chantiers de test.
 * @param {BuildingPlanContentDTO} content Contenu à évaluer.
 * @param {Partial<DayInput>} overrides Entrées à remplacer.
 * @returns {DayEvaluation} Évaluation de la journée.
 */
export function fakeEvaluation(content: BuildingPlanContentDTO, overrides: Partial<DayInput> = {}): DayEvaluation {
    const progress: Map<number, BuildingProgress> = new Map<number, BuildingProgress>([
        [1, { buildingId: 1, paCurrent: 40, invested: 10, built: false, life: 0, maxLife: 30, def: 0, defMax: 30 }],
        [2, { buildingId: 2, paCurrent: 20, invested: 0, built: false, life: 0, maxLife: 0, def: 0, defMax: 0 }],
        [3, { buildingId: 3, paCurrent: 10, invested: 10, built: true, life: 10, maxLife: 30, def: 5, defMax: 15 }]
    ]);
    return evaluateDay({
        content,
        buildings: FAKE_BUILDINGS,
        progress,
        workshopLevel: 0,
        hasSlavery: false,
        citizens: FAKE_CITIZENS,
        expeditionPa: new Map<number, number>(),
        bank: new Map<number, number>([[5, 1]]),
        itemValues: new Map<number, number>([[5, 2]]),
        attack: 1100,
        baseDefense: 1000,
        temporaryDefense: 0,
        homes: FAKE_HOMES,
        hardMode: false,
        ...overrides
    });
}

/** Doublure du store : signaux modifiables par le test et actions espionnées. */
export interface FakePlanningStore {
    store: PlanningStore;
    draft: WritableSignal<BuildingPlanContentDTO | null>;
    evaluation: WritableSignal<DayEvaluation | null>;
    can_edit: WritableSignal<boolean>;
    can_edit_settings: WritableSignal<boolean>;
    dirty: WritableSignal<boolean>;
    saving: WritableSignal<boolean>;
    loading: WritableSignal<boolean>;
    load_failed: WritableSignal<boolean>;
    conflict: WritableSignal<{ author: string | null } | null>;
    selected_plan: WritableSignal<BuildingPlanDTO | null>;
    plans_of_day: WritableSignal<BuildingPlanDTO[]>;
    is_citizen: WritableSignal<boolean>;
    synced_ids: WritableSignal<ReadonlySet<number>>;
    item_values: WritableSignal<ReadonlyMap<number, number>>;
    bank: WritableSignal<ReadonlyMap<number, number>>;
    items: WritableSignal<readonly Item[]>;
    catalog: WritableSignal<readonly Building[]>;
    selected_day: WritableSignal<number>;
    citizens: WritableSignal<CitizenRef[]>;
    citizens_full: WritableSignal<Citizen[]>;
    can_track: WritableSignal<boolean>;
    pending_checks: WritableSignal<ReadonlySet<string>>;
    displayable_actions: WritableSignal<DailyActionEnum[]>;
    home_upgrades: WritableSignal<HomeUpgradeRef[]>;
    actions: Record<'load' | 'selectDay' | 'selectPlan' | 'createPlan' | 'duplicatePlan' | 'deletePlan' | 'setEffective' | 'save' | 'dismissConflict' | 'saveItemValues' | 'renamePlan' | 'setTaskDone', Mock>;
    updateDraft: Mock<(mutate: (content: BuildingPlanContentDTO) => void) => void>;
}

/**
 * Crée une doublure de `PlanningStore` ; `updateDraft` applique réellement la mutation à la copie de travail.
 * @param {BuildingPlanContentDTO} content Copie de travail initiale.
 * @returns {FakePlanningStore} Doublure et accès à ses signaux.
 */
export function createFakeStore(content: BuildingPlanContentDTO = emptyPlanContent()): FakePlanningStore {
    const draft: WritableSignal<BuildingPlanContentDTO | null> = signal<BuildingPlanContentDTO | null>(content);
    const plan: BuildingPlanDTO = { id: 7, day: 10, name: 'Plan A', isEffective: true, version: 1, authorId: 9, authorName: 'Zerah', content, lastUpdateInfo: null };
    const fake: Omit<FakePlanningStore, 'store' | 'actions' | 'updateDraft'> = {
        draft,
        evaluation: signal<DayEvaluation | null>(fakeEvaluation(content)),
        can_edit: signal(true),
        can_edit_settings: signal(true),
        dirty: signal(false),
        saving: signal(false),
        loading: signal(false),
        load_failed: signal(false),
        conflict: signal<{ author: string | null } | null>(null),
        selected_plan: signal<BuildingPlanDTO | null>(plan),
        plans_of_day: signal<BuildingPlanDTO[]>([plan]),
        is_citizen: signal(true),
        synced_ids: signal<ReadonlySet<number>>(new Set<number>([1, 3])),
        item_values: signal<ReadonlyMap<number, number>>(new Map<number, number>([[5, 2]])),
        bank: signal<ReadonlyMap<number, number>>(new Map<number, number>([[5, 1]])),
        items: signal<readonly Item[]>([Object.assign(new Item(), { id: 5, uid: 'wood', label: { fr: 'Bois' }, img: 'item/item_wood.gif' })]),
        catalog: signal<readonly Building[]>(fakeCatalog()),
        selected_day: signal(10),
        citizens: signal<CitizenRef[]>(FAKE_CITIZENS),
        citizens_full: signal<Citizen[]>(fakeFullCitizens()),
        can_track: signal(true),
        pending_checks: signal<ReadonlySet<string>>(new Set<string>()),
        displayable_actions: signal<DailyActionEnum[]>(displayableDailyActions(new Set<string>(['small_gallery_#00', 'small_watchmen_#01']))),
        home_upgrades: signal<HomeUpgradeRef[]>(FAKE_UPGRADES)
    };
    const actions: FakePlanningStore['actions'] = {
        load: vi.fn(), selectDay: vi.fn(), selectPlan: vi.fn(), createPlan: vi.fn(), duplicatePlan: vi.fn(),
        deletePlan: vi.fn(), setEffective: vi.fn(), save: vi.fn(), dismissConflict: vi.fn(), saveItemValues: vi.fn(), renamePlan: vi.fn(), setTaskDone: vi.fn()
    };
    const update_draft: FakePlanningStore['updateDraft'] = vi.fn((mutate: (value: BuildingPlanContentDTO) => void): void => {
        const copy: BuildingPlanContentDTO = JSON.parse(JSON.stringify(draft())) as BuildingPlanContentDTO;
        mutate(copy);
        draft.set(copy);
        fake.dirty.set(true);
        fake.evaluation.set(fakeEvaluation(copy));
    });
    const edits: KeyedDebounce = new KeyedDebounce(400);
    const banned_pool_shown: Signal<boolean> = computed((): boolean =>
        bannedPoolShown(draft() ?? emptyPlanContent(), fake.citizens(), fake.evaluation()?.hasSlavery ?? false));
    const store: PlanningStore = {
        ...fake,
        ...actions,
        updateDraft: update_draft,
        deferEdit: (key: string, mutate: (value: BuildingPlanContentDTO) => void): void => edits.schedule(key, (): void => update_draft(mutate)),
        isPending: (user_id: number, task: PlanTaskDTO): boolean => fake.pending_checks().has(taskLockKey(user_id, task)),
        flushEdits: (): void => edits.flush(),
        current_day: 10,
        days: signal([10, 11, 12]),
        buildings: signal<ReadonlyMap<number, BuildingRef>>(FAKE_BUILDINGS),
        plannable_buildings: signal<BuildingRef[]>(Array.from(FAKE_BUILDINGS.values())),
        homes: signal<ReadonlyMap<number, HomeLevelRef>>(FAKE_HOMES),
        banned_pool_forced: computed((): boolean => bannedPoolForced(draft() ?? emptyPlanContent(), fake.citizens(), fake.evaluation()?.hasSlavery ?? false)),
        banned_pool_shown,
        visible_pools: computed((): PlanPool[] => banned_pool_shown() ? ['banned', 'regular'] : ['regular']),
        alerts: computed((): PlanAlert[] => {
            const evaluation: DayEvaluation | null = fake.evaluation();
            return evaluation === null ? [] : planAlerts(evaluation, FAKE_BUILDINGS, fake.citizens(), banned_pool_shown());
        }),
        toggle_context: computed((): ToggleContext | null => {
            const evaluation: DayEvaluation | null = fake.evaluation();
            return evaluation === null
                ? null
                : { parents: new Map<number, number | null>([[1, null], [2, null], [3, null]]), progress: evaluation.progressBefore, nightLoss: evaluation.nightLoss };
        })
    } as unknown as PlanningStore;
    return { store, ...fake, actions, updateDraft: update_draft };
}
