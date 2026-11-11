import { WishlistGroupDTO } from '../dto/wishlist-group.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { newGroupUid, WishlistGroup } from './wishlist-group.class';

describe('WishlistGroup', (): void => {
    const DTO: WishlistGroupDTO = { uid: 'g-1', name: 'Kit', priority: 2, zoneXPa: 5, depot: WishlistDepot.BANK.value.count, count: 3 };

    it('round-trips through the DTO', (): void => {
        const group: WishlistGroup = new WishlistGroup(DTO);

        expect(group.zone_x_pa).toBe(5);
        expect(group.depot).toBe(WishlistDepot.BANK);
        expect(group.modelToDto()).toEqual(DTO);
    });

    it('generates distinct non-empty uids', (): void => {
        const uid: string = newGroupUid();

        expect(uid.length).toBeGreaterThan(0);
        expect(newGroupUid()).not.toBe(uid);
    });
});
