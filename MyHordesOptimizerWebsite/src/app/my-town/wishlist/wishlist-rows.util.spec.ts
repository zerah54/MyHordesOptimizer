import { WishlistDepot } from '../../_abstract_model/enum/wishlist-depot.enum';
import { Item } from '../../_abstract_model/types/item.class';
import { WishlistGroup } from '../../_abstract_model/types/wishlist-group.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { blocksOf, buildWishlistRows, groupTotals, resetBlockPriorities, WishlistBlock, WishlistRow } from './wishlist-rows.util';

const LOCALE: string = 'fr';

function buildItem(id: number, name: string, group_uid: string | null, priority: number = 0): WishlistItem {
    return Object.assign(new WishlistItem(), {
        item: Object.assign(new Item(), { id, label: { [LOCALE]: name } }),
        count: 1, bank_count: 0, bag_count: 0, chest_count: 0, map_cell_item_count: 0,
        priority, depot: WishlistDepot.BANK, zone_x_pa: 0, group_uid
    });
}

function buildGroup(uid: string, name: string, priority: number = 0, count: number = 30): WishlistGroup {
    return Object.assign(new WishlistGroup(), { uid, name, priority, zone_x_pa: 0, depot: WishlistDepot.BANK, count });
}

function buildInfo(items: WishlistItem[], groups: WishlistGroup[]): WishlistInfo {
    return Object.assign(new WishlistInfo(), { wishlist_items: items, groups });
}

describe('wishlist-rows.util', (): void => {
    const group: WishlistGroup = buildGroup('g1', 'B6');
    const members: WishlistItem[] = [buildItem(2, 'Zebre', 'g1'), buildItem(3, 'Abricot', 'g1')];

    it('blocksOf orders blocks by descending priority', (): void => {
        const info: WishlistInfo = buildInfo(
            [buildItem(1, 'Solo', null, 5), ...members],
            [buildGroup('g1', 'B6', 9)]
        );

        const blocks: WishlistBlock[] = blocksOf(info);

        expect(blocks.map((block: WishlistBlock): string => block.kind)).toEqual(['group', 'item']);
    });

    it('a collapsed group yields a single group row', (): void => {
        const rows: WishlistRow[] = buildWishlistRows([{ kind: 'group', group, members }], new Set(), '', LOCALE);

        expect(rows.map((row: WishlistRow): string => row.kind)).toEqual(['group']);
    });

    it('an expanded group yields its members sorted by name', (): void => {
        const rows: WishlistRow[] = buildWishlistRows([{ kind: 'group', group, members }], new Set(['g1']), '', LOCALE);

        expect(rows.map((row: WishlistRow): string => row.kind)).toEqual(['group', 'member', 'member']);
        expect(rows.slice(1).map((row: WishlistRow): string => (row as { item: WishlistItem }).item.item.label[LOCALE]))
            .toEqual(['Abricot', 'Zebre']);
    });

    it('groupTotals computes the missing quantity, null when the stock is infinite', (): void => {
        const stocked: WishlistItem[] = [buildItem(2, 'A', 'g1'), buildItem(3, 'B', 'g1')];
        stocked[0].bank_count = 12;
        stocked[1].bag_count = 3;

        expect(groupTotals(buildGroup('g1', 'B6', 0, 30), stocked).needed).toBe(15);
        expect(groupTotals(buildGroup('g1', 'B6', 0, -1), stocked).needed).toBeNull();
        expect(groupTotals(buildGroup('g1', 'B6', 0, 30), stocked).bank_count).toBe(12);
    });

    it('a filter matching one member of a collapsed group expands it with that member only', (): void => {
        const rows: WishlistRow[] = buildWishlistRows([{ kind: 'group', group, members }], new Set(), 'abri', LOCALE);

        expect(rows.map((row: WishlistRow): string => row.kind)).toEqual(['group', 'member']);
        expect(rows[0].kind === 'group' && rows[0].expanded).toBe(true);
    });

    it('a filter matching the group name keeps the whole group', (): void => {
        const rows: WishlistRow[] = buildWishlistRows([{ kind: 'group', group, members }], new Set(['g1']), 'b6', LOCALE);

        expect(rows.length).toBe(3);
    });

    it('a filter matching nothing drops the block', (): void => {
        expect(buildWishlistRows([{ kind: 'group', group, members }], new Set(), 'zzz', LOCALE)).toEqual([]);
    });

    it('resetBlockPriorities numbers blocks 999 downwards and gives members their group priority', (): void => {
        const first: WishlistItem = buildItem(1, 'A', null);
        const last: WishlistItem = buildItem(4, 'D', null);
        const g: WishlistGroup = buildGroup('g1', 'B6');

        resetBlockPriorities([{ kind: 'item', item: first }, { kind: 'group', group: g, members }, { kind: 'item', item: last }]);

        expect(first.priority).toBe(999);
        expect(g.priority).toBe(998);
        expect(members.map((member: WishlistItem): number => member.priority)).toEqual([998, 998]);
        expect(last.priority).toBe(997);
    });
});
