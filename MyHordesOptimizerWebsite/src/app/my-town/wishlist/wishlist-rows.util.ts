import { WishlistGroup } from '../../_abstract_model/types/wishlist-group.class';
import { WishlistInfo } from '../../_abstract_model/types/wishlist-info.class';
import { WishlistItem } from '../../_abstract_model/types/wishlist-item.class';

export type WishlistBlock =
    | { kind: 'item'; item: WishlistItem }
    | { kind: 'group'; group: WishlistGroup; members: WishlistItem[] };

export interface WishlistGroupTotals {
    bank_count: number;
    bag_count: number;
    chest_count: number;
    map_cell_item_count: number;
    /** Quantité manquante, null si le stock est infini. */
    needed: number | null;
}

export type WishlistRow =
    | { kind: 'item'; item: WishlistItem }
    | { kind: 'group'; group: WishlistGroup; members: WishlistItem[]; totals: WishlistGroupTotals; expanded: boolean }
    | { kind: 'member'; item: WishlistItem; group: WishlistGroup };

/** Identité d'une ligne : un objet ne figure qu'une fois par zone. */
export function wishlistItemKey(row: WishlistItem): string {
    return `${row.item.id}_${row.zone_x_pa}`;
}

/** Blocs de la liste (lignes seules et groupes), par priorité décroissante. */
export function blocksOf(info: WishlistInfo): WishlistBlock[] {
    const group_uids: Set<string> = new Set(info.groups.map((group: WishlistGroup): string => group.uid));
    const blocks: WishlistBlock[] = [
        ...info.wishlist_items
            .filter((item: WishlistItem): boolean => item.group_uid === null || !group_uids.has(item.group_uid))
            .map((item: WishlistItem): WishlistBlock => ({ kind: 'item', item })),
        ...info.groups.map((group: WishlistGroup): WishlistBlock => ({ kind: 'group', group, members: info.membersOf(group.uid) }))
    ];
    return blocks.sort((a: WishlistBlock, b: WishlistBlock): number => blockPriority(b) - blockPriority(a));
}

/** Priorité d'un bloc. */
function blockPriority(block: WishlistBlock): number {
    return block.kind === 'item' ? block.item.priority : block.group.priority;
}

/** Renumérote les blocs (999 en descendant, 1000 - facteur si le dépôt est < -1) ; les membres héritent du groupe. */
export function resetBlockPriorities(blocks: readonly WishlistBlock[]): void {
    let priority_factor: number = 999;
    blocks.forEach((block: WishlistBlock): void => {
        const owner: WishlistItem | WishlistGroup = block.kind === 'item' ? block.item : block.group;
        owner.priority = owner.depot.value.count < -1 ? 1000 - priority_factor : priority_factor;
        if (block.kind === 'group') {
            block.members.forEach((member: WishlistItem): void => {
                member.priority = block.group.priority;
            });
        }
        priority_factor--;
    });
}

/** Totaux d'un groupe : somme des membres, manquant = stock - (banque + sacs). */
export function groupTotals(group: WishlistGroup, members: readonly WishlistItem[]): WishlistGroupTotals {
    const sum: (pick: (member: WishlistItem) => number) => number =
        (pick: (member: WishlistItem) => number): number => members.reduce((total: number, member: WishlistItem): number => total + (pick(member) ?? 0), 0);
    const bank_count: number = sum((member: WishlistItem): number => member.bank_count);
    const bag_count: number = sum((member: WishlistItem): number => member.bag_count);
    return {
        bank_count,
        bag_count,
        chest_count: sum((member: WishlistItem): number => member.chest_count),
        map_cell_item_count: sum((member: WishlistItem): number => member.map_cell_item_count),
        needed: group.count < 0 ? null : group.count - bank_count - bag_count
    };
}

/** Lignes affichées ; le filtre par nom garde un groupe si son nom ou un membre correspond (groupe alors déplié). */
export function buildWishlistRows(blocks: readonly WishlistBlock[], expanded: ReadonlySet<string>, name_filter: string, locale: string): WishlistRow[] {
    const filter: string = name_filter.trim().toLocaleLowerCase();
    const matches: (text: string | undefined) => boolean = (text: string | undefined): boolean => filter === '' || (text ?? '').toLocaleLowerCase().includes(filter);
    const rows: WishlistRow[] = [];
    blocks.forEach((block: WishlistBlock): void => {
        if (block.kind === 'item') {
            if (matches(block.item.item.label[locale])) rows.push({ kind: 'item', item: block.item });
            return;
        }
        const group_matches: boolean = matches(block.group.name);
        const kept: WishlistItem[] = group_matches ? block.members : block.members.filter((member: WishlistItem): boolean => matches(member.item.label[locale]));
        if (!group_matches && kept.length === 0) return;
        const is_expanded: boolean = group_matches ? expanded.has(block.group.uid) : true;
        rows.push({ kind: 'group', group: block.group, members: kept, totals: groupTotals(block.group, block.members), expanded: is_expanded });
        if (is_expanded) {
            [...kept]
                .sort((a: WishlistItem, b: WishlistItem): number => (a.item.label[locale] ?? '').localeCompare(b.item.label[locale] ?? ''))
                .forEach((member: WishlistItem): void => {
                    rows.push({ kind: 'member', item: member, group: block.group });
                });
        }
    });
    return rows;
}
