import { NightwatchWatcherRow } from './nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchItemDefDTO, NightwatchReferentialDTO } from './nightwatch.types';
import { buildForumInput, ForumInputSources } from './nightwatch-forum-input.util';
import { StockLine } from './nightwatch-stock.util';

function itemDef(usage: NightwatchItemDefDTO['usage']): NightwatchItemDefDTO {
    return { defense: 1, usage, repairPa: 0, repairPaSource: '', isEssential: false, batteries: 0, water: 0, watchImpact: 0, cumulative: false, source: 'game' };
}

function stockLine(item_id: number, need: number): StockLine {
    return { item_id, need, in_bag: 0, in_chests: 0, in_bank: 0, in_desert: 0, manual: 0, broken_in_town: 0, available_in_town: 0, remaining: 0, stale_chest: false, unknown_age: false, oldest_chest_update: null };
}

function sources(overrides: Partial<ForumInputSources> = {}): ForumInputSources {
    const row: NightwatchWatcherRow = { user_id: 1, name: 'Alice', past_watches: 0, defense: 42, risk: 0, tier: 'certain', alerts: [] };
    const citizen: NightwatchCitizenStateDTO = {
        userId: 1, name: 'Alice', jobUid: 'shield', isShunned: false, isGhoul: false, isDrugged: false, isDrunk: false, isThirsty: false, isImmune: false,
        bag: {}, bagBroken: {}, chest: {}, chestBroken: {}
    };
    const referential: NightwatchReferentialDTO = {
        items: { 5: itemDef('repair'), 6: itemDef('recharge'), 7: itemDef('single') }
    } as unknown as NightwatchReferentialDTO;
    return {
        draft: {
            instructions: ' Consignes ',
            watchers: [{ userId: 1, statuses: ['drugged', 'dog'], items: { 5: 2, 6: 0, 7: 1 }, hasDiscourse: true, note: 'Note' }],
            manualStock: {}
        },
        rows: [row],
        citizens: [citizen],
        stock_lines: [stockLine(5, 2), stockLine(6, 3), stockLine(7, 1)],
        referential,
        total_defense: 300,
        cost: { repair_pa: 12, batteries: 5, water: 3 },
        itemLabel: (item_id: number): string => `Objet${item_id}`,
        statusLabel: (key: string): string => `S-${key}`,
        ...overrides
    };
}

describe('buildForumInput', (): void => {
    it('reprend les consignes, le total et le coût', (): void => {
        const result: ReturnType<typeof buildForumInput> = buildForumInput(sources());

        expect(result.instructions).toBe(' Consignes ');
        expect(result.total_defense).toBe(300);
        expect(result.cost).toEqual({ repair_pa: 12, batteries: 5, water: 3 });
    });

    it('veilleur : nom, icône du métier, statuts libellés, défense, objets non nuls, discours et note', (): void => {
        const result: ReturnType<typeof buildForumInput> = buildForumInput(sources());

        expect(result.watchers).toEqual([{
            name: 'Alice', job_icon: ':guard:', status_labels: ['S-drugged', 'S-dog'], defense: 42,
            items: [{ label: 'Objet5', qty: 2 }, { label: 'Objet7', qty: 1 }], discourse: true, note: 'Note'
        }]);
    });

    it('métier inconnu : icône d\'habitant', (): void => {
        const result: ReturnType<typeof buildForumInput> = buildForumInput(sources({
            citizens: [{ ...sources().citizens[0], jobUid: null }]
        }));

        expect(result.watchers[0].job_icon).toBe(':basic:');
    });

    it('lignes réparables et rechargeables selon l\'usage du référentiel', (): void => {
        const result: ReturnType<typeof buildForumInput> = buildForumInput(sources());

        expect(result.reparable_lines).toEqual([{ label: 'Objet5', qty: 2 }]);
        expect(result.rechargeable_lines).toEqual([{ label: 'Objet6', qty: 3 }]);
    });

    it('sans veilleur : message valide', (): void => {
        const result: ReturnType<typeof buildForumInput> = buildForumInput(sources({
            draft: { watchers: [], manualStock: {} }, rows: [], stock_lines: []
        }));

        expect(result.watchers).toEqual([]);
        expect(result.instructions).toBeNull();
        expect(result.reparable_lines).toEqual([]);
    });
});
