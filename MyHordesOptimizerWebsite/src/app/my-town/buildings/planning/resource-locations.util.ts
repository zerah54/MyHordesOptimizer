import { Bag } from '../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';

/** Citoyen qui détient un objet, dans son sac ou son coffre. */
export interface ItemHolder {
    name: string;
    /** Exemplaires détenus, cassés compris. */
    count: number;
    broken: number;
}

/**
 * Détenteurs de chaque objet, cassés compris comme le compte du serveur, triés par nom.
 * @param {readonly Citizen[]} citizens Citoyens.
 * @param {(citizen: Citizen) => Bag | undefined} storage Rangement lu : sac ou coffre.
 * @returns {Map<number, ItemHolder[]>} Détenteurs par identifiant d'objet.
 */
export function holdersByItem(citizens: readonly Citizen[], storage: (citizen: Citizen) => Bag | undefined): Map<number, ItemHolder[]> {
    const holders: Map<number, ItemHolder[]> = new Map<number, ItemHolder[]>();
    for (const citizen of citizens) {
        const held: Map<number, ItemHolder> = new Map<number, ItemHolder>();
        for (const item of storage(citizen)?.items ?? []) {
            const holder: ItemHolder = held.get(item.id) ?? { name: citizen.name, count: 0, broken: 0 };
            held.set(item.id, { ...holder, count: holder.count + 1, broken: holder.broken + (item.is_broken === true ? 1 : 0) });
        }
        held.forEach((holder: ItemHolder, item_id: number): void => {
            holders.set(item_id, [...(holders.get(item_id) ?? []), holder]);
        });
    }
    holders.forEach((list: ItemHolder[]): void => {
        list.sort((a: ItemHolder, b: ItemHolder): number => a.name.localeCompare(b.name));
    });
    return holders;
}
