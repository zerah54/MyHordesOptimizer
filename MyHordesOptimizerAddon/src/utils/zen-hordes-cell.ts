import type { MhoParameters } from '../types';
import type { ScavNextCells, ScoutNextCells } from './desert-radars';
import { getScavNextCells, getScoutNextCells } from './desert-radars';
import type { CountedInventoryObject } from './item-lookup';
import { countInventoryObjects, resolveInventoryObjects } from './item-lookup';

/** Ce que le joueur autorise à envoyer à Zen Hordes depuis la page du désert */
export interface ZenHordesScope {
    /** Zombies, case épuisée et objets au sol */
    zone: boolean;
    /** Radar du Fouineur ou de l'Éclaireur */
    radars: boolean;
}

/**
 * Case relevée pour Zen Hordes. Un champ non relevé reste absent : Zen Hordes refuse `null`, et une
 * liste vide signifierait « plus rien au sol » au lieu de « non relevé ».
 */
export interface ZenHordesCell {
    x: number;
    y: number;
    zombies?: number;
    zoneEmpty?: boolean;
    objects?: CountedInventoryObject[];
    scavNextCells?: ScavNextCells;
    scoutNextCells?: ScoutNextCells;
}

/**
 * Décide de ce qui part vers Zen Hordes. La zone part dès que l'option est cochée, sauf en Chaos où l'option
 * « mise à jour en Chaos » est aussi requise ; les radars ne dépendent que de l'option des marqueurs de métiers.
 * @param params Paramètres du joueur
 * @param is_chaos La ville est-elle en Chaos (inconnu = non)
 * @param job_uid Métier du joueur
 */
export function resolveZenHordesScope(params: MhoParameters, is_chaos: boolean | undefined, job_uid: string | undefined): ZenHordesScope {
    if (!params.update_zen) {
        return { zone: false, radars: false };
    }
    return {
        zone: !is_chaos || !!params.update_zen_devastated,
        radars: !!params.update_zen_job_markers && (job_uid === 'dig' || job_uid === 'vest')
    };
}

/**
 * Relève la case courante du désert pour Zen Hordes.
 * @param position Position affichée par la page, relative à la ville
 * @param scope Ce qui doit être relevé
 * @param job_uid Métier du joueur, qui détermine le radar lu
 * @return La case, ou `undefined` si la position est illisible
 */
export function collectZenHordesCell(position: (string | number)[], scope: ZenHordesScope, job_uid: string | undefined): ZenHordesCell | undefined {
    const x: number = +position[0];
    const y: number = +position[1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return undefined;
    }

    const cell: ZenHordesCell = { x, y };
    if (scope.zone) {
        cell.zombies = document.querySelectorAll('.actor.zombie').length;
        cell.zoneEmpty = !!document.querySelector('#mgd-zone-note');
        const ground: Element | null = document.querySelector('.inventory.desert');
        if (ground) {
            cell.objects = countInventoryObjects(resolveInventoryObjects(Array.from(ground.querySelectorAll('li.item'))));
        }
    }
    if (scope.radars) {
        if (job_uid === 'dig') {
            cell.scavNextCells = getScavNextCells();
        } else if (job_uid === 'vest') {
            cell.scoutNextCells = getScoutNextCells();
        }
    }
    return cell;
}
