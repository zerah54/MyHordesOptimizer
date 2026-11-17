import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { getUserId } from '../../../_core/utilities/localstorage.util';

/** Main sur un bloc : libre, tenue par cette connexion, ou par une autre (`same_user` : le même joueur, autre onglet). */
export type BlockLockState = { kind: 'free' } | { kind: 'mine' } | { kind: 'other'; user_id: number; same_user: boolean };

/** Reprend de `source` les champs de ligne d'un citoyen d'expédition. */
function copyCitizenRow(target: CitizenExpedition, source: CitizenExpedition): void {
    target.citizen_id = source.citizen_id;
    target.preinscrit = source.preinscrit;
    target.is_preinscrit_soif = source.is_preinscrit_soif;
    target.preinscrit_job = source.preinscrit_job;
    target.preinscrit_heroic_skill = source.preinscrit_heroic_skill;
    target.pdc = source.pdc;
    target.is_thirsty = source.is_thirsty;
    target.base_ap = source.base_ap;
    target.required_sp = source.required_sp;
    target.required_sp_operator = source.required_sp_operator;
    target.requires_shoes = source.requires_shoes;
}

/**
 * Renvoie `incoming` où les en-têtes, parties, citoyens et sacs dont la clé est détenue reprennent les champs
 * éditables de `current` ; `incoming` tel quel sans bloc détenu ou sans version locale.
 */
export function preserveHeldBlocks(incoming: Expedition, current: Expedition | undefined, held: ReadonlySet<string>): Expedition {
    if (current === undefined || held.size === 0) {
        return incoming;
    }
    if (held.has(`expedition:${incoming.id}`)) {
        incoming.label = current.label;
        incoming.min_pdc = current.min_pdc;
    }
    for (const part of incoming.parts) {
        const current_part: ExpeditionPart | undefined = current.parts.find((p: ExpeditionPart): boolean => p.id === part.id);
        if (current_part === undefined) {
            continue;
        }
        if (held.has(`part:${part.id}`)) {
            part.direction = { ...current_part.direction };
        }
        for (const citizen of part.citizens) {
            const current_citizen: CitizenExpedition | undefined = current_part.citizens.find((c: CitizenExpedition): boolean => c.id === citizen.id);
            if (current_citizen === undefined) {
                continue;
            }
            if (held.has(`citizen:${citizen.id}`)) {
                copyCitizenRow(citizen, current_citizen);
            }
            if (held.has(`bag:${citizen.id}`)) {
                citizen.bag = current_citizen.bag;
            }
        }
    }
    return incoming;
}

/** Nom du citoyen qui tient le bloc, `null` si le bloc n'est pas tenu par un autre ou si le citoyen est inconnu. */
export function holderName(state: BlockLockState, citizens: readonly Citizen[]): string | null {
    if (state.kind !== 'other') {
        return null;
    }
    return citizens.find((citizen: Citizen): boolean => citizen.id === state.user_id)?.name ?? null;
}

/** État d'un bloc refusé par le hub (`Locked:<holder>`). */
export function refusedLockState(holder: number): BlockLockState {
    return { kind: 'other', user_id: holder, same_user: holder === getUserId() };
}

/** Message du détenteur d'un bloc tenu par un autre (modale de consignes en lecture seule). */
export function lockHolderLabel(state: BlockLockState, citizens: readonly Citizen[]): string {
    if (state.kind === 'other' && state.same_user) {
        return $localize`Toi, dans un autre onglet`;
    }
    return $localize`En cours de modification par ${holderName(state, citizens) ?? '?'}:pseudo:`;
}

/** Avertissement d'une écriture refusée par le verrou de `holder`. */
export function lockRefusedMessage(holder: number, citizens: readonly Citizen[]): string {
    const state: BlockLockState = refusedLockState(holder);
    if (state.kind === 'other' && state.same_user) {
        return $localize`Modification refusée : ${lockHolderLabel(state, citizens)}:holder:`;
    }
    return $localize`Modification refusée : en cours de modification par ${holderName(state, citizens) ?? '?'}:pseudo:`;
}
