import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { WishlistInfoDTO } from '../../_abstract_model/dto/wishlist-info.dto';
import { WishlistItemDTO } from '../../_abstract_model/dto/wishlist-item.dto';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistComponent } from './wishlist.component';

interface TestableComponent {
    wishlist_info: { set(value: WishlistInfo): void };
}

function buildItemDto(overrides: Partial<WishlistItemDTO['item']> = {}): WishlistItemDTO['item'] {
    return {
        uid: 'planche_tordue_#00', img: '', imgBroken: null, label: {}, description: {},
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

/** Reproduit le DTO tel que renvoyé par une API pas encore reconstruite avec les champs coffre/carte. */
function buildDtoWithoutChestAndMapFields(): WishlistItemDTO {
    const dto: Partial<WishlistItemDTO> = {
        count: 103, bankCount: 103, bagCount: 13, bagCitizens: [],
        item: buildItemDto(), priority: 0, depot: 0, shouldSignal: false, zoneXPa: 0
    };
    return dto as WishlistItemDTO;
}

describe('WishlistComponent', (): void => {
    let fixture: ComponentFixture<WishlistComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [WishlistComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(WishlistComponent);
    });

    it('ne plante pas et garde le nombre de cellules aligné sur les en-têtes quand l\'API ne renvoie pas encore chestCount/mapCellItemCount', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        const dto: WishlistInfoDTO = { wishList: [buildDtoWithoutChestAndMapFields()], lastUpdateInfo: null };

        expect(() => {
            testable.wishlist_info.set(new WishlistInfo(dto));
            fixture.detectChanges();
        }).not.toThrow();

        const columnClass = (cell: HTMLElement): string => Array.from(cell.classList).find((c: string) => c.startsWith('mat-column-')) ?? '';
        const header_ids: string[] = Array.from(fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>).map(columnClass);
        const row_ids: string[] = Array.from(fixture.nativeElement.querySelectorAll('tbody tr:first-child td') as NodeListOf<HTMLElement>).map(columnClass);

        expect(row_ids).toEqual(header_ids);
    });
});
