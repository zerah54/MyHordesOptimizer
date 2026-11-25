import { NightwatchPlanContentDTO, NightwatchPlanDTO } from './nightwatch.types';
import {
    attackGoal,
    cityDefenseTotal,
    CityDefenseValues,
    offeredCapacity,
    remainingStock,
    remainingToCover,
    resolvedCityDefense,
    simulationPastWatches,
    verdict
} from './nightwatch-simulation.util';

const PREFILL: CityDefenseValues = {
    wall: 1, bankDefenseItems: 2, fddCoefficient: 3, buildings: 4, upgrades: 5, homes: 6, guardians: 7,
    guardTowerPa: 8, eveningVote: 9, cemetery: 10, souls: 11, dumpContribution: 12, adLevel: 0
};

function plan(day: number, content: Partial<NightwatchPlanContentDTO> = {}): NightwatchPlanDTO {
    return {
        id: day, day, name: 'p', isEffective: false, version: 1, authorId: 1,
        content: { watchers: [], manualStock: {}, ...content }
    };
}

describe('nightwatch-simulation.util', (): void => {
    it('reste à couvrir : objectif arrondi au supérieur moins les postes', (): void => {
        const defense: CityDefenseValues = {
            wall: 10, bankDefenseItems: 506, fddCoefficient: 3, buildings: 3335, upgrades: 366, homes: 1383,
            guardians: 35, guardTowerPa: 110, eveningVote: 35, cemetery: 0, souls: 0, dumpContribution: 0, adLevel: 3
        };
        const posts: number = 10 + 506 * 3 + 3335 + 366 + 1383 + 35 + 110 + 35;
        expect(posts).toBe(6792);
        const content: NightwatchPlanContentDTO = {
            watchers: [], manualStock: {}, allowedOverflow: 275, attackReductionPercent: 0, reactorDamage: 0
        };
        expect(remainingToCover(8775, defense, content)).toBe(Math.ceil(8500 / 1.13) - posts);
        expect(remainingToCover(8775, defense, content)).toBe(731);
    });

    it('sans AD (-1) : coefficient nul ; réduction et réacteur appliqués', (): void => {
        const defense: CityDefenseValues = { ...PREFILL, wall: 0, bankDefenseItems: 0, buildings: 0, upgrades: 0, homes: 0,
                                             guardians: 0, guardTowerPa: 0, eveningVote: 0, cemetery: 0, souls: 0, dumpContribution: 0, adLevel: -1 };
        const content: NightwatchPlanContentDTO = { watchers: [], manualStock: {}, attackReductionPercent: 10, reactorDamage: 50 };
        expect(remainingToCover(1000, defense, content)).toBe(950);
    });

    it('objectif hors AD et total des postes : les deux termes du reste à couvrir', (): void => {
        const defense: CityDefenseValues = { ...PREFILL, adLevel: 3 };
        const content: NightwatchPlanContentDTO = { watchers: [], manualStock: {}, attackReductionPercent: 10, allowedOverflow: 25, reactorDamage: 50 };
        expect(attackGoal(1000, defense.adLevel, content)).toBe(Math.ceil(925 / 1.13));
        expect(cityDefenseTotal(PREFILL)).toBe(1 + 2 * 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12);
        expect(remainingToCover(1000, defense, content)).toBe(attackGoal(1000, 3, content) - cityDefenseTotal(defense));
    });

    it('chaîne jour par jour, prefill si tout est nul', (): void => {
        const days: NightwatchPlanDTO[] = [
            plan(1, { cityDefense: { wall: 20 } }), plan(2), plan(3, { cityDefense: { wall: 30 } })
        ];
        expect(resolvedCityDefense(days, PREFILL).map((d: CityDefenseValues): number => d.wall)).toEqual([20, 20, 30]);
        expect(resolvedCityDefense(days, PREFILL)[1].homes).toBe(6);
        expect(resolvedCityDefense([plan(1), plan(2)], PREFILL)).toEqual([PREFILL, PREFILL]);
    });

    it('pré-remplissage par jour : suivi tant que rien n\'est saisi, une saisie se reporte ensuite', (): void => {
        const prefills: CityDefenseValues[] = [PREFILL, { ...PREFILL, buildings: 34 }, { ...PREFILL, buildings: 64 }];
        const buildings: (days: NightwatchPlanDTO[]) => number[] = (days: NightwatchPlanDTO[]): number[] =>
            resolvedCityDefense(days, prefills).map((d: CityDefenseValues): number => d.buildings);
        expect(buildings([plan(1), plan(2), plan(3)])).toEqual([4, 34, 64]);
        expect(buildings([plan(1), plan(2, { cityDefense: { buildings: 50 } }), plan(3)])).toEqual([4, 50, 50]);
    });

    it('fatigue : veilles passées de la simulation', (): void => {
        const watch = (user_id: number): NightwatchPlanContentDTO['watchers'][number] =>
            ({ userId: user_id, statuses: [], items: {}, hasDiscourse: false });
        const days: NightwatchPlanDTO[] = [
            plan(10, { watchers: [watch(3), watch(4)] }), plan(11, { watchers: [watch(3)] }), plan(12, { watchers: [watch(3)] })
        ];
        expect(simulationPastWatches(days, 12, 3, 4, 10)).toBe(6);
        expect(simulationPastWatches(days, 12, 4, 0, 10)).toBe(1);
    });

    it('fatigue : jour courant avancé, les jours passés de la simulation sont déjà dans le réel', (): void => {
        const watch = (user_id: number): NightwatchPlanContentDTO['watchers'][number] =>
            ({ userId: user_id, statuses: [], items: {}, hasDiscourse: false });
        const days: NightwatchPlanDTO[] = [plan(10, { watchers: [watch(1)] }), plan(11, { watchers: [watch(1)] }), plan(12)];
        expect(simulationPastWatches(days, 11, 1, 1, 11)).toBe(1);
        expect(simulationPastWatches(days, 12, 1, 1, 11)).toBe(2);
    });

    it('stock restant : retire les usages uniques des jours antérieurs, plancher 0', (): void => {
        const days: NightwatchPlanDTO[] = [plan(10, { globalItems: { 5: 3, 6: 1 } }), plan(11)];
        const single: ReadonlySet<number> = new Set<number>([5]);
        expect(remainingStock({ 5: 10, 6: 4 }, days, 11, single)).toEqual({ 5: 7, 6: 4 });
        expect(remainingStock({ 5: 2 }, days, 11, single)).toEqual({ 5: 0 });
        expect(remainingStock({}, days, 11, single)).toEqual({});
        expect(remainingStock({ 5: 10 }, days, 10, single)).toEqual({ 5: 10 });
    });

    it('places offertes : niveau inconnu, encombrants, Gardien', (): void => {
        expect(offeredCapacity([
            { endurance_level: 4, item_uids: ['bag_#00'], is_guardian: false },
            { endurance_level: null, item_uids: [], is_guardian: false }
        ])).toEqual({ slots: 9 + 4, slots_known: false, heavy: 2 });
        expect(offeredCapacity([{ endurance_level: 0, item_uids: [], is_guardian: true }]))
            .toEqual({ slots: 4, slots_known: true, heavy: 2 });
    });

    it('verdict', (): void => {
        expect(verdict(226, 229, 160).covered).toBe(true);
        expect(verdict(500, 229, 160)).toEqual({ covered: false, missing_watchers: 2 });
        expect(verdict(500, 229, 0)).toEqual({ covered: false, missing_watchers: null });
    });
});
