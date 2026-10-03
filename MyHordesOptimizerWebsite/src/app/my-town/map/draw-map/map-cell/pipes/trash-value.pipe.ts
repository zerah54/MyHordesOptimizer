import { Pipe, PipeTransform } from '@angular/core';

import { Property } from '../../../../../_abstract_model/enum/property.enum';
import { Trash } from '../../../../../_abstract_model/enum/trash.enum';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { MapOptions } from '../../../map.component';

/** Table des propriétés « décharge » : identique pour toutes les cases, calculée une fois
 *  pour toutes plutôt qu'à chaque appel du pipe (une fois par case, soit ~900 fois par carte). */
const TRASHES: Trash[] = Trash.getAllValues();

/** TODO : ces trois valeurs sont des hypothèses en dur tant que la décharge est en développement
 *  (le type de carte « Décharge » n'est proposé qu'en dev). Elles devront venir de la ville :
 *  décharge construite, décharge humidifiée, et chantier de spécialisation. */
const HAS_TRASH: boolean = true;
const HAS_WET_TRASH: boolean = true;
const HAS_SPECIALIZED_TRASH: boolean = true;

/** Valeur « décharge » d'une zone : nombre d'objets, ou défense apportée si le mode le demande.
 *  Exportée en fonction : la case en a besoin dans un `computed`. */
export function trashValue(cell: Cell, option: MapOptions, items: Item[]): number {
    if (!cell || !HAS_TRASH) return 0;

    let value: number = 0;
    cell.items.forEach((short_item: ItemCountShort): void => {
        const item: Item | undefined = items.find((candidate: Item): boolean => candidate.id === short_item.item_id);
        if (!item) return;

        TRASHES
            .filter((trash: Trash) => item.properties?.find((property: Property): boolean => trash.value.property?.key === property?.key))
            .forEach((trash: Trash): void => {
                if (option.trash_mode === 'def') {
                    const unit_value: number = (HAS_WET_TRASH ? trash.value.improved_value : trash.value.value)
                        + (HAS_SPECIALIZED_TRASH ? trash.value.specialized_trash_add_value : 0);
                    value += unit_value * short_item.count;
                } else {
                    value += short_item.count;
                }
            });
    });
    return value;
}

@Pipe({
    name: 'trashValue'
})
export class TrashValuePipe implements PipeTransform {
    public transform(cell: Cell, option: MapOptions, items: Item[]): number {
        return trashValue(cell, option, items);
    }
}
