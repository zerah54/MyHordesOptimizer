import { mho_pending_hero_skills_key } from '../config/constants';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import type { HeroSkillLevels } from '../utils/hero-skills';
import { isValidToken } from '../utils/misc';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { convertResponsePromiseToError } from '../utils/version';
import { getToken } from './token';

/** Niveaux relevés avant l'entrée en ville, en attente d'un jeton portant cette ville. */
interface PendingHeroSkills {
    townId: number;
    levels: HeroSkillLevels;
}

/** Enregistre les niveaux S.U.P.E.R. du joueur dans sa ville. Les erreurs sont laissées à l'appelant. */
export function saveHeroSkills(town_id: number, levels: HeroSkillLevels): Promise<void> {
    return fetcher(state.api_url + `/town/${town_id}/user/${state.mh_user.id}/heroSkills`, {
        method: 'POST',
        body: JSON.stringify(levels),
        headers: { 'Content-Type': 'application/json' }
    }).then((response: Response): Promise<void> | undefined => response.status >= 200 && response.status < 300 ? undefined : convertResponsePromiseToError(response));
}

/**
 * Le récapitulatif s'affiche avant que la ville ne soit connue de MHO : les niveaux sont gardés
 * puis envoyés dès que le jeton porte cette ville (`flushPendingHeroSkills`, à chaque navigation).
 * @return true si l'envoi a déjà eu lieu.
 */
export async function queueHeroSkills(town_id: number, levels: HeroSkillLevels): Promise<boolean> {
    await setStorageItem(mho_pending_hero_skills_key, { townId: town_id, levels } satisfies PendingHeroSkills);
    return flushPendingHeroSkills();
}

/** Envoie les niveaux en attente si le joueur est dans leur ville ; un échec les garde pour plus tard. */
export async function flushPendingHeroSkills(): Promise<boolean> {
    const pending: PendingHeroSkills | null | undefined = await getStorageItem(mho_pending_hero_skills_key);
    if (!pending) return false;
    // Jeton périmé à l'entrée en ville (shouldRefreshMe) : sa ville serait encore l'ancienne
    if (!isValidToken()) await getToken();
    if (state.mh_user?.townDetails?.townId !== pending.townId) return false;
    try {
        await saveHeroSkills(pending.townId, pending.levels);
    } catch {
        return false;
    }
    await setStorageItem(mho_pending_hero_skills_key, null);
    return true;
}
