import {
    attackFromValue,
    deriveValueRange,
    feasibleConfigs,
    lastConstrainedRound,
    NO_CONSTRAINT,
    OffsetPair,
    offsetTrajectory,
    PhpMt,
    RefinerParams,
    scanSeedRangeCpu
} from './attack-model';

/** round() PHP pour x > 0. */
const phpRound: (x: number) => number = (x: number): number => Math.floor(x + 0.5);

const SEED: number = 777001;
const OFF_MIN_BASE: number = 10;
const OFF_SUM: number = 21;
const VALUE: number = 3750;
// shift_min = 300/10⁴ : cibles round(V·(1−0,03)) et round(V·(1+0,075−0,03)).
const TARGET_MIN: number = phpRound(VALUE - VALUE * 0.03);
const TARGET_MAX: number = phpRound(VALUE + VALUE * 0.045);
const QS: number[] = [8, 12, 16, 20, 24];

/** Paramètres du jour 16 (facteur 0,75), sans âme. */
function day16Params(): RefinerParams {
    return {
        base_lo_rand: 4, base_hi_rand: 20, off_sum: OFF_SUM, protect: 3, blocks: 20,
        soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
        shift_span: 0.075, shift_steps: 750,
        min_global: 2860, max_global: 4096, rebound_possible: true, fireworks: false
    };
}

/**
 * Lignes que le jeu afficherait pour (SEED, VALUE) : `round((t − t·o/100)·pf)` pour la tour (slots 0..49),
 * même valeur puis floor/ceil au bloc pour le planif (slots 50..99). `pf_tdg`/`pf_planif` : facteur par palier q.
 */
function observedRows(pf_tdg: (q: number) => number, pf_planif: (q: number) => number, blocks: number): Int32Array {
    const traj: [number, number][] = offsetTrajectory(new PhpMt(), OFF_MIN_BASE, OFF_SUM - OFF_MIN_BASE, SEED);
    const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
    QS.forEach((q: number): void => {
        const [o_min, o_max]: [number, number] = traj[q];
        observed[q] = phpRound((TARGET_MIN - TARGET_MIN * o_min / 100) * pf_tdg(q));
        observed[25 + q] = phpRound((TARGET_MAX + TARGET_MAX * o_max / 100) * pf_tdg(q));
        const planif_min: number = phpRound((TARGET_MIN - TARGET_MIN * o_min / 100) * pf_planif(q));
        const planif_max: number = phpRound((TARGET_MAX + TARGET_MAX * o_max / 100) * pf_planif(q));
        observed[50 + q] = Math.floor(planif_min / blocks) * blocks;
        observed[75 + q] = Math.ceil(planif_max / blocks) * blocks;
    });
    return observed;
}

describe('attack-model sans âme', (): void => {
    it('finds the seed and keeps the true value among the derived values', (): void => {
        const params: RefinerParams = day16Params();
        const observed: Int32Array = observedRows((): number => 1, (): number => 1, params.blocks);

        const hits: number[] = scanSeedRangeCpu(observed, params, SEED - 25, 50);
        const derived: number[] = deriveValueRange(observed, [SEED], params).values;

        expect(hits).toContain(SEED);
        expect(derived).toContain(VALUE);
    });
});

/**
 * Au-delà du dernier palier renseigné, aucune contrainte ne peut plus élaguer une branche (aucun
 * effet observable) : le DFS/la trajectoire peuvent s'arrêter là plutôt que d'aller jusqu'à 24,
 * sans jamais changer le résultat (voir attack-model.ts, trajectoryCompatible).
 */
describe('lastConstrainedRound', (): void => {
    it('returns 24 when the full tower is filled', (): void => {
        const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
        observed[24] = 1000;
        expect(lastConstrainedRound(observed)).toBe(24);
    });

    it('returns the highest q with a TDG, planif min or planif max constraint', (): void => {
        const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
        observed[16] = 1000; // TDG min q=16
        observed[75 + 8] = 2000; // planif max q=8
        expect(lastConstrainedRound(observed)).toBe(16);
    });

    it('falls back to 24 when nothing is filled (no scan would run in practice, but stays safe)', (): void => {
        expect(lastConstrainedRound(new Int32Array(100).fill(NO_CONSTRAINT))).toBe(24);
    });
});

describe('attack-model — saisie partielle (tour non terminée)', (): void => {
    it('still finds the seed when no data is entered past the last filled palier', (): void => {
        const params: RefinerParams = day16Params();
        // Contraintes uniquement jusqu'à q=12 (QS tronqué) : le DFS doit s'arrêter la, pas planter/rater le seed.
        const traj: [number, number][] = offsetTrajectory(new PhpMt(), OFF_MIN_BASE, OFF_SUM - OFF_MIN_BASE, SEED);
        const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
        [8, 12].forEach((q: number): void => {
            const [o_min, o_max]: [number, number] = traj[q];
            observed[q] = phpRound(TARGET_MIN - TARGET_MIN * o_min / 100);
            observed[25 + q] = phpRound(TARGET_MAX + TARGET_MAX * o_max / 100);
        });

        expect(lastConstrainedRound(observed)).toBe(12);
        expect(scanSeedRangeCpu(observed, params, SEED - 25, 50)).toContain(SEED);
    });
});

describe('attack-model avec âmes', (): void => {
    const PF_1: number = 1.04;

    function paramsWith(soul_tdg: number, soul_planif: number, soul_attack: number): RefinerParams {
        return {
            ...day16Params(),
            soul_tdg: new Array<number>(25).fill(soul_tdg),
            soul_planif: new Array<number>(25).fill(soul_planif),
            soul_attack
        };
    }

    it('finds the seed when the tower rows carry one soul and the planif rows none', (): void => {
        const params: RefinerParams = paramsWith(PF_1, 1, PF_1);
        const observed: Int32Array = observedRows((): number => PF_1, (): number => 1, params.blocks);

        expect(scanSeedRangeCpu(observed, params, SEED - 25, 50)).toContain(SEED);
        expect(deriveValueRange(observed, [SEED], params).values).toContain(VALUE);
    });

    it('rejects the seed when the declared factors do not match the rows', (): void => {
        const wrong: RefinerParams = paramsWith(1, 1, 1);
        const observed: Int32Array = observedRows((): number => PF_1, (): number => 1, wrong.blocks);

        expect(deriveValueRange(observed, [SEED], wrong).values).not.toContain(VALUE);
    });

    it('converts a derived value into the real attack with the attack soul factor', (): void => {
        expect(attackFromValue(3750, paramsWith(1, 1, 1.04))).toBe(3900);
        expect(attackFromValue(3750, paramsWith(1, 1, 1))).toBe(3750);
    });
});

/** Seed planté, config génératrice et saisie simulée pour les tests du filtre de paires d'offsets. */
interface PlantedScenario {
    params: RefinerParams;
    seed: number;
    sum: number;
    base: number;
    target_min: number;
    target_max: number;
    tdg_rounds: number[];
    planif_rounds: number[];
}

/**
 * Saisie que le jeu afficherait pour le scénario : formule directe `round((t − t·o/100)·pf)` (tour),
 * même valeur puis floor/ceil au bloc (planif).
 */
function plantedObserved(scenario: PlantedScenario): Int32Array {
    const { params, seed, sum, base, target_min, target_max }: PlantedScenario = scenario;
    const traj: [number, number][] = offsetTrajectory(new PhpMt(), base, sum - base, seed);
    const observed: Int32Array = new Int32Array(100).fill(NO_CONSTRAINT);
    scenario.tdg_rounds.forEach((q: number): void => {
        observed[q] = phpRound((target_min - target_min * traj[q][0] / 100) * params.soul_tdg[q]);
        observed[25 + q] = phpRound((target_max + target_max * traj[q][1] / 100) * params.soul_tdg[q]);
    });
    scenario.planif_rounds.forEach((q: number): void => {
        const planif_min: number = phpRound((target_min - target_min * traj[q][0] / 100) * params.soul_planif[q]);
        const planif_max: number = phpRound((target_max + target_max * traj[q][1] / 100) * params.soul_planif[q]);
        observed[50 + q] = Math.floor(planif_min / params.blocks) * params.blocks;
        observed[75 + q] = Math.ceil(planif_max / params.blocks) * params.blocks;
    });
    return observed;
}

/** true si la liste contient la config (somme, base). */
function containsPair(pairs: OffsetPair[], sum: number, base: number): boolean {
    return pairs.some((pair: OffsetPair): boolean => pair.sum === sum && pair.base === base);
}

/**
 * Filtre par paires d'offsets : élimine AVANT le scan les configs (somme, base) pour lesquelles aucune
 * trajectoire ne peut satisfaire les paliers saisis. Contrainte absolue : la config génératrice du
 * vrai seed n'est JAMAIS éliminée (zéro faux négatif) ; budget épuisé ⇒ config gardée (fail-open).
 */
describe('feasibleConfigs', (): void => {
    const day16: PlantedScenario = {
        params: day16Params(), seed: SEED, sum: OFF_SUM, base: OFF_MIN_BASE, target_min: TARGET_MIN, target_max: TARGET_MAX,
        tdg_rounds: QS, planif_rounds: [0]
    };
    const day9Factor1: PlantedScenario = {
        params: {
            base_lo_rand: 5, base_hi_rand: 26, off_sum: 28, protect: 3, blocks: 10,
            soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
            shift_span: 0.1, shift_steps: 1000, min_global: 1367, max_global: 2148, rebound_possible: true, fireworks: false
        },
        seed: 3141592653, sum: 28, base: 17, target_min: 1710, target_max: 1890, tdg_rounds: [0, 4, 9, 15, 22], planif_rounds: [0, 9]
    };
    const day16Souls: PlantedScenario = {
        ...day16,
        params: {
            ...day16Params(),
            soul_tdg: Array.from({ length: 25 }, (_value: unknown, q: number): number => 1 + 0.04 * (q % 3)),
            soul_planif: new Array<number>(25).fill(1.04)
        },
        seed: 2718281828, base: 6, tdg_rounds: [3, 10, 18], planif_rounds: [0, 12]
    };
    const day41NoRebound: PlantedScenario = {
        params: {
            base_lo_rand: 1, base_hi_rand: 4, off_sum: 4, protect: 1, blocks: 45,
            soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
            shift_span: 0.015, shift_steps: 150, min_global: 9000, max_global: 12000, rebound_possible: false, fireworks: false
        },
        seed: 4000000001, sum: 4, base: 4, target_min: 10100, target_max: 10200, tdg_rounds: [0, 6, 14, 24], planif_rounds: [0]
    };
    const day16NoRound0: PlantedScenario = { ...day16, tdg_rounds: [8, 12, 16, 20, 24], planif_rounds: [] };

    const cases: [string, PlantedScenario][] = [
        ['day 16, factor 0.75, planif _0 + TDG', day16],
        ['day 9, factor 1', day9Factor1],
        ['day 16 with souls varying per palier', day16Souls],
        ['day 41, factor 0.15, rebound impossible (offMax0 = 0)', day41NoRebound],
        ['day 16 without any q=0 palier', day16NoRound0]
    ];
    cases.forEach(([label, scenario]: [string, PlantedScenario]): void => {
        it(`keeps the generating config: ${label}`, (): void => {
            const observed: Int32Array = plantedObserved(scenario);
            expect(scanSeedRangeCpu(observed, scenario.params, scenario.seed, 1)).toEqual([scenario.seed]);
            expect(containsPair(feasibleConfigs(observed, scenario.params), scenario.sum, scenario.base)).toBe(true);
        });
    });

    it('eliminates most configs on the day-16 reference scenario (behaviour snapshot)', (): void => {
        const kept: OffsetPair[] = feasibleConfigs(plantedObserved(day16), day16.params);
        // 44/50 éliminées (mesuré) ; seule la survie de la config génératrice est une exigence.
        expect(kept.length).toBe(6);
    });

    it('keeps every config when the budget is exhausted (fail-open)', (): void => {
        const observed: Int32Array = plantedObserved(day16NoRound0);
        const all: OffsetPair[] = feasibleConfigs(new Int32Array(100).fill(NO_CONSTRAINT), day16.params);
        expect(all.length).toBe(50);
        expect(feasibleConfigs(observed, day16.params).length).toBeLessThan(all.length);
        expect(feasibleConfigs(observed, day16.params, 0)).toEqual(all);
    });
});

/**
 * Le shader WGSL (attack-refiner.service.ts) ne twiste que les 160 premiers éléments MT19937
 * (une trajectoire n'en consomme jamais plus) — déjà validé bit-exact vs PHP en production. Le
 * mode bloc CPU doit reproduire la MÊME troncature (parité GPU, ~4x moins de travail par seed).
 */
describe('PhpMt mode bloc — budget MT19937 tronqué (parité GPU)', (): void => {
    const BUDGET: number = 160;

    it('produces the same draw sequence as the untruncated path for the first 160 outputs', (): void => {
        const reference: PhpMt = new PhpMt();
        reference.seed(SEED);
        const expected: number[] = [];
        for (let i: number = 0; i < BUDGET; i++) {
            expected.push(reference.rand(0, 99));
        }

        const block: PhpMt = new PhpMt();
        block.prepareBlock(SEED);
        block.startTrajectory();
        const actual: number[] = [];
        for (let i: number = 0; i < BUDGET; i++) {
            actual.push(block.randBlock(0, 99));
        }

        expect(actual).toEqual(expected);
        expect(block.blockOverflow).toBe(false);
    });

    it('flags overflow only once the 161st raw draw is requested', (): void => {
        const mt: PhpMt = new PhpMt();
        mt.prepareBlock(SEED);
        mt.startTrajectory();
        // rand(0,0) consomme toujours exactement 1 tirage brut (pas de rejet possible).
        for (let i: number = 0; i < BUDGET; i++) {
            mt.randBlock(0, 0);
        }
        expect(mt.blockOverflow).toBe(false);

        mt.randBlock(0, 0);
        expect(mt.blockOverflow).toBe(true);
    });
});
