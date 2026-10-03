/**
 * Génère les données de référence du portage C# de l'affinage (RefinementParityTests) à partir du modèle TS
 * (attack-model.ts). À relancer après toute modification du modèle, depuis MyHordesOptimizerWebsite :
 * node scripts/generate-refinement-fixtures.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';

import {
    type DerivedRange,
    deriveValueRange,
    isReboundPossible,
    NO_CONSTRAINT,
    type OffsetConfig,
    offsetConfigs,
    offsetTrajectory,
    PhpMt,
    type RefinerParams
} from '../src/app/my-town/statistics/estimations/refiner/attack-model.ts';

/** Scénario planté : seed, configuration d'offsets et cibles qui produisent les saisies. */
interface PlantedScenario {
    name: string;
    params: RefinerParams;
    seed: number;
    base: number;
    sum: number;
    target_min: number;
    target_max: number;
    /** Cibles pré-explosion (feux d'artifice) : le planif les lit, la tour lit target_min/target_max. */
    pre_targets?: [number, number];
    tdg_rounds: number[];
    planif_rounds: number[];
    seeds: number[];
}

/** round() PHP pour x > 0. */
function phpRound(value: number): number {
    return Math.floor(value + 0.5);
}

/**
 * Configurations (somme, base) retenues pour un seed : chacune est rejouée seule, via un jeu de paramètres
 * sans rebound réduit à cette configuration (seul offsetConfigs lit off_sum/base_*_rand/rebound_possible).
 * @param observed Saisies.
 * @param seed Seed rejoué.
 * @param params Paramètres du jour.
 * @param observed_planif Saisies planif pré-explosion (feux d'artifice).
 */
function retainedConfigs(observed: Int32Array, seed: number, params: RefinerParams, observed_planif?: Int32Array): [number, number][] {
    const retained: [number, number][] = [];
    offsetConfigs(params).forEach((config: OffsetConfig): void => {
        for (let base: number = config.base_lo; base <= config.base_hi; base++) {
            const single: RefinerParams = { ...params, rebound_possible: false, off_sum: config.sum, base_lo_rand: base, base_hi_rand: base };
            if (deriveValueRange(observed, [seed], single, observed_planif).values.length > 0) {
                retained.push([config.sum, base]);
            }
        }
    });
    return retained;
}

/** Seeds consécutifs (uint32). */
function seedBlock(first: number, count: number): number[] {
    return Array.from({ length: count }, (_value: unknown, index: number): number => (first + index) >>> 0);
}

/** Seed planté, deux seeds lointains et 41 voisins. */
function around(seed: number): number[] {
    return [seed, 12345, 4000000000, ...seedBlock(seed - 20, 41)];
}

/** Saisies d'une famille : tour (slots 0..49, exact) ou planif (slots 50..99, min floor / max ceil au bloc). */
function fillRows(observed: Int32Array, trajectory: [number, number][], rounds: number[], target_min: number, target_max: number, params: RefinerParams, planif: boolean): void {
    rounds.forEach((q: number): void => {
        const factor: number = planif ? params.soul_planif[q] : params.soul_tdg[q];
        const min: number = phpRound((target_min - target_min * trajectory[q][0] / 100) * factor);
        const max: number = phpRound((target_max + target_max * trajectory[q][1] / 100) * factor);
        if (planif) {
            observed[50 + q] = Math.floor(min / params.blocks) * params.blocks;
            observed[75 + q] = Math.ceil(max / params.blocks) * params.blocks;
        } else {
            observed[q] = min;
            observed[25 + q] = max;
        }
    });
}

const day16: RefinerParams = {
    base_lo_rand: 4, base_hi_rand: 20, off_sum: 21, protect: 3, blocks: 20,
    soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
    shift_span: 0.075, shift_steps: 750, min_global: 2860, max_global: 4096, rebound_possible: true, fireworks: false
};

const scenarios: PlantedScenario[] = [
    { name: 'j16-planted', params: day16, seed: 777001, base: 10, sum: 21, target_min: 3638, target_max: 3919, tdg_rounds: [8, 12, 16, 20, 24], planif_rounds: [0], seeds: around(777001) },
    {
        name: 'j9-factor1', params: { ...day16, base_lo_rand: 5, base_hi_rand: 26, off_sum: 28, blocks: 10, shift_span: 0.1, shift_steps: 1000, min_global: 1367, max_global: 2148 },
        seed: 3141592653, base: 17, sum: 28, target_min: 1710, target_max: 1890, tdg_rounds: [0, 4, 9, 15, 22], planif_rounds: [0, 9], seeds: around(3141592653)
    },
    {
        name: 'j16-souls',
        params: { ...day16, soul_tdg: Array.from({ length: 25 }, (_value: unknown, q: number): number => 1 + 0.04 * (q % 3)), soul_planif: new Array<number>(25).fill(1.04), soul_attack: 1.04 },
        seed: 2718281828, base: 6, sum: 21, target_min: 3638, target_max: 3919, tdg_rounds: [3, 10, 18], planif_rounds: [0, 12], seeds: around(2718281828)
    },
    {
        name: 'j41-no-rebound', params: { ...day16, base_lo_rand: 1, base_hi_rand: 4, off_sum: 4, protect: 1, blocks: 45, shift_span: 0.015, shift_steps: 150, min_global: 9000, max_global: 12000, rebound_possible: false },
        seed: 4000000001, base: 4, sum: 4, target_min: 10074, target_max: 10226, tdg_rounds: [0, 6, 14, 24], planif_rounds: [0], seeds: around(4000000001)
    },
    {
        name: 'j16-fireworks', params: { ...day16, fireworks: true }, seed: 777001, base: 10, sum: 21, target_min: 3113, target_max: 3394, pre_targets: [3638, 3919],
        tdg_rounds: [8, 12, 16, 20, 24], planif_rounds: [0, 8], seeds: [777001, 777000, 12345]
    },
    { name: 'j16-weak', params: day16, seed: 777001, base: 10, sum: 21, target_min: 3638, target_max: 3919, tdg_rounds: [8, 9], planif_rounds: [], seeds: seedBlock(776941, 120) }
];

const output: unknown[] = scenarios.map((scenario: PlantedScenario): unknown => {
    const trajectory: [number, number][] = offsetTrajectory(new PhpMt(), scenario.base, scenario.sum - scenario.base, scenario.seed);
    const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
    fillRows(observed, trajectory, scenario.tdg_rounds, scenario.target_min, scenario.target_max, scenario.params, false);
    let observed_planif: Int32Array | undefined;
    if (scenario.pre_targets !== undefined) {
        observed_planif = new Int32Array(100).fill(NO_CONSTRAINT);
        fillRows(observed_planif, trajectory, scenario.planif_rounds, scenario.pre_targets[0], scenario.pre_targets[1], scenario.params, true);
    } else {
        fillRows(observed, trajectory, scenario.planif_rounds, scenario.target_min, scenario.target_max, scenario.params, true);
    }
    const seeds: unknown[] = scenario.seeds.map((seed: number): unknown => {
        const derived: DerivedRange = deriveValueRange(observed, [seed], scenario.params, observed_planif);
        return {
            seed, values: derived.values, reductionMin: derived.reduction?.min ?? null, reductionMax: derived.reduction?.max ?? null,
            configs: retainedConfigs(observed, seed, scenario.params, observed_planif)
        };
    });
    console.log(`${scenario.name} : ${seeds.length} seeds`);
    return {
        name: scenario.name,
        observed: [...observed],
        observedPlanif: observed_planif !== undefined ? [...observed_planif] : null,
        params: scenario.params,
        reboundPossible: isReboundPossible(observed, scenario.params),
        seeds
    };
});

const target: URL = new URL('../../MyHordesOptimizerApi/MyHordesOptimizerApiUnitTests/Estimations/Refinement/refinement-fixtures.json', import.meta.url);
mkdirSync(new URL('.', target), { recursive: true });
writeFileSync(target, JSON.stringify(output));
