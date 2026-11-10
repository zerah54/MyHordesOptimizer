import { Property } from '../../../../../_abstract_model/enum/property.enum';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { DumpUpgrades, dumpUpgradesOf, NO_DUMP, trashValue } from './trash-value.pipe';

/**
 * Objet du référentiel.
 * @param {number} id Identifiant.
 * @param {string} uid Uid du jeu.
 * @param {Property[]} properties Propriétés.
 * @returns {Item} Objet.
 */
function item(id: number, uid: string, properties: Property[] = []): Item {
    return Object.assign(new Item(), { id, uid, properties });
}

/**
 * Case portant les objets donnés.
 * @param {Partial<ItemCountShort>[]} items Objets au sol.
 * @returns {Cell} Case.
 */
function cellWith(...items: Partial<ItemCountShort>[]): Cell {
    return Object.assign(new Cell(), { items: items.map((short: Partial<ItemCountShort>): ItemCountShort => Object.assign(new ItemCountShort(), { is_broken: false, ...short })) });
}

const WEAPON: Item = item(1, 'knife_#00', [Property.WEAPON]);
const WEAPON_AND_DEFENCE: Item = item(2, 'chain_#00', [Property.WEAPON, Property.DEFENCE]);
const WOOD: Item = item(3, 'wood2_#00', [Property.RESSOURCE]);
const TEKEL: Item = item(4, 'tekel_#00', [Property.DEFENCE]);
const USELESS: Item = item(5, 'water_#00', [Property.IS_WATER]);
const ITEMS: Item[] = [WEAPON, WEAPON_AND_DEFENCE, WOOD, TEKEL, USELESS];

/**
 * Défense apportée par une case.
 * @param {Cell} cell Case.
 * @param {DumpUpgrades} dump Évolutions de la Décharge.
 * @returns {number} Défense.
 */
function defense(cell: Cell, dump: DumpUpgrades): number {
    return trashValue(cell, 'def', ITEMS, dump);
}

describe('trashValue', (): void => {
    it('compte les objets jetables, une seule fois chacun', (): void => {
        const cell: Cell = cellWith({ item_id: WEAPON.id, count: 2 }, { item_id: WEAPON_AND_DEFENCE.id, count: 3 }, { item_id: USELESS.id, count: 4 });
        expect(trashValue(cell, 'nb', ITEMS, NO_DUMP)).toBe(5);
    });

    it('ignore les objets cassés, que le jeu ne laisse pas jeter', (): void => {
        const cell: Cell = cellWith({ item_id: WEAPON.id, count: 2, is_broken: true }, { item_id: WEAPON.id, count: 1 });
        expect(trashValue(cell, 'nb', ITEMS, NO_DUMP)).toBe(1);
        expect(defense(cell, NO_DUMP)).toBe(1);
    });

    it('donne 1 point par objet tant que la Décharge n\'a pas évolué', (): void => {
        expect(defense(cellWith({ item_id: WEAPON.id, count: 2 }), NO_DUMP)).toBe(2);
    });

    it('ajoute le bonus de la catégorie à partir du niveau requis', (): void => {
        const cell: Cell = cellWith({ item_id: WEAPON.id, count: 2 });
        expect(defense(cell, { level: 1, humidified: false })).toBe(12);
        expect(defense(cellWith({ item_id: TEKEL.id, count: 1 }), { level: 1, humidified: false })).toBe(1);
        expect(defense(cellWith({ item_id: TEKEL.id, count: 1 }), { level: 2, humidified: false })).toBe(7);
    });

    it('ajoute 1 point par objet avec la Décharge humidifiée', (): void => {
        expect(defense(cellWith({ item_id: WEAPON.id, count: 2 }), { level: 1, humidified: true })).toBe(14);
        expect(defense(cellWith({ item_id: USELESS.id, count: 2 }), { level: 1, humidified: true })).toBe(0);
    });

    it('retient la dernière catégorie qui correspond, dans l\'ordre du jeu', (): void => {
        // Arme puis défense : la défense l'emporte, son bonus n'arrive qu'au niveau 2.
        expect(defense(cellWith({ item_id: WEAPON_AND_DEFENCE.id, count: 1 }), { level: 1, humidified: false })).toBe(1);
        expect(defense(cellWith({ item_id: WEAPON_AND_DEFENCE.id, count: 1 }), { level: 2, humidified: false })).toBe(3);
    });

    it('prend les objets ajoutés à une catégorie sans en avoir la propriété', (): void => {
        expect(trashValue(cellWith({ item_id: WOOD.id, count: 3 }), 'nb', ITEMS, NO_DUMP)).toBe(3);
        expect(defense(cellWith({ item_id: WOOD.id, count: 3 }), { level: 2, humidified: false })).toBe(3);
    });
});

describe('dumpUpgradesOf', (): void => {
    it('suppose la Décharge non construite quand l\'état des chantiers est inconnu', (): void => {
        expect(dumpUpgradesOf(null)).toEqual(NO_DUMP);
    });

    it('lit le niveau de la Décharge et la Décharge humidifiée', (): void => {
        expect(dumpUpgradesOf(new Map<string, number>([['small_trash_#00', 2], ['small_trash_#06', 0]]))).toEqual({ level: 2, humidified: true });
        expect(dumpUpgradesOf(new Map<string, number>([['small_trash_#00', 1]]))).toEqual({ level: 1, humidified: false });
        expect(dumpUpgradesOf(new Map<string, number>())).toEqual(NO_DUMP);
    });
});
