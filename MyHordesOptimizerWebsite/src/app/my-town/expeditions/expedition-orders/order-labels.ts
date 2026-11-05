import { BURIED_RUIN_ID, HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { describePlace, MapRouteContext, MapRoutePlace } from '../../map/map-routes/map-route-detail';
import { cellKey, EXPEDITION_ORDER_KIND_INFO, ExpeditionOrderKindInfo } from './expedition-orders.util';

/** Ce que dit une consigne : verbe et paramètres d'une consigne typée, ou texte libre mis en forme. */
export interface ExpeditionOrderDescription {
    /** Verbe d'une consigne typée ; `null` pour un texte libre. */
    readonly verb: string | null;
    /** Paramètres d'une consigne typée (« ×2 Planche tordue », « le groupe »). */
    readonly rest: string;
    /** Texte libre, avec sa mise en forme ; `null` pour une consigne typée. */
    readonly html: string | null;
    /** Image de l'objet ou de l'action héroïque. */
    readonly img: string | null;
    /** Pictogramme (Material Icons), à défaut d'image. */
    readonly icon: string | null;
    /** Précision libre d'une consigne typée, affichée à la suite. */
    readonly note: string | null;
    /** La consigne en texte brut : libellé accessible, résumés. */
    readonly text: string;
}

/** Nom d'une expédition du jour : son nom, sinon « Expédition n » selon son rang. */
export function expeditionLabel(expedition: Expedition, index: number): string {
    return expedition.label?.trim() || $localize`Expédition ${index + 1}:index:`;
}

/** Texte brut d'un texte mis en forme par l'éditeur des consignes. */
export function plainText(html: string | null | undefined): string {
    return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Ce que dit une consigne ; `expeditions` : celles du jour, pour nommer l'expédition à attendre. */
export function describeOrder(order: ExpeditionOrder, items: readonly Item[], citizens: readonly Citizen[], locale: string,
                              expeditions: readonly Expedition[] = []): ExpeditionOrderDescription {
    if (!order.kind) {
        const html: string = order.text ?? '';
        return { verb: null, rest: '', html, img: null, icon: null, note: null, text: plainText(html) };
    }
    const info: ExpeditionOrderKindInfo = EXPEDITION_ORDER_KIND_INFO[order.kind];
    const item: Item | undefined = order.item_id === null ? undefined : items.find((candidate: Item): boolean => candidate.id === order.item_id);
    const item_label: string = item?.label?.[locale] ?? '';
    const item_img: string | null = item ? HORDES_IMG_REPO + item.img : null;
    let rest: string = '';
    let img: string | null = null;
    switch (order.kind) {
        case 'pick':
        case 'drop':
            rest = `×${order.quantity ?? 1} ${item_label}`;
            img = item_img;
            break;
        case 'use':
            rest = item_label;
            img = item_img;
            break;
        case 'clear':
            rest = $localize`${order.quantity ?? 1}:count: tas`;
            break;
        case 'hero': {
            const heroic: HeroicActionEnum | undefined = order.hero_skill ? HeroicActionEnum.getByAction(order.hero_skill) : undefined;
            rest = heroic?.getLabel() ?? order.hero_skill ?? '';
            img = heroic ? HORDES_IMG_REPO + heroic.value.img : null;
            break;
        }
        case 'explore':
            rest = $localize`(1 PA)`;
            break;
        case 'excavate':
            img = HORDES_IMG_REPO + JobEnum.SCAVENGER.value.img;
            break;
        case 'wait':
            if (order.target_expedition_id !== null) {
                const index: number = expeditions.findIndex((expedition: Expedition): boolean => expedition.id === order.target_expedition_id);
                rest = index < 0 ? '?' : expeditionLabel(expeditions[index], index);
            } else {
                rest = order.target_user_id === null
                    ? $localize`le groupe`
                    : citizens.find((citizen: Citizen): boolean => citizen.id === order.target_user_id)?.name ?? '';
            }
            break;
        default:
            break;
    }
    const note: string | null = order.note?.trim() || null;
    const text: string = `${info.verb} ${rest}`.trim();
    return { verb: info.verb, rest, html: null, img, icon: img ? null : info.icon, note, text: note ? `${text} — ${note}` : text };
}

/** Nom d'une place d'expédition : le citoyen placé, sinon « Place n (métier) ». */
export function memberLabel(member: CitizenExpedition, index: number, citizens: readonly Citizen[]): string {
    const name: string | undefined = member.citizen_id ? citizens.find((candidate: Citizen): boolean => candidate.id === member.citizen_id)?.name : undefined;
    if (name) return name;
    const job: string | undefined = member.preinscrit_job ? JobEnum.getByKey<JobEnum>(member.preinscrit_job)?.value.label : undefined;
    return job ? $localize`Place ${index + 1}:place: (${job}:job:)` : $localize`Place ${index + 1}:place:`;
}

/**
 * Nom court d'une partie : l'expédition, le nom du tracé lié entre guillemets (`with_route`), et le rang de la
 * partie s'il y en a plusieurs.
 */
export function partLabel(expedition: Expedition, part: ExpeditionPart, with_route: boolean = false): string {
    const name: string = expedition.label?.trim() || $localize`Expédition`;
    const label: string = with_route && part.map_route ? `${name} « ${part.map_route.label} »` : name;
    if (expedition.parts.length < 2) return label;
    const position: number = expedition.parts.findIndex((candidate: ExpeditionPart): boolean => candidate.id === part.id) + 1;
    return $localize`${label}:expedition: · partie ${position}:position:`;
}

/** Lieu d'une case : ville, bâtiment, bâtiment enseveli, désert ; vide pour une case inconnue de la carte. */
export function cellPlaceLabel(point: MapRoutePoint, place: MapRoutePlace | null, cells: ReadonlyMap<string, Cell>): string {
    if (place?.place) return place.place;
    const cell: Cell | undefined = cells.get(cellKey(point));
    if (cell?.ruin_id === BURIED_RUIN_ID) return $localize`Bâtiment enseveli`;
    return cell ? $localize`Désert` : '';
}

/** Coût d'une partie : « n PA », ou « total PA (tracé + ruines) » avec des visites de ruine. */
export function partApLabel(route_ap: number, ruin_ap: number): string {
    return ruin_ap === 0
        ? $localize`${route_ap}:ap: PA`
        : $localize`${route_ap + ruin_ap}:total: PA (${route_ap}:route: + ${ruin_ap}:ruins:)`;
}

/** « n consigne(s) sur k case(s) » ; rien sans consigne. */
export function orderCountLabel(orders: number, cells: number): string {
    return orders === 0 ? '' : $localize`${orders}:orders: consigne(s) sur ${cells}:cells: case(s)`;
}

/** « [x ; y] · lieu » d'une case, en coordonnées relatives. */
export function cellTitle(point: MapRoutePoint, cells: ReadonlyMap<string, Cell>, context: MapRouteContext): string {
    const place: MapRoutePlace | null = describePlace(point, cells, context);
    const label: string = cellPlaceLabel(point, place, cells);
    const coordinates: string = place?.coordinates ?? '';
    return label ? `${coordinates} · ${label}` : coordinates;
}
