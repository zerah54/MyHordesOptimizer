import { beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import type { MhoItem } from '../types';
import { detectEquippedShoes } from './equipped-shoes';

const shoes: MhoItem = { id: 10, uid: 'shoe_#00', img: 'item/item_shoe.gif', label: { fr: 'Chaussures de sport usées', en: '', de: '', es: '' } } as MhoItem;
const shovel: MhoItem = { id: 11, uid: 'pelle_#00', img: 'item/item_pelle.gif', label: { fr: 'Petite Pelle', en: '', de: '', es: '' } } as MhoItem;
const job_item: MhoItem = { id: 12, uid: 'vest_off_#00', img: 'item/item_vest_off.gif', label: { fr: 'Camouflage (inactif !)', en: '', de: '', es: '' } } as MhoItem;

/** État d'un objet du sac : libre, essentiel (`.locked.bg-locked`), ou simplement verrouillé avec tout le sac par une requête du jeu (`.locked`). */
type BagItemState = 'free' | 'essential' | 'bag-locked';

/** Objet du sac tel que rendu par le jeu (`BagInventorySlot`) : `bg-locked` n'est posé que sur les essentiels, `.locked` aussi sur tout le sac pendant une requête. */
function bagItem(item: MhoItem, item_state: BagItemState): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('item');
    if (item_state === 'essential') li.classList.add('locked', 'bg-locked');
    if (item_state === 'bag-locked') li.classList.add('locked');
    const img: HTMLImageElement = document.createElement('img');
    img.src = `https://cdn.example/build/images/${item.img}`;
    li.appendChild(img);
    return li;
}

/** Pastille de chargement du jeu : objet listé dont l'icône n'est pas encore arrivée, sans `<img>`. */
function pendingPlaceholder(): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('item', 'locked', 'pending');
    return li;
}

/** Sac pas encore chargé (`SwitchInventory`) : une seule pastille `li.placeholder`, sans emplacement. */
function loadingPlaceholder(): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('placeholder');
    return li;
}

/** Emplacement libre du sac (`li.free`), sans objet. */
function freeSlot(): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('free');
    return li;
}

/** Sac (`ul.inventory.rucksack`) contenant les éléments donnés. */
function rucksackOf(...children: HTMLLIElement[]): HTMLUListElement {
    const ul: HTMLUListElement = document.createElement('ul');
    ul.classList.add('inventory', 'rucksack');
    children.forEach((child: HTMLLIElement) => ul.appendChild(child));
    return ul;
}

beforeEach(() => {
    state.items = [shoes, shovel, job_item];
});

describe('detectEquippedShoes', () => {
    it('ne conclut rien sans sac', () => {
        expect(detectEquippedShoes(null)).toBeUndefined();
    });

    it('ne conclut rien tant que le référentiel d\'objets n\'est pas chargé', () => {
        state.items = [];

        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'essential'), bagItem(shovel, 'free')))).toBeUndefined();
    });

    it('détecte des chaussures équipées (essentielles) à côté d\'un objet libre', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'essential'), bagItem(shovel, 'free')))).toBe(true);
    });

    it('détecte des chaussures équipées même avec d\'autres objets essentiels', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(job_item, 'essential'), bagItem(shoes, 'essential'), bagItem(shovel, 'free')))).toBe(true);
    });

    it('détecte des chaussures équipées dans un sac qui ne contient que des objets essentiels', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(job_item, 'essential'), bagItem(shoes, 'essential')))).toBe(true);
    });

    it('détecte des chaussures verrouillées sans marqueur d\'essentiel à côté d\'un objet libre', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'bag-locked'), bagItem(shovel, 'free')))).toBe(true);
    });

    it('conclut à des chaussures non équipées quand elles sont portées dans le sac sans être verrouillées', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'free'), bagItem(shovel, 'free')))).toBe(false);
    });

    it('conclut à des chaussures non équipées quand il n\'y en a pas dans le sac', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(job_item, 'essential'), bagItem(shovel, 'free')))).toBe(false);
    });

    it('conclut à des chaussures non équipées dans un sac qui ne contient que des objets essentiels, sans chaussures', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(job_item, 'essential')))).toBe(false);
    });

    it('ne conclut rien avec un sac sans aucun objet', () => {
        expect(detectEquippedShoes(rucksackOf())).toBeUndefined();
    });

    it('conclut à des chaussures non équipées dans un sac chargé et vide (emplacements libres seuls)', () => {
        expect(detectEquippedShoes(rucksackOf(freeSlot(), freeSlot()))).toBe(false);
    });

    it('ne conclut rien tant que le sac n\'est pas chargé (pastille de chargement seule)', () => {
        expect(detectEquippedShoes(rucksackOf(loadingPlaceholder()))).toBeUndefined();
    });

    it('ne conclut rien tant que le sac n\'est pas chargé, même avec des emplacements libres à côté', () => {
        expect(detectEquippedShoes(rucksackOf(loadingPlaceholder(), freeSlot()))).toBeUndefined();
    });

    it('ne conclut rien quand tout le sac est verrouillé par une requête du jeu, chaussures équipées comprises', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'essential'), bagItem(shovel, 'bag-locked')))).toBeUndefined();
    });

    it('ne conclut rien quand tout le sac est verrouillé par une requête du jeu, sans chaussures', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(job_item, 'essential'), bagItem(shovel, 'bag-locked')))).toBeUndefined();
    });

    it('ne conclut rien quand des chaussures non équipées sont seules dans un sac verrouillé par une requête du jeu', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'bag-locked')))).toBeUndefined();
    });

    it('ne conclut rien tant qu\'un objet est en cours de chargement', () => {
        expect(detectEquippedShoes(rucksackOf(bagItem(shoes, 'essential'), pendingPlaceholder(), bagItem(shovel, 'free')))).toBeUndefined();
    });
});
