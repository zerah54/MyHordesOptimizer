import { computed, Signal, signal, WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

import { BuildingPlanDTO } from '../buildings/planning/plan.types';
import { PlanConflict, PlanLockState, PlanSaveState } from '../buildings/planning/planning.store';
import { WatcherGap } from './nightwatch-compare.util';
import { PlannedBuildings } from './nightwatch-planned-buildings.util';
import { StockLine } from './nightwatch-stock.util';
import { NightwatchStore, NightwatchTotals, NightwatchWatcherRow, SimulationDayView } from './nightwatch.store';
import {
    emptyNightwatchContent,
    NightwatchCitizenStateDTO,
    NightwatchPlanContentDTO,
    NightwatchPlanDTO,
    NightwatchReferentialDTO,
    NightwatchSimulationDTO,
    NightwatchStateDTO
} from './nightwatch.types';

/** Actions du store, espionnées. */
type FakeAction = 'load' | 'selectDay' | 'selectPlan' | 'createPlan' | 'duplicatePlan' | 'renamePlan' | 'deletePlan' | 'setEffective' | 'addWatcher'
    | 'removeWatcher' | 'setItem' | 'toggleStatus' | 'setPastWatches' | 'setDiscourse' | 'setInstructions' | 'setAttackOverride' | 'save' | 'dismissConflict'
    | 'takeLock' | 'leave' | 'updateDraft' | 'setManualStock' | 'copyItems' | 'pasteItems' | 'copyPlanFromDay' | 'copyPlanBetweenDays' | 'setBuildingPlan' | 'enduranceLevel'
    | 'selectSimulation' | 'createSimulation' | 'renameSimulation' | 'setSimulationLastDay' | 'setSimulationStock' | 'clearSimulationStock' | 'duplicateSimulation' | 'deleteSimulation'
    | 'setCityDefense' | 'setGlobalItem' | 'setAllowedOverflow' | 'setAttackReduction' | 'setReactorDamage';

/** Doublure du store : signaux modifiables par le test et actions espionnées. */
export interface FakeNightwatchStore {
    store: NightwatchStore;
    draft: WritableSignal<NightwatchPlanContentDTO | null>;
    state: WritableSignal<NightwatchStateDTO | null>;
    referential: WritableSignal<NightwatchReferentialDTO | null>;
    watcher_rows: WritableSignal<NightwatchWatcherRow[]>;
    totals: WritableSignal<NightwatchTotals | null>;
    estimated_attack: WritableSignal<number | null>;
    stock_lines: WritableSignal<StockLine[]>;
    gaps: WritableSignal<WatcherGap[]>;
    over_cap: WritableSignal<boolean>;
    can_edit: WritableSignal<boolean>;
    can_write: WritableSignal<boolean>;
    can_create: WritableSignal<boolean>;
    can_edit_simulations: WritableSignal<boolean>;
    selected_day: WritableSignal<number>;
    selected_plan: WritableSignal<NightwatchPlanDTO | null>;
    plans_of_day: WritableSignal<NightwatchPlanDTO[]>;
    lock: WritableSignal<PlanLockState>;
    conflict: WritableSignal<PlanConflict | null>;
    save_state: WritableSignal<PlanSaveState>;
    loading: WritableSignal<boolean>;
    copied_items: WritableSignal<Record<number, number> | null>;
    building_plans_of_day: WritableSignal<BuildingPlanDTO[]>;
    planned_buildings: WritableSignal<PlannedBuildings | null>;
    load_failed: WritableSignal<boolean>;
    simulations: WritableSignal<NightwatchSimulationDTO[]>;
    selected_simulation_id: WritableSignal<number | null>;
    simulation_days: WritableSignal<SimulationDayView[]>;
    actions: Record<FakeAction, Mock>;
}

/** État réel de test : Alice et Chloé vivantes, Bob banni. */
export const FAKE_NIGHTWATCH_STATE: NightwatchStateDTO = {
    citizens: [
        { userId: 1, name: 'Alice', jobUid: 'shield', isShunned: false, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false, bag: {}, bagBroken: {}, chest: {}, chestBroken: {} },
        { userId: 2, name: 'Bob', jobUid: null, isShunned: true, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false, bag: {}, bagBroken: {}, chest: {}, chestBroken: {} },
        { userId: 3, name: 'Chloé', jobUid: 'vest', isShunned: false, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false, bag: {}, bagBroken: {}, chest: {}, chestBroken: {} }
    ],
    bank: {}, bankBroken: {}, desert: {}, desertBroken: {}, roundPathLevel: 1, hasGuardRoom: false, hasSprinkler: false, builtBuildingUids: [], townIsPanda: false, pastWatches: {}
};

/**
 * Crée une doublure de `NightwatchStore` ; `updateDraft` n'est pas simulé : les tests vérifient les appels des actions.
 * @param {NightwatchPlanContentDTO} content Copie de travail initiale.
 * @returns {FakeNightwatchStore} Doublure et accès à ses signaux.
 */
export function createFakeNightwatchStore(content: NightwatchPlanContentDTO = emptyNightwatchContent()): FakeNightwatchStore {
    const plan: NightwatchPlanDTO = { id: 7, day: 10, name: 'Plan A', isEffective: true, version: 1, authorId: 9, authorName: 'Zerah', content, lastUpdateInfo: null };
    const can_write: WritableSignal<boolean> = signal(true);
    const lock: WritableSignal<PlanLockState> = signal<PlanLockState>({ kind: 'free' });
    const fake: Omit<FakeNightwatchStore, 'store' | 'actions'> = {
        draft: signal<NightwatchPlanContentDTO | null>(content),
        state: signal<NightwatchStateDTO | null>(FAKE_NIGHTWATCH_STATE),
        referential: signal<NightwatchReferentialDTO | null>(null),
        watcher_rows: signal<NightwatchWatcherRow[]>([]),
        totals: signal<NightwatchTotals | null>(null),
        estimated_attack: signal<number | null>(null),
        stock_lines: signal<StockLine[]>([]),
        gaps: signal<WatcherGap[]>([]),
        over_cap: signal(false),
        can_write,
        can_edit: signal(true),
        can_create: signal(false),
        can_edit_simulations: signal(true),
        selected_day: signal(10),
        selected_plan: signal<NightwatchPlanDTO | null>(plan),
        plans_of_day: signal<NightwatchPlanDTO[]>([plan]),
        lock,
        conflict: signal<PlanConflict | null>(null),
        save_state: signal<PlanSaveState>('idle'),
        copied_items: signal<Record<number, number> | null>(null),
        building_plans_of_day: signal<BuildingPlanDTO[]>([]),
        planned_buildings: signal<PlannedBuildings | null>(null),
        loading: signal(false),
        load_failed: signal(false),
        simulations: signal<NightwatchSimulationDTO[]>([]),
        selected_simulation_id: signal<number | null>(null),
        simulation_days: signal<SimulationDayView[]>([])
    };
    const names: FakeAction[] = ['load', 'selectDay', 'selectPlan', 'createPlan', 'duplicatePlan', 'renamePlan', 'deletePlan', 'setEffective', 'addWatcher',
        'removeWatcher', 'setItem', 'toggleStatus', 'setPastWatches', 'setDiscourse', 'setInstructions', 'setAttackOverride', 'save', 'dismissConflict', 'takeLock', 'leave',
        'updateDraft', 'setManualStock', 'copyItems', 'pasteItems', 'copyPlanFromDay', 'copyPlanBetweenDays', 'setBuildingPlan', 'enduranceLevel',
        'selectSimulation', 'createSimulation', 'renameSimulation', 'setSimulationLastDay', 'setSimulationStock', 'clearSimulationStock', 'duplicateSimulation', 'deleteSimulation',
        'setCityDefense', 'setGlobalItem', 'setAllowedOverflow', 'setAttackReduction', 'setReactorDamage'];
    const actions: Record<FakeAction, Mock> = Object.fromEntries(names.map((name: FakeAction): [FakeAction, Mock] => [name, vi.fn()])) as Record<FakeAction, Mock>;
    actions.leave.mockImplementation((): Promise<boolean> => Promise.resolve(true));
    actions.enduranceLevel.mockReturnValue(null);
    const days: Signal<number[]> = computed((): number[] => [10, 11, 12]);
    const citizenState: (user_id: number) => NightwatchCitizenStateDTO | undefined = (user_id: number): NightwatchCitizenStateDTO | undefined =>
        fake.state()?.citizens.find((citizen: NightwatchCitizenStateDTO): boolean => citizen.userId === user_id);
    const isGhoul: (user_id: number) => boolean = (user_id: number): boolean => citizenState(user_id)?.isGhoul === true;
    const store: NightwatchStore = { ...fake, ...actions, citizenState, isGhoul, current_day: 10, days, plans: computed((): NightwatchPlanDTO[] => fake.plans_of_day()) } as unknown as NightwatchStore;
    return { store, ...fake, actions };
}
