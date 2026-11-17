import { NightwatchItemDefDTO, NightwatchReferentialDTO } from './nightwatch.types';

/** Coffre d'un citoyen ; `items_broken[id]` = unités cassées de `items[id]` ; `updated_at` : date ISO ou null. */
export interface ChestStock {
    user_id: number;
    items: Record<number, number>;
    items_broken: Record<number, number>;
    updated_at: string | null;
}

/** Sources d'objets de la ville ; chaque `*_broken` = unités cassées incluses dans le total correspondant. */
export interface StockSources {
    bags: Record<number, Record<number, number>>;
    bags_broken: Record<number, Record<number, number>>;
    chests: ChestStock[];
    bank: Record<number, number>;
    bank_broken: Record<number, number>;
    desert: Record<number, number>;
    desert_broken: Record<number, number>;
    manual: Record<number, number>;
}

/** Bilan d'un objet requis ; seules les unités intactes sont disponibles, le désert est exclu. */
export interface StockLine {
    item_id: number;
    need: number;
    in_bag: number;
    in_chests: number;
    in_bank: number;
    in_desert: number;
    manual: number;
    broken_in_town: number;
    available_in_town: number;
    remaining: number;
    stale_chest: boolean;
    unknown_age: boolean;
    /** Mise à jour la plus ancienne (date ISO) des coffres qui contribuent ; `null` si aucune date n'est connue. */
    oldest_chest_update: string | null;
}

/** Coût de remise en état et de recharge des objets requis. */
export interface CostSummary {
    repair_pa: number;
    batteries: number;
    water: number;
}

const MS_PER_HOUR: number = 3600000;

/**
 * Unités intactes.
 * @param total total
 * @param broken unités cassées
 * @returns total - cassées, jamais négatif
 */
function intact(total: number | undefined, broken: number | undefined): number {
    return Math.max(0, (total ?? 0) - (broken ?? 0));
}

/**
 * Bilan des objets requis par les veilleurs d'un plan.
 * @param watchers veilleurs et objets attribués
 * @param sources sources d'objets de la ville
 * @param now date courante
 * @param stale_after_hours âge (heures) au-delà duquel un coffre est périmé
 * @returns une ligne par objet requis, triée par identifiant
 */
export function computeStock(
    watchers: ReadonlyArray<{ user_id: number; items: Record<number, number> }>,
    sources: StockSources,
    now: Date,
    stale_after_hours: number
): StockLine[] {
    const needs: Map<number, number> = new Map<number, number>();
    const in_bag: Map<number, number> = new Map<number, number>();
    const broken_bag: Map<number, number> = new Map<number, number>();

    for (const watcher of watchers) {
        for (const key of Object.keys(watcher.items)) {
            const id: number = Number(key);
            const need: number = watcher.items[id];
            if (!(need > 0)) {
                continue;
            }
            const bag: number = sources.bags[watcher.user_id]?.[id] ?? 0;
            const bag_broken: number = sources.bags_broken[watcher.user_id]?.[id] ?? 0;
            needs.set(id, (needs.get(id) ?? 0) + need);
            in_bag.set(id, (in_bag.get(id) ?? 0) + Math.min(need, intact(bag, bag_broken)));
            broken_bag.set(id, (broken_bag.get(id) ?? 0) + Math.min(bag, bag_broken));
        }
    }

    const lines: StockLine[] = [];
    for (const id of Array.from(needs.keys()).sort((a: number, b: number): number => a - b)) {
        const need: number = needs.get(id) ?? 0;
        let in_chests: number = 0;
        let broken_chests: number = 0;
        let stale_chest: boolean = false;
        let unknown_age: boolean = false;
        let oldest_chest_update: string | null = null;
        let oldest_time: number = Number.POSITIVE_INFINITY;
        for (const chest of sources.chests) {
            const total: number = chest.items[id] ?? 0;
            if (total <= 0) {
                continue;
            }
            in_chests += intact(total, chest.items_broken[id]);
            broken_chests += Math.min(total, chest.items_broken[id] ?? 0);
            const updated: number = chest.updated_at === null ? Number.NaN : Date.parse(chest.updated_at);
            if (Number.isNaN(updated)) {
                unknown_age = true;
            } else {
                if (now.getTime() - updated > stale_after_hours * MS_PER_HOUR) {
                    stale_chest = true;
                }
                if (updated < oldest_time) {
                    oldest_time = updated;
                    oldest_chest_update = chest.updated_at;
                }
            }
        }
        const bag: number = in_bag.get(id) ?? 0;
        const bank: number = intact(sources.bank[id], sources.bank_broken[id]);
        const manual: number = Math.max(0, sources.manual[id] ?? 0);
        const available: number = bag + in_chests + bank + manual;
        lines.push({
            item_id: id,
            need,
            in_bag: bag,
            in_chests,
            in_bank: bank,
            in_desert: intact(sources.desert[id], sources.desert_broken[id]),
            manual,
            broken_in_town: (broken_bag.get(id) ?? 0) + broken_chests
                + Math.min(sources.bank[id] ?? 0, sources.bank_broken[id] ?? 0),
            available_in_town: available,
            remaining: Math.max(0, need - available),
            stale_chest,
            unknown_age,
            oldest_chest_update
        });
    }
    return lines;
}

/**
 * Coût des objets requis : PA de réparation, piles et eau des rechargeables.
 * @param lines bilan des objets
 * @param referential référentiel de veille
 * @returns coûts cumulés ; objets inconnus et usages `single`/`permanent` ignorés
 */
export function computeCost(lines: StockLine[], referential: NightwatchReferentialDTO): CostSummary {
    const cost: CostSummary = { repair_pa: 0, batteries: 0, water: 0 };
    for (const line of lines) {
        const def: NightwatchItemDefDTO | undefined = referential.items[line.item_id];
        if (def === undefined) {
            continue;
        }
        if (def.usage === 'repair') {
            cost.repair_pa += def.repairPa * line.need;
        } else if (def.usage === 'recharge') {
            cost.batteries += def.batteries * line.need;
            cost.water += def.water * line.need;
        }
    }
    return cost;
}
