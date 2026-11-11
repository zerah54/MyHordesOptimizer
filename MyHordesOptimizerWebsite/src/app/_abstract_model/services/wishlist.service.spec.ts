import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SnackbarService } from '../../_core/services/snackbar.service';
import { UserWishlistGroupDTO } from '../dto/user-wishlist-group.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { WishlistItemDTO } from '../dto/wishlist-item.dto';
import { WishlistPutDTO } from '../dto/wishlist-put.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { WishlistService } from './wishlist.service';

function itemDto(id: number, groupUid: string | null): WishlistItemDTO {
    return {
        count: 0, bankCount: 0, bagCount: 0, bagCitizens: [], chestCount: 0, chestCitizens: [], mapCellItemCount: 0,
        item: { id, uid: `item_${id}` } as WishlistItemDTO['item'],
        priority: 0, depot: WishlistDepot.BANK.value.count, shouldSignal: false, zoneXPa: 0, groupUid
    };
}

const INFO: WishlistInfoDTO = {
    wishList: [itemDto(1, 'g-1')],
    lastUpdateInfo: null,
    groups: [{ uid: 'g-1', name: 'Kit', priority: 0, zoneXPa: 0, depot: 0, count: 0 }]
};

type Req = HttpRequest<unknown>;

describe('WishlistService', (): void => {
    let service: WishlistService;
    let http: HttpTestingController;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: SnackbarService, useValue: { successSnackbar: (): void => undefined } }
            ]
        });
        service = TestBed.inject(WishlistService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => http.verify());

    it('addMissingItems keeps existing groups in the PUT body', (): void => {
        service.addMissingItems([2]).subscribe();

        http.expectOne((req: Req): boolean => req.method === 'GET' && req.url.includes('/wishlist')).flush(INFO);
        const put: TestRequest = http.expectOne((req: Req): boolean => req.method === 'PUT' && req.url.includes('/wishlist'));
        const body: WishlistPutDTO = put.request.body as WishlistPutDTO;
        expect(body.groups.map((group: { uid: string }): string => group.uid)).toEqual(['g-1']);
        expect(body.items.map((item: { id: number }): number => item.id)).toEqual([1, 2]);
        expect(body.items[0].groupUid).toBe('g-1');
        expect(body.items[1].groupUid).toBeNull();
        put.flush(INFO);
    });

    it('addGroupToWishlist POSTs name, itemIds, zoneXPa and count to /wishlist/group', (): void => {
        service.addGroupToWishlist('Kit', [1, 2], 3, 4).subscribe();

        const post: TestRequest = http.expectOne((req: Req): boolean => req.method === 'POST' && req.url.includes('/wishlist/group?townId='));
        expect(JSON.parse(post.request.body as string)).toEqual({ name: 'Kit', itemIds: [1, 2], zoneXPa: 3, count: 4 });
        post.flush(INFO);
    });

    it('calls the personal-group routes', (): void => {
        const dto: UserWishlistGroupDTO = { id: 5, name: 'N', itemUids: ['a'], updatedAt: '' };
        service.getMyGroups().subscribe();
        http.expectOne((req: Req): boolean => req.method === 'GET' && req.url.endsWith('/wishlist/MyGroups')).flush([dto]);
        service.createMyGroup('N', ['a']).subscribe();
        const create: TestRequest = http.expectOne((req: Req): boolean => req.method === 'POST' && req.url.endsWith('/wishlist/MyGroups'));
        expect(JSON.parse(create.request.body as string)).toEqual({ name: 'N', itemUids: ['a'] });
        create.flush(dto);
        service.updateMyGroup(5, 'N', ['a']).subscribe();
        http.expectOne((req: Req): boolean => req.method === 'PUT' && req.url.endsWith('/wishlist/MyGroups/5')).flush(dto);
        service.deleteMyGroup(5).subscribe();
        http.expectOne((req: Req): boolean => req.method === 'DELETE' && req.url.endsWith('/wishlist/MyGroups/5')).flush(null);
    });
});
