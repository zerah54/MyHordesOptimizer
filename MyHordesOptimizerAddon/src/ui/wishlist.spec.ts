import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import type { MhoItem, WishlistItem } from '../types';
import { displayWishlistInApp, getItemIdsInCell } from './wishlist';

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
