import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { mapRouteColorVar, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { cellKey, cellOrdersOf, OwnedExpeditionOrder } from '../../expeditions/expedition-orders/expedition-orders.util';
import { describeOrder, memberLabel, partLabel } from '../../expeditions/expedition-orders/order-labels';

/** Consigne par case d'une expédition du jour, avec sa partie et son expédition. */
export interface CellOrderEntry extends OwnedExpeditionOrder {
    /** Clé de suivi, unique sur la carte. */
    readonly key: string;
    readonly expedition: Expedition;
    readonly part: ExpeditionPart;
}

/** Consignes par case (« x,y », coordonnées absolues), dans l'ordre des expéditions, des parties puis des listes. */
export type CellOrderIndex = ReadonlyMap<string, readonly CellOrderEntry[]>;

export function buildCellOrderIndex(expeditions: readonly Expedition[]): CellOrderIndex {
    const index: Map<string, CellOrderEntry[]> = new Map<string, CellOrderEntry[]>();
    const sorted: Expedition[] = [...expeditions].sort((a: Expedition, b: Expedition): number => a.position - b.position);
    for (const expedition of sorted) {
        for (const part of expedition.parts) {
            cellOrdersOf(part).forEach((owned: OwnedExpeditionOrder, rank: number): void => {
                const key: string = cellKey({ x: <number>owned.order.x, y: <number>owned.order.y });
                const owner_key: string = owned.owner.kind === 'part' ? `p${part.id}` : `c${owned.owner.citizen.id}`;
                const entry: CellOrderEntry = { ...owned, key: `${owner_key}-${owned.order.id ?? `new${rank}`}`, expedition, part };
                const entries: CellOrderEntry[] | undefined = index.get(key);
                if (entries) {
                    entries.push(entry);
                } else {
                    index.set(key, [entry]);
                }
            });
        }
    }
    return index;
}

export function cellOrdersAt(index: CellOrderIndex, point: MapRoutePoint): readonly CellOrderEntry[] {
    return index.get(cellKey(point)) ?? [];
}

/** Consignes par case des parties qui suivent un tracé. */
export interface RouteOrderCount {
    readonly orders: number;
    readonly cells: number;
}

/** Consignes par case des parties liées, par tracé. */
export function routeOrderCounts(index: CellOrderIndex): ReadonlyMap<number, RouteOrderCount> {
    const orders: Map<number, number> = new Map<number, number>();
    const cells: Map<number, Set<string>> = new Map<number, Set<string>>();
    index.forEach((entries: readonly CellOrderEntry[], key: string): void => {
        for (const entry of entries) {
            const route_id: number | null = entry.part.map_route_id;
            if (route_id === null) continue;
            orders.set(route_id, (orders.get(route_id) ?? 0) + 1);
            const route_cells: Set<string> | undefined = cells.get(route_id);
            if (route_cells) {
                route_cells.add(key);
            } else {
                cells.set(route_id, new Set<string>([key]));
            }
        }
    });
    const counts: Map<number, RouteOrderCount> = new Map<number, RouteOrderCount>();
    orders.forEach((count: number, route_id: number): void => {
        counts.set(route_id, { orders: count, cells: cells.get(route_id)?.size ?? 0 });
    });
    return counts;
}

/** Consigne qui s'adresse à l'utilisateur. */
export interface CellOrderLine {
    readonly key: string;
    readonly entry: CellOrderEntry;
    /** « Moi » pour une consigne personnelle ; rien pour une consigne de toute la partie. */
    readonly scope: string | null;
}

/** Partie de l'utilisateur qui a des consignes sur la case, et celles qui s'adressent à lui. */
export interface CellOrderGroup {
    readonly key: string;
    readonly part: ExpeditionPart;
    readonly label: string;
    /** Couleur du tracé lié (`var(--mho-route-…)`) ; `null` sans tracé. */
    readonly color: string | null;
    readonly lines: readonly CellOrderLine[];
}

/** Consigne qui ne s'adresse pas à l'utilisateur, résumée. */
export interface CellOrderOther {
    readonly key: string;
    readonly entry: CellOrderEntry;
    /** Qui : « Brindille (même expé) », « Expé 3 « Camping » », « Expé 3 · Bob ». */
    readonly who: string;
    /** Nom court pour le résumé d'une ligne : le citoyen dans sa propre partie, sinon l'expédition. */
    readonly short: string;
    readonly color: string | null;
    readonly text: string;
}

export interface CellOrdersView {
    readonly mine: readonly CellOrderGroup[];
    readonly others: readonly CellOrderOther[];
    /** Noms courts des autres, sans doublon, dans l'ordre. */
    readonly others_names: readonly string[];
    readonly count: number;
}

export interface CellOrdersContext {
    /** Utilisateur connecté ; `null` : toutes les consignes sont « des autres ». */
    readonly user_id: number | null;
    readonly citizens: readonly Citizen[];
    readonly items: readonly Item[];
    /** Expéditions du jour, pour nommer l'expédition à attendre. */
    readonly expeditions: readonly Expedition[];
    readonly locale: string;
}

const EMPTY_VIEW: CellOrdersView = { mine: [], others: [], others_names: [], count: 0 };

/**
 * Consignes d'une case vues par l'utilisateur : celles de ses parties qui s'adressent à lui (toute la partie, ou
 * lui), groupées par partie ; les autres résumées par qui les porte.
 */
export function buildCellOrdersView(entries: readonly CellOrderEntry[], context: CellOrdersContext): CellOrdersView {
    if (entries.length === 0) return EMPTY_VIEW;
    const groups: Map<ExpeditionPart, { group: CellOrderGroup; lines: CellOrderLine[] }> = new Map();
    const others: CellOrderOther[] = [];
    for (const entry of entries) {
        const in_part: boolean = context.user_id !== null && entry.part.citizens
            .some((member: CitizenExpedition): boolean => member.citizen_id === context.user_id);
        const personal: CitizenExpedition | null = entry.owner.kind === 'citizen' ? entry.owner.citizen : null;
        const color: string | null = entry.part.map_route ? mapRouteColorVar(entry.part.map_route.color) : null;
        if (in_part && (!personal || personal.citizen_id === context.user_id)) {
            let target: { group: CellOrderGroup; lines: CellOrderLine[] } | undefined = groups.get(entry.part);
            if (!target) {
                const lines: CellOrderLine[] = [];
                target = { group: { key: `p${entry.part.id}`, part: entry.part, label: partLabel(entry.expedition, entry.part, true), color, lines }, lines };
                groups.set(entry.part, target);
            }
            target.lines.push({ key: entry.key, entry, scope: personal ? $localize`Moi` : null });
            continue;
        }
        const member_name: string | null = personal ? memberLabel(personal, entry.part.citizens.indexOf(personal), context.citizens) : null;
        const expedition_name: string = partLabel(entry.expedition, entry.part, true);
        const who: string = in_part && member_name
            ? $localize`${member_name}:name: (même expé)`
            : member_name ? `${expedition_name} · ${member_name}` : expedition_name;
        others.push({
            key: entry.key,
            entry,
            who,
            short: in_part && member_name ? member_name : expedition_name,
            color,
            text: describeOrder(entry.order, context.items, context.citizens, context.locale, context.expeditions).text
        });
    }
    const others_names: string[] = [...new Set<string>(others.map((other: CellOrderOther): string => other.short))];
    return { mine: [...groups.values()].map(({ group }: { group: CellOrderGroup }): CellOrderGroup => group), others, others_names, count: entries.length };
}
