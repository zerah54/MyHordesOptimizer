import { Action } from '../../../_abstract_model/enum/action.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Property } from '../../../_abstract_model/enum/property.enum';
import { ExpeditionOrderKind } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';

/** Verbe et pictogramme (Material Icons) d'une consigne typée. */
export interface ExpeditionOrderKindInfo {
    readonly verb: string;
    /** Pictogramme, quand la consigne n'a ni objet ni action héroïque à montrer. */
    readonly icon: string;
}

export const EXPEDITION_ORDER_KIND_INFO: Readonly<Record<ExpeditionOrderKind, ExpeditionOrderKindInfo>> = {
    pick: { verb: $localize`Ramasser`, icon: 'pan_tool' },
    drop: { verb: $localize`Déposer`, icon: 'move_to_inbox' },
    use: { verb: $localize`Consommer`, icon: 'restaurant' },
    clear: { verb: $localize`Déblayer`, icon: 'construction' },
    explore: { verb: $localize`Explorer la ruine`, icon: 'explore' },
    excavate: { verb: $localize`Excaver la zone`, icon: 'terrain' },
    camp: { verb: $localize`Camper`, icon: 'nights_stay' },
    hero: { verb: $localize`Action héroïque`, icon: 'star' },
    wait: { verb: $localize`Attendre`, icon: 'hourglass_empty' }
};

const CONSUMABLE_PROPERTIES: ReadonlySet<string> = new Set<string>([Property.IS_WATER.key, Property.FOOD.key, Property.DRUG.key]);
const CONSUMABLE_ACTIONS: ReadonlySet<string> = new Set<string>([
    Action.EAT_6AP.key, Action.EAT_7AP.key, Action.DRUG_6AP_1.key, Action.DRUG_8AP_1.key, Action.COFFEE.key, Action.ALCOHOL.key, Action.ALCOHOL_DX.key
]);

/** Objet proposé pour « Consommer » : eau, nourriture, drogue, alcool. */
export function isConsumable(item: Item): boolean {
    return (item.properties ?? []).some((property: Property): boolean => CONSUMABLE_PROPERTIES.has(property?.key))
        || (item.actions ?? []).some((action: Action): boolean => CONSUMABLE_ACTIONS.has(action?.key));
}

/** Une place est tenue par un fouineur : métier du citoyen placé s'il est connu, sinon métier préinscrit. */
export function isScavengerPlace(place: CitizenExpedition, citizens: readonly Citizen[]): boolean {
    const job: JobEnum | undefined = place.citizen_id ? citizens.find((citizen: Citizen): boolean => citizen.id === place.citizen_id)?.job : undefined;
    return (job?.key ?? place.preinscrit_job) === JobEnum.SCAVENGER.key;
}

/** « Excaver » n'est plus possible sur une case connue comme déjà excavée. */
export function canExcavate(cell: Cell | undefined): boolean {
    return cell?.is_excavated !== true;
}

/** Quantité maximale d'une consigne (`ExpeditionOrderRules.MaxQuantity` côté API). */
export const EXPEDITION_ORDER_MAX_QUANTITY: number = 99;

/** Propriétaire d'une consigne : toute la partie, ou un citoyen de la partie. */
export type ExpeditionOrderOwner =
    | { readonly kind: 'part'; readonly part: ExpeditionPart }
    | { readonly kind: 'citizen'; readonly citizen: CitizenExpedition };

/** Consigne et son propriétaire, tels que la feuille de route les présente et les enregistre. */
export interface OwnedExpeditionOrder {
    readonly order: ExpeditionOrder;
    readonly owner: ExpeditionOrderOwner;
}

export function cellKey(point: MapRoutePoint): string {
    return `${point.x},${point.y}`;
}

/** Case d'une consigne, en coordonnées absolues ; `null` pour une consigne générale. */
export function orderCell(order: ExpeditionOrder): MapRoutePoint | null {
    return order.x !== null && order.y !== null ? { x: order.x, y: order.y } : null;
}

/** Consignes de la partie et de ses citoyens qui visent une case : celles de la feuille de route. */
export function cellOrdersOf(part: ExpeditionPart): OwnedExpeditionOrder[] {
    const owned: OwnedExpeditionOrder[] = [];
    for (const order of part.orders ?? []) {
        if (order.hasCell()) owned.push({ order, owner: { kind: 'part', part } });
    }
    for (const citizen of part.citizens ?? []) {
        for (const order of citizen.orders ?? []) {
            if (order.hasCell()) owned.push({ order, owner: { kind: 'citizen', citizen } });
        }
    }
    return owned;
}

/** Consignes générales (sans case) d'une liste : celles que la fenêtre « Consignes » modifie. */
export function generalOrders(orders: readonly ExpeditionOrder[] | undefined): ExpeditionOrder[] {
    return (orders ?? []).filter((order: ExpeditionOrder): boolean => !order.hasCell());
}

/**
 * Liste complète à enregistrer après une modification des consignes générales : l'enregistrement remplace toute
 * la liste, les consignes par case sont donc reprises telles quelles, après les générales.
 */
export function withCellOrders(general: readonly ExpeditionOrder[], all: readonly ExpeditionOrder[] | undefined): ExpeditionOrder[] {
    const cell_orders: ExpeditionOrder[] = (all ?? []).filter((order: ExpeditionOrder): boolean => order.hasCell());
    return [...general, ...cell_orders].map((order: ExpeditionOrder, position: number): ExpeditionOrder => {
        const copy: ExpeditionOrder = cloneOrder(order);
        copy.position = position;
        return copy;
    });
}

/** Copie modifiable d'une consigne : les listes affichées ne changent qu'au retour du hub. */
export function cloneOrder(order: ExpeditionOrder): ExpeditionOrder {
    const clone: ExpeditionOrder = new ExpeditionOrder(order.modelToDto());
    clone.expeditions_id = order.expeditions_id;
    clone.expedition_citizen_id = order.expedition_citizen_id;
    clone.expedition_parts_id = order.expedition_parts_id;
    return clone;
}
