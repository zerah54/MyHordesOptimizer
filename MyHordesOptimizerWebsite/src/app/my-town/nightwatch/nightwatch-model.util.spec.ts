import { NightwatchItemDefDTO, NightwatchReferentialDTO } from './nightwatch.types';
import {
    buildingFlags,
    deathRisk,
    itemDefense,
    NightwatchBuildingState,
    NightwatchContext,
    survivalTier,
    townWatchDefense,
    watcherAlerts,
    watcherCap,
    watcherDefense,
    WatcherInput
} from './nightwatch-model.util';

const ARMORY: string = 'small_armor_#00';
const FENCE: string = 'small_animfence_#00';

function item(patch: Partial<NightwatchItemDefDTO>): NightwatchItemDefDTO {
    return {
        defense: 0, usage: 'single', repairPa: 0, repairPaSource: '', isEssential: false,
        batteries: 0, water: 0, watchImpact: 0, cumulative: false, source: 'game', ...patch
    };
}

function referential(): NightwatchReferentialDTO {
    return {
        baseRisk: 0.08,
        fatigue: [0, 0.01, 0.04, 0.09, 0.2, 0.3, 0.42, 0.56, 0.72, 0.9],
        fatiguePro: [0, 0.01, 0.04, 0.09, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9],
        statuses: {
            drugged: { defense: 10, deathRisk: 0, source: 'game' },
            dogSteak: { defense: 15, deathRisk: -0.03, source: 'game' },
            ghoul: { defense: 0, deathRisk: -0.05, source: 'game' }
        },
        items: {
            1: item({ watchImpact: 0.05 }),
            2: item({ watchImpact: 0.03 }),
            3: item({ watchImpact: 0.01 }),
            4: item({ watchImpact: 0.01, cumulative: true }),
            10: item({ defense: 25 }),
            11: item({ defense: 25, isEssential: true }),
            12: item({ defense: 10 })
        },
        watcherCapByRoundPathLevel: { 0: 10, 1: 20, 2: 40 },
        roundPathLevel3Bonus: 0.01,
        guardRoomBonus: 0.05,
        sprinklerMalus: 0.04,
        bathBonus: 0.01,
        discourseDefense: 15,
        itemDefenseRequiresBuildingUid: ARMORY,
        defenseBonuses: [
            { buildingUid: FENCE, factor: 0.3, idItems: [10, 11] },
            { buildingUid: 'other_#00', factor: 0.5, idItems: [10] }
        ]
    };
}

function ctx(patch: Partial<NightwatchContext> = {}): NightwatchContext {
    return {
        referential: referential(), town_is_panda: false, round_path_level: 0, has_guard_room: false,
        has_sprinkler: false, built_building_uids: new Set<string>([ARMORY]), ...patch
    };
}

function watcher(patch: Partial<WatcherInput> = {}): WatcherInput {
    return {
        items: {}, items_broken: {}, statuses: [], is_ghoul: false, past_watches: 0, is_pro: false,
        hero_bonus: 0, baths: 0, ...patch
    };
}

describe('nightwatch-model.util', () => {
    describe('buildingFlags', () => {
        const state: NightwatchBuildingState = { builtBuildingUids: ['wall'], hasGuardRoom: false, hasSprinkler: true, roundPathLevel: 1 };

        it('sans prévision : état réel de la ville', () => {
            expect(buildingFlags(state, null)).toEqual({ built_building_uids: new Set(['wall']), has_guard_room: false, has_sprinkler: true, round_path_level: 1 });
        });

        it('avec prévision : chantiers et chemin de ronde projetés, salle de garde et arroseurs compris', () => {
            expect(buildingFlags(state, { built_uids: new Set(['wall', 'small_watchmen_#02']), round_path_level: 2, plan_id: 70 })).toEqual({
                built_building_uids: new Set(['wall', 'small_watchmen_#02']), has_guard_room: true, has_sprinkler: false, round_path_level: 2
            });
        });
    });

    describe('deathRisk', () => {
        it('veilleur nu : risque de base', () => {
            expect(deathRisk(watcher(), ctx())).toBe(0.08);
        });

        it('fatigue, version pro et borne à la dernière entrée', () => {
            expect(deathRisk(watcher({ past_watches: 3 }), ctx())).toBe(0.17);
            expect(deathRisk(watcher({ past_watches: 3, is_pro: true }), ctx())).toBe(0.17);
            expect(deathRisk(watcher({ past_watches: 4, is_pro: true }), ctx())).toBe(0.23);
            expect(deathRisk(watcher({ past_watches: 4 }), ctx())).toBe(0.28);
            expect(deathRisk(watcher({ past_watches: 40 }), ctx())).toBe(0.98);
        });

        it('risque négatif non borné, palier certain', () => {
            const risk: number = deathRisk(watcher({ items: { 1: 1, 2: 1, 3: 1 } }), ctx());
            expect(risk).toBe(-0.01);
            expect(survivalTier(risk)).toBe('certain');
        });

        it('objet cumulatif compté par unité, non cumulatif une fois, cassés compris', () => {
            expect(deathRisk(watcher({ items: { 4: 2 } }), ctx())).toBe(0.06);
            expect(deathRisk(watcher({ items: { 3: 2 } }), ctx())).toBe(0.07);
            expect(deathRisk(watcher({ items: { 4: 2 }, items_broken: { 4: 2 } }), ctx())).toBe(0.06);
        });

        it('ghoul : -0,05 une seule fois même si le statut est aussi coché', () => {
            expect(deathRisk(watcher({ is_ghoul: true }), ctx())).toBe(0.03);
            expect(deathRisk(watcher({ is_ghoul: true, statuses: ['ghoul'] }), ctx())).toBe(0.03);
        });

        it('statut inconnu ignoré, statut connu appliqué', () => {
            expect(deathRisk(watcher({ statuses: ['dogSteak', 'nope'] }), ctx())).toBe(0.05);
        });

        it('bâtiments : arroseurs, corps de garde, ronde niveau 3', () => {
            expect(deathRisk(watcher(), ctx({ has_sprinkler: true }))).toBe(0.12);
            expect(deathRisk(watcher(), ctx({ has_guard_room: true }))).toBe(0.03);
            expect(deathRisk(watcher(), ctx({ round_path_level: 3 }))).toBe(0.07);
            expect(deathRisk(watcher(), ctx({ round_path_level: 2 }))).toBe(0.08);
        });

        it('ville panda : risque >= 0 doublé avant le bonus héroïque, négatif non doublé', () => {
            const panda: NightwatchContext = ctx({ town_is_panda: true });
            expect(deathRisk(watcher(), panda)).toBe(0.16);
            expect(deathRisk(watcher({ hero_bonus: 0.05 }), panda)).toBe(0.11);
            expect(deathRisk(watcher({ items: { 1: 1, 2: 1, 3: 1 } }), panda)).toBe(-0.01);
        });

        it('past_watches non entier ou NaN, baths négatif : jamais de NaN', () => {
            expect(deathRisk(watcher({ past_watches: 3.9 }), ctx())).toBe(0.17);
            expect(deathRisk(watcher({ past_watches: NaN }), ctx())).toBe(0.08);
            expect(deathRisk(watcher({ past_watches: -2 }), ctx())).toBe(0.08);
            expect(deathRisk(watcher({ past_watches: 3, baths: -5 }), ctx())).toBe(0.17);
            expect(deathRisk(watcher({ past_watches: 3, baths: NaN }), ctx())).toBe(0.17);
        });

        it('bains : après la fatigue, plancher au risque de base, seulement si fatigue > 0', () => {
            expect(deathRisk(watcher({ past_watches: 3, baths: 2 }), ctx())).toBe(0.15);
            expect(deathRisk(watcher({ past_watches: 3, baths: 20 }), ctx())).toBe(0.08);
            expect(deathRisk(watcher({ past_watches: 0, baths: 5 }), ctx())).toBe(0.08);
            expect(deathRisk(watcher({ past_watches: 3, baths: 20, items: { 1: 1 } }), ctx())).toBe(0.03);
        });
    });

    describe('itemDefense', () => {
        it('objet inconnu : 0', () => {
            expect(itemDefense(999, ctx())).toBe(0);
        });

        it('armurerie absente : 0 sauf objet essentiel', () => {
            const c: NightwatchContext = ctx({ built_building_uids: new Set<string>() });
            expect(itemDefense(10, c)).toBe(0);
            expect(itemDefense(11, c)).toBe(25);
        });

        it('bonus de chantier construit sur objet ciblé uniquement, floor à chaque étape', () => {
            const c: NightwatchContext = ctx({ built_building_uids: new Set<string>([ARMORY, FENCE]) });
            expect(itemDefense(10, c)).toBe(32);
            expect(itemDefense(12, c)).toBe(10);
            const both: NightwatchContext = ctx({ built_building_uids: new Set<string>([ARMORY, FENCE, 'other_#00']) });
            expect(itemDefense(10, both)).toBe(48);
        });
    });

    describe('watcherDefense', () => {
        it('10 + statut + objet', () => {
            expect(watcherDefense(watcher({ statuses: ['dogSteak'], items: { 10: 1 } }), ctx(), false)).toBe(50);
        });

        it('objet cassé : 0', () => {
            expect(watcherDefense(watcher({ items: { 10: 1 }, items_broken: { 10: 1 } }), ctx(), false)).toBe(10);
            expect(watcherDefense(watcher({ items: { 10: 3 }, items_broken: { 10: 1 } }), ctx(), false)).toBe(60);
        });

        it('discours actif : +15', () => {
            expect(watcherDefense(watcher(), ctx(), true)).toBe(25);
        });
    });

    describe('alertes', () => {
        it('objet inconnu : défense 0 et alerte', () => {
            const w: WatcherInput = watcher({ items: { 999: 1 } });
            expect(watcherDefense(w, ctx(), false)).toBe(10);
            expect(deathRisk(w, ctx())).toBe(0.08);
            expect(watcherAlerts(w, ctx())).toContainEqual({ kind: 'unknown_item', item_id: 999 });
        });

        it('risque > 0 signalé, aucune alerte sinon', () => {
            expect(watcherAlerts(watcher(), ctx())).toEqual([{ kind: 'risk_above_zero' }]);
            expect(watcherAlerts(watcher({ items: { 1: 1, 2: 1, 3: 1 } }), ctx())).toEqual([]);
        });
    });

    describe('survivalTier', () => {
        it('seuils', () => {
            expect(survivalTier(0)).toBe('certain');
            expect(survivalTier(0.15)).toBe('t15');
            expect(survivalTier(0.1501)).toBe('t30');
            expect(survivalTier(0.3)).toBe('t30');
            expect(survivalTier(0.3001)).toBe('t45');
            expect(survivalTier(0.45)).toBe('t45');
            expect(survivalTier(0.6)).toBe('t60');
            expect(survivalTier(0.75)).toBe('t75');
            expect(survivalTier(0.9)).toBe('t90');
            expect(survivalTier(0.91)).toBe('dire');
        });
    });

    describe('watcherCap / townWatchDefense', () => {
        it('plafond par niveau, niveau absent = niveau 0', () => {
            expect(watcherCap(ctx({ round_path_level: 1 }))).toBe(20);
            expect(watcherCap(ctx({ round_path_level: 3 }))).toBe(10);
        });

        it('somme des défenses', () => {
            expect(townWatchDefense([10, 25, 40])).toBe(75);
            expect(townWatchDefense([])).toBe(0);
        });
    });
});
