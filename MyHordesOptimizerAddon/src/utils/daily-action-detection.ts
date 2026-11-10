/** Actions quotidiennes lues sur la page maison : clé MHO et nom de l'icône de l'action dans le jeu (`actions/<icône>.gif`). */
export const HOME_DAILY_ACTIONS: { key: string; icon: string }[] = [
    { key: 'home_pool', icon: 'pool' },
    { key: 'home_shower', icon: 'shower' },
    { key: 'home_clean', icon: 'sort' },
    { key: 'home_rest', icon: 'rest' },
    { key: 'home_defbuff', icon: 'watchmen' },
    { key: 'home_crows', icon: 'lair' },
    { key: 'home_survivalist', icon: 'survarea' },
    { key: 'home_contemplate', icon: 'home_contemplate' },
    { key: 'home_scavenge', icon: 'gallery' }
];

/** Métier du Fouineur (`jobUid` de l'API), seul à pouvoir creuser plusieurs fois par jour dans les galeries. */
const SCAVENGER_JOB: string = 'dig';

/** true = déjà faite aujourd'hui, false = disponible mais pas faite, undefined = chantier non construit. */
export function detectDailyActionDone(iconMatch: string): boolean | undefined {
    const row = document.querySelector(`.heroic_action img[src*=${iconMatch}]`)?.parentElement;
    if (!row) return undefined;
    return !!(row.attributes as any).disabled;
}

/** Valeur à envoyer pour une action détectée (`detected` undefined : absente de la page ; retour undefined : rien à envoyer) ; le jeu ne barrant une action qu'une fois toutes ses utilisations faites, un Fouineur qui n'a fouillé qu'une fois et l'a cochée à la main n'est pas décoché. */
export function dailyActionReport(key: string, detected: boolean | undefined, job_uid: string | undefined): boolean | undefined {
    // Métier inconnu (jeton de repli sans détail du métier) : on ne sait pas si c'est un Fouineur, on ne décoche pas.
    if (detected === false && key === 'home_scavenge' && (job_uid === SCAVENGER_JOB || !job_uid)) return undefined;
    return detected;
}

/** Envoie l'état de chaque action de la page maison (`save` : envoi d'une action, undefined si rien à envoyer) ; un échec, déjà signalé par l'envoi, n'empêche ni les autres actions ni la suite de la mise à jour. */
export async function reportHomeDailyActions(save: (key: string, done: boolean | undefined) => Promise<void> | undefined, job_uid: string | undefined): Promise<void> {
    for (const action of HOME_DAILY_ACTIONS) {
        try {
            await save(action.key, dailyActionReport(action.key, detectDailyActionDone(action.icon), job_uid));
        } catch {
            // Erreur déjà notifiée par l'envoi.
        }
    }
}
