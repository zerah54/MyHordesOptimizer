import { NightwatchItemDefDTO, NightwatchReferentialDTO } from './nightwatch.types';
import { ChestStock, computeCost, computeStock, StockLine, StockSources } from './nightwatch-stock.util';

const NOW: Date = new Date('2026-11-13T12:00:00Z');
const STALE_HOURS: number = 24;
const FRESH: string = '2026-11-13T10:00:00Z';
const OLD: string = '2026-11-10T10:00:00Z';

function sources(patch: Partial<StockSources> = {}): StockSources {
    return {
        bags: {}, bags_broken: {}, chests: [], bank: {}, bank_broken: {}, desert: {}, desert_broken: {},
        manual: {}, ...patch
    };
}

function chest(user_id: number, items: Record<number, number>, updated_at: string | null,
               items_broken: Record<number, number> = {}): ChestStock {
    return { user_id, items, items_broken, updated_at };
}

function line(lines: StockLine[], id: number): StockLine {
    const found: StockLine | undefined = lines.find((l: StockLine): boolean => l.item_id === id);
    if (found === undefined) {
        throw new Error('ligne absente ' + id);
    }
    return found;
}

describe('nightwatch-stock.util', () => {
    describe('computeStock', () => {
        it('sac du veilleur + banque + coffre couvrent un besoin de 3', () => {
            const lines: StockLine[] = computeStock(
                [{ user_id: 1, items: { 10: 3 } }],
                sources({ bags: { 1: { 10: 1 } }, bank: { 10: 1 }, chests: [chest(2, { 10: 1 }, FRESH)] }),
                NOW, STALE_HOURS);
            const l: StockLine = line(lines, 10);
            expect(l.need).toBe(3);
            expect(l.in_bag).toBe(1);
            expect(l.in_bank).toBe(1);
            expect(l.in_chests).toBe(1);
            expect(l.available_in_town).toBe(3);
            expect(l.remaining).toBe(0);
        });

        it('le désert seul ne couvre rien mais est rapporté', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 2 } }], sources({ desert: { 10: 5 } }), NOW, STALE_HOURS), 10);
            expect(l.in_desert).toBe(5);
            expect(l.available_in_town).toBe(0);
            expect(l.remaining).toBe(2);
        });

        it('rien de disponible : reste = besoin ; surplus : jamais négatif', () => {
            expect(line(computeStock([{ user_id: 1, items: { 10: 2 } }], sources(), NOW, STALE_HOURS), 10).remaining)
                .toBe(2);
            const over: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 2 } }], sources({ bank: { 10: 9 } }), NOW, STALE_HOURS), 10);
            expect(over.available_in_town).toBe(9);
            expect(over.remaining).toBe(0);
        });

        it('le sac d\'un veilleur ne couvre que son propre besoin (pas de double compte)', () => {
            const lines: StockLine[] = computeStock(
                [{ user_id: 1, items: { 10: 1 } }, { user_id: 2, items: { 10: 1 } }],
                sources({ bags: { 1: { 10: 5 } } }), NOW, STALE_HOURS);
            const l: StockLine = line(lines, 10);
            expect(l.in_bag).toBe(1);
            expect(l.remaining).toBe(1);
        });

        it('la saisie manuelle est comptée', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 2 } }], sources({ manual: { 10: 2 } }), NOW, STALE_HOURS), 10);
            expect(l.manual).toBe(2);
            expect(l.remaining).toBe(0);
        });

        it('les unités cassées ne couvrent pas le besoin', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 3 } }],
                sources({
                    bags: { 1: { 10: 1 } }, bags_broken: { 1: { 10: 1 } },
                    bank: { 10: 2 }, bank_broken: { 10: 1 },
                    chests: [chest(2, { 10: 1 }, FRESH, { 10: 1 })]
                }), NOW, STALE_HOURS), 10);
            expect(l.in_bag).toBe(0);
            expect(l.in_bank).toBe(1);
            expect(l.in_chests).toBe(0);
            expect(l.broken_in_town).toBe(3);
            expect(l.remaining).toBe(2);
        });

        it('coffre jamais mis à jour : unknown_age', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }], sources({ chests: [chest(2, { 10: 1 }, null)] }), NOW, STALE_HOURS), 10);
            expect(l.unknown_age).toBe(true);
            expect(l.stale_chest).toBe(false);
            expect(l.in_chests).toBe(1);
        });

        it('coffre périmé : stale_chest ; coffre frais : aucun drapeau', () => {
            const stale: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }], sources({ chests: [chest(2, { 10: 1 }, OLD)] }), NOW, STALE_HOURS), 10);
            expect(stale.stale_chest).toBe(true);
            expect(stale.unknown_age).toBe(false);
            const fresh: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }], sources({ chests: [chest(2, { 10: 1 }, FRESH)] }), NOW, STALE_HOURS), 10);
            expect(fresh.stale_chest).toBe(false);
            expect(fresh.unknown_age).toBe(false);
        });

        it('date de coffre : la plus ancienne des coffres qui contribuent, null si aucune connue', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }],
                sources({ chests: [chest(2, { 10: 1 }, FRESH), chest(3, { 10: 1 }, OLD), chest(4, { 10: 1 }, null), chest(5, { 11: 1 }, '2020-01-01T00:00:00Z')] }), NOW, STALE_HOURS), 10);
            expect(l.oldest_chest_update).toBe(OLD);
            const none: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }], sources({ chests: [chest(2, { 10: 1 }, null)] }), NOW, STALE_HOURS), 10);
            expect(none.oldest_chest_update).toBeNull();
        });

        it('un coffre sans l\'objet ne déclenche aucun drapeau', () => {
            const l: StockLine = line(computeStock(
                [{ user_id: 1, items: { 10: 1 } }], sources({ chests: [chest(2, { 11: 1 }, null)] }), NOW, STALE_HOURS), 10);
            expect(l.unknown_age).toBe(false);
        });

        it('plan sans veilleur : résultat vide sans exception', () => {
            expect(computeStock([], sources({ bank: { 10: 3 } }), NOW, STALE_HOURS)).toEqual([]);
        });
    });

    describe('computeCost', () => {
        function def(patch: Partial<NightwatchItemDefDTO>): NightwatchItemDefDTO {
            return {
                defense: 0, usage: 'single', repairPa: 0, repairPaSource: '', isEssential: false,
                batteries: 0, water: 0, watchImpact: 0, cumulative: false, source: 'game', ...patch
            };
        }
        const ref: NightwatchReferentialDTO = {
            baseRisk: 0, fatigue: [], fatiguePro: [], statuses: {},
            items: {
                1: def({ usage: 'repair', repairPa: 2 }),
                2: def({ usage: 'recharge', batteries: 1, water: 1 }),
                3: def({ usage: 'single', repairPa: 2, batteries: 5, water: 5 })
            },
            watcherCapByRoundPathLevel: {}, roundPathLevel3Bonus: 0, guardRoomBonus: 0, sprinklerMalus: 0,
            bathBonus: 0, discourseDefense: 0, itemDefenseRequiresBuildingUid: '', defenseBonuses: []
        };

        it('3 objets réparables x 2 PA = 6 PA ; rechargeables sommés ; usage unique gratuit', () => {
            const lines: StockLine[] = computeStock(
                [{ user_id: 1, items: { 1: 3, 2: 2, 3: 4, 99: 1 } }], sources(), NOW, STALE_HOURS);
            expect(computeCost(lines, ref)).toEqual({ repair_pa: 6, batteries: 2, water: 2 });
        });

        it('aucune ligne : coût nul', () => {
            expect(computeCost([], ref)).toEqual({ repair_pa: 0, batteries: 0, water: 0 });
        });
    });
});
