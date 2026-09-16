import { describe, expect, it } from 'vitest';

import { state } from '../state';
import type { MhoItem, MhoItemSummary, WishlistItem } from '../types';
import { createAdvancedProperties } from './tooltips';

function baseItem(overrides: Partial<MhoItem> = {}): MhoItem {
    return {
        id: 1,
        img: 'item/item_x.gif',
        label: { fr: 'X', en: 'X', de: 'X', es: 'X' },
        recipes: [],
        ...overrides
    };
}

describe('createAdvancedProperties — relation ouvre-boîte sur un container pur', () => {
    it('displays the openedWith row even when the item has no properties, actions, recipes or deco', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const openers: MhoItemSummary[] = [
            { uid: 'can_opener_#00', img: 'item/item_can_opener.gif', imgBroken: null, label: { fr: 'Ouvre-boîte', en: 'Can opener', de: 'Dosenöffner', es: 'Abrelatas' } }
        ];
        const item: MhoItem = baseItem({ openedWith: openers, openApCost: null, openSuccessRate: null, technicianOpenCpCost: null });

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.querySelectorAll('.item').length).toBe(1);
    });

    it('displays the opens row even when the item has no properties, actions, recipes or deco', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const boxes: MhoItemSummary[] = [
            { uid: 'chest_#00', img: 'item/item_chest.gif', imgBroken: null, label: { fr: 'Coffre', en: 'Chest', de: 'Truhe', es: 'Cofre' } }
        ];
        const item: MhoItem = baseItem({ opens: boxes });

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.querySelector('.mho-opener-relation-row')).not.toBeNull();
    });

    it('still returns early when the item truly has nothing to show', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const item: MhoItem = baseItem();

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.children.length).toBe(0);
    });
});

describe('createAdvancedProperties — zone quantités (souhaité/dépôt, banque/carte, sacs/coffres)', () => {
    function wishlistItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
        return {
            item: baseItem({ id: 1 }),
            count: 1,
            bankCount: 0,
            bagCount: 0,
            chestCount: 0,
            chestCitizens: [],
            mapCellItemCount: 0,
            depot: 0,
            priority: 0,
            zoneXPa: 0,
            isWorkshop: false,
            shouldSignal: false,
            ...overrides
        };
    }

    function getChips(stock_div: Element): HTMLElement[] {
        return Array.from(stock_div.querySelector('.mho-stock-chips')?.children ?? []) as HTMLElement[];
    }

    it('affiche toujours les 4 chips banque/carte/sacs/coffres avec une icône titrée, même sans wishlist', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = undefined;

        const item: MhoItem = baseItem({ id: 1, bankCount: 5, bagCount: 3, chestCount: 2, mapCellItemCount: 4 });
        const tooltip: HTMLDivElement = document.createElement('div');
        const content: HTMLDivElement = document.createElement('div');

        createAdvancedProperties(content, item, tooltip);

        const stock_div = content.children[0];
        expect(stock_div.querySelector('.mho-wishlist-goal')).toBeNull();
        const chips: HTMLElement[] = getChips(stock_div);
        expect(chips.length).toBe(4);
        chips.forEach((chip) => expect(chip.querySelector('img').title).not.toBe(''));
        expect(chips.map((chip) => chip.querySelector('span').innerText)).toEqual(['5', '4', '3', '2']);
    });

    it('n\'ajoute qu\'une seule séparation (bas), pas de bordure supplémentaire au-dessus du bandeau objectif', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = { wishList: [wishlistItem({ count: 5, bankCount: 2 })] };

        const item: MhoItem = baseItem({ id: 1, bankCount: 2 });
        const tooltip: HTMLDivElement = document.createElement('div');
        const content: HTMLDivElement = document.createElement('div');

        createAdvancedProperties(content, item, tooltip);

        const stock_div = content.children[0] as HTMLElement;
        expect(stock_div.style.borderBottom).not.toBe('');
        const goal_row = stock_div.querySelector('.mho-wishlist-goal') as HTMLElement;
        expect(goal_row.style.borderTop).toBe('');
        expect(goal_row.style.borderBottom).toBe('');
    });

    it('ajoute le bandeau objectif quand la quantité voulue est illimitée (-1), même avec du stock en banque', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = { wishList: [wishlistItem({ count: -1, bankCount: 5 })] };

        const item: MhoItem = baseItem({ id: 1, bankCount: 5 });
        const tooltip: HTMLDivElement = document.createElement('div');
        const content: HTMLDivElement = document.createElement('div');

        createAdvancedProperties(content, item, tooltip);

        const stock_div = content.children[0];
        const goal_row = stock_div.querySelector('.mho-wishlist-goal') as HTMLElement;
        expect(goal_row).not.toBeNull();
        expect((goal_row.children[0] as HTMLElement).innerText).toContain('∞');
    });

    it('rajoute quand même le bandeau objectif quand la banque couvre déjà la quantité voulue (sinon on se demande pourquoi il manque)', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = { wishList: [wishlistItem({ count: 3, bankCount: 5, depot: 0 })] };

        const item: MhoItem = baseItem({ id: 1, bankCount: 5 });
        const tooltip: HTMLDivElement = document.createElement('div');
        const content: HTMLDivElement = document.createElement('div');

        createAdvancedProperties(content, item, tooltip);

        const stock_div = content.children[0];
        const goal_row = stock_div.querySelector('.mho-wishlist-goal') as HTMLElement;
        expect(goal_row).not.toBeNull();
        expect((goal_row.children[0] as HTMLElement).innerText).toContain('3');
    });

    it('colore le badge dépôt selon la destination (marron traductions / bleu clair items / bleu foncé properties)', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;

        const buildGoal = (depot: number): HTMLElement => {
            state.wishlist = { wishList: [wishlistItem({ count: 1, depot })] };
            const content: HTMLDivElement = document.createElement('div');
            createAdvancedProperties(content, baseItem({ id: 1 }), document.createElement('div'));
            return (content.children[0].querySelector('.mho-wishlist-goal') as HTMLElement).children[1] as HTMLElement;
        };

        expect(buildGoal(0).style.backgroundColor).toBe('rgb(92, 43, 32)'); // #5c2b20 — Banque, comme .brown-tag
        expect(buildGoal(1).style.backgroundColor).toBe('rgb(59, 50, 73)'); // #3b3249 — Zone de rapatriement, bleu clair des items
        expect(buildGoal(-1000).style.backgroundColor).toBe('rgb(2, 33, 66)'); // #022142 — Ne pas ramener, bleu foncé des properties
    });

    it('espace symétriquement la zone quantités du contenu au-dessus et en dessous', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = undefined;

        const item: MhoItem = baseItem({ id: 1 });
        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, document.createElement('div'));

        const stock_div = content.children[0] as HTMLElement;
        expect(stock_div.style.marginTop).not.toBe('');
        expect(stock_div.style.marginTop).toBe(stock_div.style.marginBottom);
    });
});
