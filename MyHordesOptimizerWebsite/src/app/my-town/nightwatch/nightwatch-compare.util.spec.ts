import { compareTotals, compareWatchers, WatcherGap } from './nightwatch-compare.util';
import { NightwatchContext, PlannedWatcher, RealWatcher } from './nightwatch-model.util';
import { NightwatchItemDefDTO, NightwatchReferentialDTO } from './nightwatch.types';

const ARMORY: string = 'small_armor_#00';
const DOOR: number = 10;

function def(patch: Partial<NightwatchItemDefDTO>): NightwatchItemDefDTO {
    return {
        defense: 0, usage: 'single', repairPa: 0, repairPaSource: '', isEssential: false,
        batteries: 0, water: 0, watchImpact: 0, cumulative: false, source: 'game', ...patch
    };
}

function ctx(): NightwatchContext {
    const referential: NightwatchReferentialDTO = {
        baseRisk: 0.08, fatigue: [0], fatiguePro: [0],
        statuses: { drugged: { defense: 10, deathRisk: 0, source: 'game' } },
        items: { [DOOR]: def({ defense: 25, watchImpact: 0.1 }), 11: def({ defense: 5 }) },
        watcherCapByRoundPathLevel: { 0: 10 }, roundPathLevel3Bonus: 0, guardRoomBonus: 0, sprinklerMalus: 0,
        bathBonus: 0, discourseDefense: 15, itemDefenseRequiresBuildingUid: ARMORY, defenseBonuses: []
    };
    return {
        referential, town_is_panda: false, round_path_level: 0, has_guard_room: false, has_sprinkler: false,
        built_building_uids: new Set<string>([ARMORY])
    };
}

function w(user_id: number, patch: Partial<PlannedWatcher> = {}): PlannedWatcher & RealWatcher {
    return {
        user_id, items: {}, items_broken: {}, statuses: [], is_ghoul: false, past_watches: 0, is_pro: false,
        hero_bonus: 0, baths: 0, ...patch
    };
}

describe('nightwatch-compare.util', () => {
    describe('compareWatchers', () => {
        it('portière prévue absente du sac réel : missing_items, risque et palier dégradés, à contacter', () => {
            const gaps: WatcherGap[] = compareWatchers([w(1, { items: { [DOOR]: 1 } })], [w(1)], ctx());
            const g: WatcherGap = gaps[0];
            expect(g.missing_items).toEqual({ [DOOR]: 1 });
            expect(g.real_risk).toBeGreaterThan(g.planned_risk);
            expect(g.tier_real).not.toBe(g.tier_planned);
            expect(g.planned_defense).toBe(35);
            expect(g.real_defense).toBe(10);
            expect(g.to_contact).toBe(true);
        });

        it('objet cassé dans le sac réel : compté manquant', () => {
            const g: WatcherGap = compareWatchers(
                [w(1, { items: { [DOOR]: 1 } })],
                [w(1, { items: { [DOOR]: 1 }, items_broken: { [DOOR]: 1 } })], ctx())[0];
            expect(g.missing_items).toEqual({ [DOOR]: 1 });
        });

        it('objet réel en plus : extra_items, pas de contact nécessaire', () => {
            const g: WatcherGap = compareWatchers([w(1)], [w(1, { items: { 11: 2 } })], ctx())[0];
            expect(g.extra_items).toEqual({ 11: 2 });
            expect(g.missing_items).toEqual({});
            expect(g.to_contact).toBe(false);
        });

        it('statut prévu absent du réel : missing_statuses', () => {
            const g: WatcherGap = compareWatchers([w(1, { statuses: ['drugged'] })], [w(1)], ctx())[0];
            expect(g.missing_statuses).toEqual(['drugged']);
            expect(g.to_contact).toBe(true);
        });

        it('tout conforme : aucun écart', () => {
            const g: WatcherGap = compareWatchers(
                [w(1, { items: { [DOOR]: 1 }, statuses: ['drugged'] })],
                [w(1, { items: { [DOOR]: 1 }, statuses: ['drugged'] })], ctx())[0];
            expect(g.missing_items).toEqual({});
            expect(g.extra_items).toEqual({});
            expect(g.missing_statuses).toEqual([]);
            expect(g.planned_risk).toBe(g.real_risk);
            expect(g.to_contact).toBe(false);
        });

        it('veilleur prévu sans état réel : tout est manquant', () => {
            const g: WatcherGap = compareWatchers([w(1, { items: { [DOOR]: 1 } })], [], ctx())[0];
            expect(g.missing_items).toEqual({ [DOOR]: 1 });
            expect(g.to_contact).toBe(true);
        });

        it('plan sans veilleur : résultat vide', () => {
            expect(compareWatchers([], [w(1)], ctx())).toEqual([]);
        });
    });

    describe('compareTotals', () => {
        const gaps: WatcherGap[] = compareWatchers(
            [w(1, { items: { [DOOR]: 1 } })], [w(1, { items: { [DOOR]: 1 }, statuses: ['drugged'] })], ctx());

        it('marge réelle contre attaque', () => {
            const totals: { planned: number; real: number; margin_vs_attack: number | null; planned_margin_vs_attack: number | null } =
                compareTotals([{ ...gaps[0], planned_defense: 100, real_defense: 100 }], 120);
            expect(totals).toEqual({ planned: 100, real: 100, margin_vs_attack: -20, planned_margin_vs_attack: -20 });
        });

        it('marge prévue (défense du plan) et marge réelle distinctes', () => {
            const totals: { planned: number; real: number; margin_vs_attack: number | null; planned_margin_vs_attack: number | null } =
                compareTotals([{ ...gaps[0], planned_defense: 100, real_defense: 60 }], 80);
            expect(totals.planned_margin_vs_attack).toBe(20);
            expect(totals.margin_vs_attack).toBe(-20);
        });

        it('attaque inconnue : marge null ; aucun veilleur : 0', () => {
            expect(compareTotals(gaps, null).margin_vs_attack).toBeNull();
            expect(compareTotals(gaps, null).planned_margin_vs_attack).toBeNull();
            expect(compareTotals([], 50)).toEqual({ planned: 0, real: 0, margin_vs_attack: -50, planned_margin_vs_attack: -50 });
        });
    });
});
