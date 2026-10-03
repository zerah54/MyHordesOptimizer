import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import type { MockInstance } from 'vitest';

import { WishlistInfoDTO } from '../../_abstract_model/dto/wishlist-info.dto';
import { WishlistItemDTO } from '../../_abstract_model/dto/wishlist-item.dto';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';
import { WishlistComponent } from './wishlist.component';

interface TestableComponent {
    wishlist_info: WritableSignal<WishlistInfo | null>;
    unsaved_duplicates(): string[];
    auto_save$: Subject<WishlistInfo>;
    triggerSave(): void;
    buildExcelRows(items: WishlistItem[]): Record<string, string | number>[];
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

/** Ligne de liste pour l'objet `id`, dans la zone `zone_x_pa`, avec la quantité souhaitée `count`. */
function buildRowDto(id: number, zone_x_pa: number, count: number): WishlistItemDTO {
    const label: string = `Objet ${id}`;
    return {
        count, bankCount: 0, bagCount: 0, bagCitizens: [], chestCount: 0, chestCitizens: [], mapCellItemCount: 0,
        item: buildItemDto({ id, label: { fr: label, en: label, de: label, es: label }, wishListCount: 99 }),
        priority: 0, depot: 0, shouldSignal: false, zoneXPa: zone_x_pa
    };
}

describe('WishlistComponent', (): void => {
    let fixture: ComponentFixture<WishlistComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [WishlistComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])]
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

    it('exporte la quantité souhaitée de chaque ligne, pas le wishlist_count de l\'objet', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        const info: WishlistInfo = new WishlistInfo({ wishList: [buildRowDto(1, 0, 5), buildRowDto(1, 3, 2)], lastUpdateInfo: null });

        const quantities: (string | number)[] = testable.buildExcelRows(info.wishlist_items)
            .map((row: Record<string, string | number>): string | number => row['Quantité souhaitée']);

        expect(quantities).toEqual([5, 2]);
    });

    it('suspend l\'enregistrement et le signale tant qu\'un objet figure deux fois dans la même zone', (): void => {
        const testable: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        testable.wishlist_info.set(new WishlistInfo({
            wishList: [buildRowDto(1, 3, 5), buildRowDto(1, 3, 2), buildRowDto(2, 3, 1)],
            lastUpdateInfo: null
        }));
        const next_spy: MockInstance<(value: WishlistInfo) => void> = vi.spyOn(testable.auto_save$, 'next');

        testable.triggerSave();
        fixture.detectChanges();

        expect(next_spy).not.toHaveBeenCalled();
        expect(testable.unsaved_duplicates()).toEqual(['Objet 1']);
        const warning: HTMLElement | null = fixture.nativeElement.querySelector('.duplicate-warning[role="alert"]');
        expect(warning?.textContent).toContain('Objet 1');

        (testable.wishlist_info() as WishlistInfo).wishlist_items[1].zone_x_pa = 4;
        testable.triggerSave();
        fixture.detectChanges();

        expect(next_spy).toHaveBeenCalledTimes(1);
        expect(testable.unsaved_duplicates()).toEqual([]);
        expect(fixture.nativeElement.querySelector('.duplicate-warning')).toBeNull();
    });
});
