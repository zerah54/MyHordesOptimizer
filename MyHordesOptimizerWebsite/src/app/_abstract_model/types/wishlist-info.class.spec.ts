import { ItemDTO } from '../dto/item.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistPutDTO } from '../dto/wishlist-put.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { WishlistGroup } from './wishlist-group.class';
import { WishlistInfo } from './wishlist-info.class';
import { WishlistItem } from './wishlist-item.class';

function buildItemDto(id: number): ItemDTO {
    return {
        uid: `item_${id}`, img: '', imgBroken: null, label: {}, description: {},
        id, category: { idCategory: 1, name: 'Box', label: {}, ordering: 0 },
        deco: 0, isHeaver: false, guard: 0,
        properties: [], actions: [], recipes: [],
        openedWith: null, opens: [],
        openApCost: null, openSuccessRate: null, technicianOpenCpCost: null,
        catapultEffect: null,
        actionEffects: [], reloadCharges: null, watchImpact: 0, bagCapacityBonus: null, bagExclusiveGroup: null,
        bankCount: 0, wishListCount: 0, dropRateNotPraf: 0, dropRatePraf: 0
    };
}

function buildItem(id: number, count: number, groupUid: string | null): WishlistItemDTO {
    return {
        count, bankCount: 0, bagCount: 0, bagCitizens: [],
        chestCount: 0, chestCitizens: [], mapCellItemCount: 0,
        item: buildItemDto(id), priority: 0, depot: WishlistDepot.BANK.value.count, shouldSignal: false, zoneXPa: 0,
        groupUid
    };
}

function buildInfo(): WishlistInfo {
    const dto: WishlistInfoDTO = {
        wishList: [buildItem(1, 0, 'g-1'), buildItem(2, 0, null), buildItem(3, 4, null), buildItem(4, 1, 'g-2')],
        lastUpdateInfo: null,
        groups: [
            { uid: 'g-1', name: 'Kit', priority: 0, zoneXPa: 0, depot: WishlistDepot.BANK.value.count, count: 0 },
            { uid: 'g-2', name: 'Autre', priority: 0, zoneXPa: 0, depot: WishlistDepot.BANK.value.count, count: 1 }
        ]
    };
    return new WishlistInfo(dto);
}

describe('WishlistInfo groups', (): void => {
    it('defaults groups to an empty array when the DTO omits them', (): void => {
        const info: WishlistInfo = new WishlistInfo({ wishList: [], lastUpdateInfo: null });

        expect(info.groups).toEqual([]);
    });

    it('toPutDto keeps group members at stock 0, drops lone lines at stock 0 and serializes groups', (): void => {
        const put: WishlistPutDTO = buildInfo().toPutDto();

        expect(put.items.map((item: { id: number }): number => item.id).sort()).toEqual([1, 3, 4]);
        expect(put.items.find((item: { id: number }): boolean => item.id === 1)?.groupUid).toBe('g-1');
        expect(put.groups.map((group: { uid: string }): string => group.uid)).toEqual(['g-1', 'g-2']);
    });

    it('membersOf returns only the members of the group', (): void => {
        expect(buildInfo().membersOf('g-1').map((item: WishlistItem): number => item.item.id)).toEqual([1]);
    });

    it('applyGroupSettings copies zone, depot, priority and stock onto members only', (): void => {
        const info: WishlistInfo = buildInfo();
        const group: WishlistGroup = info.groups[0];
        group.zone_x_pa = 7;
        group.depot = WishlistDepot.TELEPORT;
        group.priority = 5;
        group.count = 9;

        info.applyGroupSettings(group);

        const member: WishlistItem = info.membersOf('g-1')[0];
        expect([member.zone_x_pa, member.depot, member.priority, member.count]).toEqual([7, WishlistDepot.TELEPORT, 5, 9]);
        const other: WishlistItem = info.wishlist_items.find((item: WishlistItem): boolean => item.item.id === 4) as WishlistItem;
        expect([other.zone_x_pa, other.priority, other.count]).toEqual([0, 0, 1]);
    });
});
