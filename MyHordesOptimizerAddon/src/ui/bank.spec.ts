import { beforeEach, describe, expect, it } from 'vitest';

import { mh_optimizer_window_id } from '../config/constants';
import { state } from '../state';
import { displayItems } from './bank';

function itemFixture(overrides: Record<string, unknown> = {}): any {
    return {
        id: 42,
        category: { idCategory: 'misc', ordering: 0, label: { fr: 'Divers', en: 'Misc', de: 'Sonstiges', es: 'Varios' } },
        label: { fr: 'Objet', en: 'Item', de: 'Gegenstand', es: 'Objeto' },
        description: { fr: '', en: '', de: '', es: '' },
        img: 'item/item_x.gif',
        broken: false,
        bankCount: 0,
        wishListCount: 0,
        recipes: [],
        ...overrides
    };
}

function ensureTabContentContainer(): void {
    document.body.innerHTML = '';
    const container: HTMLDivElement = document.createElement('div');
    container.id = mh_optimizer_window_id + '-tab-content';
    document.body.appendChild(container);
}

beforeEach(() => {
    ensureTabContentContainer();
    state.mho_parameters = {} as any;
    state.mh_user = { townDetails: { townId: 12 } } as any;
});

describe('displayItems — onglet "items" (catalogue)', () => {
    it('n\'affiche pas le bouton "ajouter à la wishlist" pour un item déjà présent dans state.wishlist, même si state.items[i].wishListCount est resté à 0 (ajout fait par un autre biais — ex. le bouton de l\'onglet banque, qui mute un objet différent)', () => {
        const item = itemFixture();
        state.items = [item];
        state.wishlist = {
            wishList: [{ item: { id: 42 } as any, count: 1, bankCount: 0, bagCount: 0, depot: 0, priority: 0, zoneXPa: 0, isWorkshop: false, shouldSignal: false }]
        };

        displayItems(state.items, 'items');

        expect(document.querySelector('.add-to-wishlist')).toBeNull();
    });

    it('affiche le bouton pour un item réellement absent de la wishlist', () => {
        const item = itemFixture({ id: 99 });
        state.items = [item];
        state.wishlist = { wishList: [] };

        displayItems(state.items, 'items');

        expect(document.querySelector('.add-to-wishlist')).not.toBeNull();
    });
});
