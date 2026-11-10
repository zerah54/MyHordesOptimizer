import { expedition_texts } from '../i18n/texts';
import type { ApiExpeditionCitizen, ApiExpeditionOrder, ApiExpeditionPart } from '../types';
import { getI18N } from './i18n';

/** Visites de ruine (« Explorer la ruine ») d'une liste de consignes. */
function ruinVisits(orders: readonly ApiExpeditionOrder[] | null | undefined): number {
    return (orders ?? []).filter((order: ApiExpeditionOrder): boolean => order.kind === 'explore').length;
}

/** PA de visite de ruine (1 par visite) d'une partie : le plus que dépense une place, une visite pour n'importe qui comptant pour chacune. */
export function partRuinAp(part: ApiExpeditionPart): number {
    const per_place: number[] = (part.citizens ?? []).map((citizen: ApiExpeditionCitizen): number => ruinVisits(citizen.orders));
    return ruinVisits(part.orders) + Math.max(0, ...per_place);
}

/** Coût d'une partie : « n PA », ou « total PA (tracé + ruines) » avec des visites de ruine. */
export function partApLabel(route_ap: number, ruin_ap: number): string {
    const ap: string = getI18N(expedition_texts.ap_short) ?? '';
    return ruin_ap === 0 ? `${route_ap} ${ap}` : `${route_ap + ruin_ap} ${ap} (${route_ap} + ${ruin_ap})`;
}
