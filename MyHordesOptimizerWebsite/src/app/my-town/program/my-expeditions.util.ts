import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { meetsRequirements } from '../expeditions/expedition-resources.util';

/** Une de mes parties : la partie et ma place. */
export interface MyExpeditionPart {
    readonly part: ExpeditionPart;
    readonly place: CitizenExpedition;
}

/** Une expédition où je suis placé. */
export interface MyExpedition {
    readonly expedition: Expedition;
    /** L'expédition est-elle prête (et non en préparation) ? */
    readonly ready: boolean;
    /** Ma première place dans l'ordre des parties. */
    readonly departure: CitizenExpedition;
    /** Mes parties, dans l'ordre des parties. */
    readonly parts: readonly MyExpeditionPart[];
    /** Mes consignes cochées, toutes parties. */
    readonly done: number;
    /** Mes consignes (celles de mes places), toutes parties. */
    readonly total: number;
}

/** Expédition prête où je peux prendre une place. */
export interface OpenExpedition {
    readonly expedition: Expedition;
    readonly places: number;
}

/** Parties d'une expédition dans l'ordre des parties. */
function sortedParts(expedition: Expedition): ExpeditionPart[] {
    return [...expedition.parts].sort((a: ExpeditionPart, b: ExpeditionPart): number => a.position - b.position);
}

/** Expéditions où l'utilisateur est placé, une entrée par expédition. */
export function myExpeditionsOf(expeditions: readonly Expedition[], user_id: number): MyExpedition[] {
    const result: MyExpedition[] = [];
    for (const expedition of expeditions) {
        const parts: MyExpeditionPart[] = [];
        for (const part of sortedParts(expedition)) {
            const place: CitizenExpedition | undefined = (part.citizens ?? []).find((candidate: CitizenExpedition): boolean => candidate.citizen_id === user_id);
            if (place) parts.push({ part, place });
        }
        if (parts.length === 0) continue;

        const orders: ExpeditionOrder[] = parts.flatMap((mine: MyExpeditionPart): ExpeditionOrder[] => mine.place.orders ?? []);
        result.push({
            expedition,
            ready: expedition.state === 'ready',
            departure: parts[0].place,
            parts,
            done: orders.filter((order: ExpeditionOrder): boolean => order.is_done).length,
            total: orders.length
        });
    }
    return result;
}

/** Expéditions prêtes avec au moins une place libre de la première partie que le citoyen peut prendre (une fois par rang). */
export function openExpeditionsFor(expeditions: readonly Expedition[], me: Citizen | undefined, day: number, current_day: number, scouts_lair_built: boolean): OpenExpedition[] {
    if (!me) return [];
    const result: OpenExpedition[] = [];
    for (const expedition of expeditions) {
        if (expedition.state !== 'ready') continue;
        const places: number = (sortedParts(expedition)[0]?.citizens ?? []).filter((place: CitizenExpedition): boolean =>
            !place.citizen_id && meetsRequirements(me, place, day, current_day, scouts_lair_built)
        ).length;
        if (places > 0) result.push({ expedition, places });
    }
    return result;
}
