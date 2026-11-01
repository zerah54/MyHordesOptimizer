/** Quantité d'un objet. */
export interface ResourceCount {
    itemId: number;
    count: number;
}

/**
 * Additionne des listes de ressources par objet ; les quantités nulles ou négatives sont ignorées.
 * @param {ResourceCount[][]} lists Listes à additionner.
 * @returns {Map<number, number>} Quantité totale par identifiant d'objet.
 */
export function sumResources(lists: ResourceCount[][]): Map<number, number> {
    const total: Map<number, number> = new Map<number, number>();
    for (const list of lists) {
        for (const resource of list) {
            if (resource.count > 0) {
                total.set(resource.itemId, (total.get(resource.itemId) ?? 0) + resource.count);
            }
        }
    }
    return total;
}

/**
 * Ressources manquantes par rapport à la banque.
 * @param {ReadonlyMap<number, number>} needs Besoin par objet.
 * @param {ReadonlyMap<number, number>} bank Stock de la banque par objet.
 * @returns {ResourceCount[]} Manques strictement positifs, triés par identifiant d'objet.
 */
export function missingResources(needs: ReadonlyMap<number, number>, bank: ReadonlyMap<number, number>): ResourceCount[] {
    const missing: ResourceCount[] = [];
    needs.forEach((need: number, item_id: number): void => {
        const gap: number = need - (bank.get(item_id) ?? 0);
        if (gap > 0) {
            missing.push({ itemId: item_id, count: gap });
        }
    });
    return missing.sort((a: ResourceCount, b: ResourceCount): number => a.itemId - b.itemId);
}
