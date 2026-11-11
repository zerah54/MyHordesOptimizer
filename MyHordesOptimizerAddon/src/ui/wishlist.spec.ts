import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import type { MhoItem, WishlistItem } from '../types';
import { collapseGroupRows, displayWishlistInApp, getItemIdsInCell } from './wishlist';

/** `pageIsDesert()`/`pageIsWorkshop()` lisent `document.URL` : mockées pour piloter le scénario atelier */
vi.mock('../utils/page', () => ({
    pageIsDesert: (): boolean => false,
    pageIsWorkshop: (): boolean => true
}));

/** Évite le vrai MutationObserver/écouteurs DOM de la surveillance d'inventaire, hors-sujet ici */
vi.mock('../utils/render-watch', () => ({
    watchInventory: vi.fn(),
    unwatchRendered: vi.fn()
}));

const helmet: MhoItem = { id: 1, img: 'item/helmet.png' } as any;
const bread: MhoItem = { id: 2, img: 'item/bread.png' } as any;

function itemImg(item: MhoItem, locked: boolean): void {
    const li = document.createElement('li');
    li.classList.add('item');
    if (locked) li.classList.add('locked');
    const img = document.createElement('img');
    img.src = `https://cdn.example/build/images/${item.img}`;
    li.appendChild(img);
    const inventory = document.createElement('ul');
    inventory.classList.add('inventory');
    inventory.appendChild(li);
    document.body.appendChild(inventory);
}

beforeEach(() => {
    state.items = [helmet, bread];
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe('getItemIdsInCell', () => {
    it('ignore un objet équipé (.locked) sans version non équipée sur la case', () => {
        itemImg(helmet, true);

        expect(getItemIdsInCell().has(helmet.id)).toBe(false);
    });

    it('inclut un objet équipé si une version non équipée existe aussi sur la case', () => {
        itemImg(helmet, true);
        itemImg(helmet, false);

        expect(getItemIdsInCell().has(helmet.id)).toBe(true);
    });

    it('inclut normalement un objet non équipé', () => {
        itemImg(bread, false);

        expect(getItemIdsInCell().has(bread.id)).toBe(true);
    });
});

describe('displayWishlistInApp — tableau in-game (atelier)', () => {
    function wishlistItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
        return {
            item: bread,
            count: 1,
            bankCount: 0,
            bagCount: 0,
            chestCount: 0,
            chestCitizens: [],
            mapCellItemCount: 0,
            depot: 0,
            priority: 0,
            zoneXPa: 0,
            isWorkshop: true,
            shouldSignal: false,
            ...overrides
        };
    }

    beforeEach(() => {
        document.body.innerHTML = '<div class="row-table"></div>';
        state.mho_parameters = { display_wishlist: true };
        state.wishlist = { wishList: [wishlistItem()] };
    });

    it('affiche autant de cellules de données que d\'en-têtes (une entrée par colonne de `wishlist_headers`, coffres/carte compris)', () => {
        displayWishlistInApp();

        const header_count: number = document.querySelectorAll('.mho-header.bottom > .cell').length;
        const row_count: number = document.querySelectorAll('.row-flex:not(.mho-header) > .cell').length;

        expect(row_count).toBe(header_count);
    });
});

describe('collapseGroupRows', () => {
    const b6a: MhoItem = { id: 10, img: 'item/b6a.png' } as any;
    const b6b: MhoItem = { id: 11, img: 'item/b6b.png' } as any;

    function row(item: MhoItem, overrides: Partial<WishlistItem> = {}): WishlistItem {
        return {
            item, count: 5, bankCount: 1, bagCount: 1, chestCount: 1, chestCitizens: [], mapCellItemCount: 1,
            depot: 0, priority: 0, zoneXPa: 0, isWorkshop: false, shouldSignal: false, ...overrides
        };
    }

    it('fusionne les membres présents en une ligne, compteurs sommés sur tous les membres du groupe', () => {
        const a: WishlistItem = row(b6a, { groupUid: 'g1', bankCount: 2, bagCount: 1 });
        const b: WishlistItem = row(b6b, { groupUid: 'g1', bankCount: 3, bagCount: 0 });
        const wishlist = { wishList: [a, b], groups: [{ uid: 'g1', name: 'B6', priority: 0, zoneXPa: 0, depot: 0, count: 5 }] };

        const rows = collapseGroupRows([a, b], wishlist);

        expect(rows.length).toBe(1);
        expect(rows[0].group_name).toBe('B6');
        expect(rows[0].group_items.length).toBe(2);
        expect(rows[0].bankCount).toBe(5);
        expect(rows[0].bagCount).toBe(1);
        expect(rows[0].chestCount).toBe(2);
        expect(rows[0].mapCellItemCount).toBe(2);
    });

    it('somme aussi les membres absents de la case', () => {
        const a: WishlistItem = row(b6a, { groupUid: 'g1', bankCount: 2 });
        const b: WishlistItem = row(b6b, { groupUid: 'g1', bankCount: 3 });
        const wishlist = { wishList: [a, b], groups: [{ uid: 'g1', name: 'B6', priority: 0, zoneXPa: 0, depot: 0, count: 5 }] };

        const rows = collapseGroupRows([a], wishlist);

        expect(rows.length).toBe(1);
        expect(rows[0].group_items.length).toBe(1);
        expect(rows[0].bankCount).toBe(5);
    });

    it('laisse les lignes seules et une liste sans groupes inchangées', () => {
        const a: WishlistItem = row(b6a);
        const b: WishlistItem = row(b6b, { groupUid: 'g1' });

        expect(collapseGroupRows([a], { wishList: [a] })).toEqual([a]);
        expect(collapseGroupRows([b], { wishList: [b] })).toEqual([b]);
    });
});

describe('displayWishlistInApp — ligne de groupe', () => {
    it('affiche le nom du groupe et le manquant = stock du groupe − (banque + sacs)', () => {
        const b6a: MhoItem = { id: 10, img: 'item/b6a.png', label: { fr: 'A' } } as any;
        const b6b: MhoItem = { id: 11, img: 'item/b6b.png', label: { fr: 'B' } } as any;
        const base = { count: 10, chestCount: 0, chestCitizens: [], mapCellItemCount: 0, depot: 0, priority: 0, zoneXPa: 0, isWorkshop: true, shouldSignal: false, groupUid: 'g1' };
        const a: WishlistItem = { ...base, item: b6a, bankCount: 2, bagCount: 1 };
        const b: WishlistItem = { ...base, item: b6b, bankCount: 3, bagCount: 0 };
        document.body.innerHTML = '<div class="row-table"></div>';
        state.mho_parameters = { display_wishlist: true };
        state.wishlist = { wishList: [a, b], groups: [{ uid: 'g1', name: 'B6', priority: 0, zoneXPa: 0, depot: 0, count: 10 }] };

        displayWishlistInApp();

        const rows = document.querySelectorAll('.row-flex:not(.mho-header)');
        expect(rows.length).toBe(1);
        const cells = Array.from(rows[0].querySelectorAll('.cell')) as HTMLElement[];
        expect(cells[0].textContent).toContain('B6');
        expect(cells[cells.length - 1].textContent).toBe('4');
    });
});
