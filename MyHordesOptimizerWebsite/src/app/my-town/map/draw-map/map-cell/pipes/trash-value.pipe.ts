import { Pipe, PipeTransform } from '@angular/core';

import { Property } from '../../../../../_abstract_model/enum/property.enum';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { MapOptions } from '../../../map.component';

/** Décharge. */
const DUMP_UID: string = 'small_trash_#00';
/** Décharge humidifiée : +1 point par objet jeté. */
const HUMIDIFIED_DUMP_UID: string = 'small_trash_#06';

/** Catégorie d'objets jetables à la Décharge. */
interface DumpCategory {
    /** Propriété d'objet qui rend l'objet jetable. */
    property: string;
    /** Objets jetables dans la catégorie sans en avoir la propriété. */
    added_uids: readonly string[];
    /** Défense ajoutée à chaque objet à partir de `level`. */
    bonus: number;
    /** Niveau d'évolution de la Décharge requis pour le bonus. */
    level: number;
}

/** Recopie de `DumpUpgradesCheckListener::getDumpItemDef` (jeu), dans son ordre : la dernière catégorie qui correspond donne la valeur. */
const DUMP_CATEGORIES: readonly DumpCategory[] = [
    { property: 'weapon', added_uids: ['machine_gun_#00', 'gun_#00', 'chair_basic_#00', 'machine_1_#00', 'machine_2_#00', 'machine_3_#00', 'pc_#00'], bonus: 5, level: 1 },
    { property: 'defence', added_uids: [], bonus: 2, level: 2 },
    { property: 'food', added_uids: [], bonus: 3, level: 1 },
    { property: 'pet', added_uids: ['tekel_#00', 'pet_dog_#00'], bonus: 6, level: 2 },
    { property: 'wood', added_uids: ['wood_bad_#00', 'wood2_#00'], bonus: 1, level: 3 },
    { property: 'metal', added_uids: ['metal_bad_#00', 'metal_#00'], bonus: 1, level: 3 }
];

/** Évolutions de la Décharge qui changent la défense apportée. */
export interface DumpUpgrades {
    /** Niveau d'évolution, 0 si la Décharge n'est pas construite. */
    level: number;
    humidified: boolean;
}

/** Décharge non construite : 1 point par objet. */
export const NO_DUMP: DumpUpgrades = { level: 0, humidified: false };

/**
 * Évolutions de la Décharge d'après les chantiers construits ; inconnus, ils sont supposés non construits.
 * @param {ReadonlyMap<string, number> | null} levels Niveau par uid des chantiers construits.
 * @returns {DumpUpgrades} Évolutions.
 */
export function dumpUpgradesOf(levels: ReadonlyMap<string, number> | null): DumpUpgrades {
    if (levels === null) return NO_DUMP;
    return { level: levels.get(DUMP_UID) ?? 0, humidified: levels.has(HUMIDIFIED_DUMP_UID) };
}

/**
 * Défense d'un objet jeté à la Décharge, comme le jeu la calcule.
 * @param {Item} item Objet.
 * @param {DumpUpgrades} dump Évolutions de la Décharge.
 * @returns {number} Défense, 0 si l'objet n'est pas jetable.
 */
function dumpItemDefense(item: Item, dump: DumpUpgrades): number {
    let defense: number = 0;
    for (const category of DUMP_CATEGORIES) {
        if (item.properties.some((property: Property | undefined): boolean => property?.key === category.property) || category.added_uids.includes(item.uid)) {
            defense = 1 + (dump.level >= category.level ? category.bonus : 0);
        }
    }
    return defense > 0 && dump.humidified ? defense + 1 : defense;
}

/**
 * Valeur « décharge » d'une zone : nombre d'objets jetables, ou défense qu'ils apporteraient.
 * @param {Cell} cell Zone.
 * @param {MapOptions['trash_mode']} mode Nombre d'objets ou défense.
 * @param {Item[]} items Référentiel des objets.
 * @param {DumpUpgrades} dump Évolutions de la Décharge.
 * @returns {number} Valeur.
 */
export function trashValue(cell: Cell, mode: MapOptions['trash_mode'], items: Item[], dump: DumpUpgrades): number {
    if (!cell) return 0;

    let value: number = 0;
    for (const short_item of cell.items) {
        if (short_item.is_broken) continue;
        const item: Item | undefined = items.find((candidate: Item): boolean => candidate.id === short_item.item_id);
        if (!item) continue;
        const defense: number = dumpItemDefense(item, dump);
        if (defense > 0) {
            value += (mode === 'def' ? defense : 1) * short_item.count;
        }
    }
    return value;
}

@Pipe({
    name: 'trashValue'
})
export class TrashValuePipe implements PipeTransform {
    public transform(cell: Cell, mode: MapOptions['trash_mode'], items: Item[], dump: DumpUpgrades): number {
        return trashValue(cell, mode, items, dump);
    }
}
