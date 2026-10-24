import { DailyActionEnum, displayableDailyActions } from '../../_abstract_model/enum/daily-action.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { MapRoutePoint } from '../../_abstract_model/types/map-route.class';

/** Distance à la ville (en km) à partir de laquelle un déplacement coûte un PE au lieu d'un PA. */
const SP_MOVE_MIN_KM: number = 3;

/** PE apportés par le métier d'éclaireur. */
const SCOUT_SP: number = 2;

/** PE apportés par une cartographie à J-1. */
const MAPPING_SP: number = 2;

/** PE apportés par une cartographie à J-1 pour un éclaireur. */
const SCOUT_MAPPING_SP: number = 4;

/** PE apportés par des chaussures équipées. */
const SHOES_SP: number = 1;

/** Tronçon d'une expédition : son tracé (cases adjacentes) et les visites de ruine qu'il comporte. */
export interface ApLeg {
    readonly route: readonly MapRoutePoint[];
    readonly ruin_visits: number;
}

/** PA et PE dont dispose un citoyen au départ. */
export interface ApResources {
    readonly base_ap: number;
    readonly bag_ap: number;
    readonly sp: number;
}

/** PA nécessaires au parcours, PA disponibles, et si les seconds ne suffisent pas. */
export interface ApCheck {
    readonly needed: number;
    readonly available: number;
    readonly short: boolean;
}

/** Repaire des Éclaireurs construit, condition de « Cartographier le désert » ; chantiers inconnus : non construits. */
export function scoutsLairBuilt(built_uids: ReadonlySet<string> | null): boolean {
    return displayableDailyActions(built_uids).includes(DailyActionEnum.HOME_CROWS);
}

/** Cartographie faite à J-1 : enregistrée, ou supposée pour une expédition d'un jour futur si le Repaire des Éclaireurs est construit. */
function hasMapped(citizen: Citizen, expedition_day: number, current_day: number, scouts_lair_built: boolean): boolean {
    return (scouts_lair_built && expedition_day > current_day)
        || (citizen.daily_actions ?? []).some((action: DailyAction): boolean =>
            action.day === expedition_day - 1 && action.action_key === DailyActionEnum.HOME_CROWS.key);
}

/** PE d'un citoyen au départ de l'expédition : éclaireur, cartographie à J-1, chaussures. */
export function startingSp(citizen: Citizen, expedition_day: number, current_day: number, scouts_lair_built: boolean): number {
    const is_scout: boolean = citizen.job?.key === JobEnum.SCOUT.key;
    let sp: number = citizen.shoes_equipped ? SHOES_SP : 0;
    if (is_scout) sp += SCOUT_SP;
    if (hasMapped(citizen, expedition_day, current_day, scouts_lair_built)) sp += is_scout ? SCOUT_MAPPING_SP : MAPPING_SP;
    return sp;
}

/** Un citoyen vivant satisfait la place : métier préinscrit, PE selon l'opérateur (inconnu : au moins), chaussures. */
export function meetsRequirements(citizen: Citizen, place: CitizenExpedition, expedition_day: number, current_day: number, scouts_lair_built: boolean): boolean {
    if (citizen.is_dead) return false;
    if (place.preinscrit_job && citizen.job?.key !== place.preinscrit_job) return false;
    if (place.requires_shoes === true && !citizen.shoes_equipped) return false;
    if (place.requires_shoes === false && citizen.shoes_equipped) return false;

    const required_sp: number | undefined = place.required_sp;
    if (required_sp === undefined || required_sp === null) return true;
    const sp: number = startingSp(citizen, expedition_day, current_day, scouts_lair_built);
    switch (place.required_sp_operator) {
        case 'max': return sp <= required_sp;
        case 'exact': return sp === required_sp;
        default: return sp >= required_sp;
    }
}

/** Distance à la ville d'une case, en km (arrondie comme dans le jeu). */
function kmFromTown(cell: MapRoutePoint, town: MapRoutePoint): number {
    return Math.round(Math.sqrt((cell.x - town.x) ** 2 + (cell.y - town.y) ** 2));
}

/** PA nécessaires aux tronçons (PE d'abord pour les pas partant de 3 km ou plus) face aux PA disponibles. */
export function apCheck(legs: readonly ApLeg[], resources: ApResources, town: MapRoutePoint): ApCheck {
    let ap_moves: number = 0;
    let sp_moves: number = 0;
    let ruin_visits: number = 0;
    for (const leg of legs) {
        ruin_visits += leg.ruin_visits;
        for (let index: number = 1; index < leg.route.length; index++) {
            if (kmFromTown(leg.route[index - 1], town) >= SP_MOVE_MIN_KM) sp_moves++;
            else ap_moves++;
        }
    }
    const needed: number = ap_moves + ruin_visits + Math.max(0, sp_moves - resources.sp);
    const available: number = resources.base_ap + resources.bag_ap;
    return { needed, available, short: available < needed };
}
