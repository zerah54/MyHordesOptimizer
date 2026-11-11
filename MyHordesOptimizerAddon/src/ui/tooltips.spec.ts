import { describe, expect, it } from 'vitest';

import { texts } from '../i18n/texts';
import { state } from '../state';
import type { MhoItem, MhoItemSummary, WishlistItem } from '../types';
import { getI18N } from '../utils/i18n';
import { createAdvancedProperties, displayPropertiesOrActions } from './tooltips';

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

    it('préfixe le stock souhaité du nom du groupe pour un objet de groupe', () => {
        state.mho_parameters = { enhanced_tooltips_item_quantities: true };
        state.mh_user = undefined;
        state.wishlist = {
            wishList: [wishlistItem({ count: 5, groupUid: 'g1' })],
            groups: [{ uid: 'g1', name: 'B6', priority: 0, zoneXPa: 0, depot: 0, count: 5 }]
        };

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, baseItem({ id: 1 }), document.createElement('div'));

        const goal_row = content.children[0].querySelector('.mho-wishlist-goal') as HTMLElement;
        expect((goal_row.children[0] as HTMLElement).innerText).toContain('B6 · ');
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

describe('displayPropertiesOrActions — appareil photo et textes localisés', () => {
    it('affiche 35 % et 30 s pour flash_photo_1', () => {
        const text: string = displayPropertiesOrActions('flash_photo_1', baseItem()).innerText;
        expect(text).toContain('35');
        expect(text).toContain('30');
    });

    it('affiche 69 % et 60 s pour flash_photo_2', () => {
        const text: string = displayPropertiesOrActions('flash_photo_2', baseItem()).innerText;
        expect(text).toContain('69');
        expect(text).toContain('60');
    });

    it('affiche 99 % et 120 s pour flash_photo_3', () => {
        const text: string = displayPropertiesOrActions('flash_photo_3', baseItem()).innerText;
        expect(text).toContain('99');
        expect(text).toContain('120');
    });

    it('affiche 100 % pour flash_photo_4', () => {
        expect(displayPropertiesOrActions('flash_photo_4', baseItem()).innerText).toContain('100');
    });

    it('localise can_cook (jsdom en anglais)', () => {
        const text: string = displayPropertiesOrActions('can_cook', baseItem()).innerText;
        expect(text).not.toBe('Peut être cuisiné');
        expect(text.length).toBeGreaterThan(0);
    });
});

const DISPLAYED_PROPERTIES: string[] = [
    'nosteal', 'inedible', 'haunting_soul', 'angry_soul', 'defence_cp', 'prevent_terror', 'found_poisoned', 'special_guitar'
];
const HIDDEN_PROPERTIES: string[] = [
    'single_use', 'defence', 'weapon', 'deco', 'box_opener', 'can_opener', 'parcel_opener', 'nw_impact_cumul',
    'food', 'drug', 'ressource', 'pet', 'lure', 'lock', 'hero_dog_fetch', 'is_water', 'nw_armory', 'nw_ikea', 'nw_trebuchet', 'nw_shooting',
    'load_pilegun', 'load_lamp'
];

describe('displayPropertiesOrActions — propriétés autrefois ignorées', () => {
    it.each(DISPLAYED_PROPERTIES)('affiche %s dans un tag non vide', (property: string) => {
        const element: HTMLDivElement = displayPropertiesOrActions(property, baseItem());
        expect(element.classList.contains('mho-item-tag')).toBe(true);
        expect(element.innerText.length).toBeGreaterThan(0);
    });

    it.each(HIDDEN_PROPERTIES)('masque %s', (property: string) => {
        expect(displayPropertiesOrActions(property, baseItem()).classList.contains('item-tag')).toBe(false);
    });

    it('affiche l\'alcool sans condition comme l\'alcool', () => {
        expect(displayPropertiesOrActions('alcohol_dx', baseItem()).classList.contains('item-tag-alcohol')).toBe(true);
    });
});

describe('createAdvancedProperties — tuiles d\'icônes', () => {
    /** Rend les propriétés d'un objet. */
    function render(properties: string[]): HTMLDivElement {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, baseItem({ properties }), null);
        return content;
    }

    it('regroupe coffre, chien et Désaltère en tuiles, libellé au survol de la tuile', () => {
        const tiles: HTMLElement[] = Array.from(render(['lock', 'hero_dog_fetch', 'is_water', 'nosteal']).querySelectorAll('.mho-item-tiles .mho-item-tile'));
        expect(tiles.map((tile: HTMLElement): string => tile.querySelector('img')?.src ?? '')).toEqual([
            expect.stringContaining('icons/lock.gif'), expect.stringContaining('item/item_tamed_pet.gif'), expect.stringContaining('status/status_hydrated.gif')
        ]);
        expect(tiles.every((tile: HTMLElement): boolean => tile.title.length > 0)).toBe(true);
    });

    it('affiche les chantiers du bonus de veille sur une ligne titrée', () => {
        const row: HTMLElement | null = render(['nw_armory', 'nw_shooting']).querySelector('.mho-watch-bonus');
        const tiles: HTMLElement[] = Array.from(row?.querySelectorAll('.mho-item-tile') ?? []);
        expect(row?.textContent).toContain(getI18N(texts.watch_bonus));
        expect(tiles.map((tile: HTMLElement): string => tile.querySelector('img')?.src ?? '')).toEqual([
            expect.stringContaining('building/small_grinder2.gif'), expect.stringContaining('building/small_sewers.gif')
        ]);
        expect(tiles[0].title).toBe(getI18N(texts.nw_armory));
    });

    it('n\'ajoute aucune ligne de tuiles sans propriété concernée', () => {
        expect(render(['nosteal']).querySelector('.mho-item-tiles')).toBeNull();
    });
});

describe('texts.improve', () => {
    it('conserve le texte des améliorations de camping (non écrasé par la propriété improve)', () => {
        expect(texts.improve.fr).toContain('Améliorations simples');
        expect(texts.camp_improve_property.fr).toContain('Permet d\'aménager un campement');
    });
});

describe('createAdvancedProperties — sections des fiches enrichies', () => {
    it('createAdvancedProperties ajoute les sections pour un objet qui a seulement des actionEffects', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const item: MhoItem = baseItem({
            actionEffects: [{ actionName: 'open', kind: 'Open', outcomes: [{ kind: 'Consumed', probability: 1 }] }]
        });
        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.querySelector('.mho-item-extra')).not.toBeNull();
    });
});
