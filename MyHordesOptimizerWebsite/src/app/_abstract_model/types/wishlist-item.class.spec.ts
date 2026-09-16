import { ItemDTO } from '../dto/item.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { WishlistItem } from './wishlist-item.class';

function buildItemDto(overrides: Partial<ItemDTO> = {}): ItemDTO {
    return {
        uid: 'item_#00', img: '', imgBroken: null, label: {}, description: {},
        id: 1, category: { idCategory: 1, name: 'Box', label: {}, ordering: 0 },
        deco: 0, isHeaver: false, guard: 0,
        properties: [], actions: [], recipes: [],
        openedWith: null, opens: [],
        openApCost: null, openSuccessRate: null, technicianOpenCpCost: null,
        catapultEffect: null,
        bankCount: 0, wishListCount: 0, dropRateNotPraf: 0, dropRatePraf: 0,
        ...overrides
    };
}

function buildDto(overrides: Partial<WishlistItemDTO> = {}): WishlistItemDTO {
    return {
        count: 1, bankCount: 0, bagCount: 0, bagCitizens: [],
        chestCount: 0, chestCitizens: [], mapCellItemCount: 0,
        item: buildItemDto(), priority: 0, depot: WishlistDepot.BANK.value.count, shouldSignal: false, zoneXPa: 0,
        ...overrides
    };
}

describe('WishlistItem', (): void => {
    it('reads chest_count and chest_citizens from the DTO', (): void => {
        const wishlistItem: WishlistItem = new WishlistItem(buildDto({ chestCount: 3, chestCitizens: ['Bob'] }));

        expect(wishlistItem.chest_count).toBe(3);
        expect(wishlistItem.chest_citizens).toEqual(['Bob']);
    });

    it('defaults chest_citizens to an empty array when the DTO omits it', (): void => {
        const dto: WishlistItemDTO = buildDto();
        delete (dto as Partial<WishlistItemDTO>).chestCitizens;

        const wishlistItem: WishlistItem = new WishlistItem(dto);

        expect(wishlistItem.chest_citizens).toEqual([]);
    });

    it('reads map_cell_item_count from the DTO', (): void => {
        const wishlistItem: WishlistItem = new WishlistItem(buildDto({ mapCellItemCount: 4 }));

        expect(wishlistItem.map_cell_item_count).toBe(4);
    });

    it('round-trips chest_count and map_cell_item_count through modelToDto', (): void => {
        const wishlistItem: WishlistItem = new WishlistItem(buildDto({ chestCount: 2, mapCellItemCount: 5 }));

        const dto: WishlistItemDTO = wishlistItem.modelToDto();

        expect(dto.chestCount).toBe(2);
        expect(dto.mapCellItemCount).toBe(5);
    });
});
