/**
 * Fouilles réussies des citoyens d'une case, déduites du registre de la case.
 *
 * Règles du jeu (source MyHordes : `BeyondController`, `ZoneHandler::updateZone`) :
 * - une fouille commence par une fouille manuelle à l'instant T0, suivie d'une fouille
 *   automatique toutes les 1 h 30 (fouineur) ou 2 h (autres métiers) tant que le minuteur reste
 *   actif. Il devient passif, pour la journée, quand le citoyen quitte la case, entre dans une
 *   ruine ou que la zone est perdue ;
 * - le registre n'écrit que les échecs des fouilles AUTOMATIQUES (« … n'a rien trouvé »), jamais
 *   celui de la fouille manuelle, et jamais une réussite ;
 * - un échec est écrit quand le citoyen (ou le chef de son escorte) charge une page du désert :
 *   son heure est celle de ce traitement, pas celle de la fouille. À cet instant, toutes les
 *   fouilles échues du citoyen sont traitées et leurs échecs écrits. Quitter la case est une telle
 *   action : au départ, tout ce qui précède est écrit, avant la ligne du départ.
 *
 * Seule hypothèse (A1) : un citoyen dont on voit l'arrivée a commencé à fouiller moins d'un
 * intervalle après elle. Tout le reste est un minorant : on ne compte que les fouilles
 * automatiques certaines, dont l'issue est écrite au registre, moins tous les échecs (et toutes
 * les lignes masquées) du passage. La fouille manuelle, dont l'échec n'est jamais écrit, n'est
 * comptée que dans le nombre total de fouilles.
 *
 * Registre incomplet (« Afficher toutes les entrées » non cliqué) : les lignes visibles sont les
 * plus récentes. Un passage dont l'arrivée est visible l'est donc en entier ; sinon, l'hypothèse
 * A1 ne s'applique pas, et le premier échec visible borne T0 : les fouilles comptées lui sont
 * postérieures d'au moins un intervalle moins une minute, leurs échecs éventuels sont visibles.
 */

/** Les heures du registre sont à la minute : l'instant réel est dans [heure, heure + 1 min[ */
const minute_ms: number = 60000;

/** Nature d'une ligne du registre, pour le comptage des fouilles */
export type DigLogEntryKind = 'arrival' | 'departure' | 'failed_dig' | 'hidden' | 'other';

export interface DigLogEntry {
    kind: DigLogEntryKind;
    /** Citoyen de la ligne, tel qu'affiché ; `null` pour une ligne masquée ou sans citoyen */
    citizen_name: string | null;
    /** Début de la minute affichée (ms depuis l'époque) */
    time_ms: number;
}

export interface DigLog {
    /** Lignes du jour visibles, de la plus ancienne à la plus récente */
    entries: DigLogEntry[];
    /** Instant de la lecture (ms) */
    now_ms: number;
}

export interface Digger {
    id: number;
    name: string;
    /** Intervalle entre deux fouilles (ms) */
    dig_interval_ms: number;
    /** Minuteur de fouille actif sur la case */
    is_digging: boolean;
    /**
     * Prochaine fouille automatique (ms), `null` si inconnue. Connue pour soi et pour son escorte :
     * le chargement de la page vient alors de traiter et d'écrire toutes leurs fouilles échues.
     */
    next_dig_ms: number | null;
}

export interface DigEstimate {
    citizen_id: number;
    /** Fouilles automatiques réussies dans la journée : minorant */
    success_digs: number;
    /** Fouilles certaines dans la journée, fouille manuelle comprise */
    total_digs: number;
    /** Toutes les fouilles automatiques de la journée sont connues : `success_digs` n'est pas qu'un minorant */
    exact: boolean;
}

/** Valeur envoyée à l'API (`UpdateSuccesDigValueDto`) */
export interface SuccessfulDigValue {
    citizenId: number;
    successDigs: number;
    totalDigs: number;
}

/** Valeurs déjà envoyées par ce navigateur pour une ville et un jour : `x:y:citoyen` → [réussies, total] */
export interface SentDigsMemory {
    town_id: number;
    day: number;
    values: Record<string, [number, number]>;
}

/** Passage d'un citoyen sur la case : de son arrivée à son départ (ou à maintenant) */
interface DigPass {
    /** Arrivée visible au registre, `null` si le passage a commencé avant la journée ou si elle manque */
    arrival_ms: number | null;
    /** Départ visible au registre, `null` pour le passage en cours ou si la ligne manque */
    departure_ms: number | null;
    fail_times_ms: number[];
    /** Lignes masquées pendant le passage : chacune peut être un échec */
    hidden_entries: number;
}

interface PassEstimate {
    success_digs: number;
    total_digs: number;
    exact: boolean;
    has_digs: boolean;
}

function normalizeCitizenName(name: string): string {
    return name.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Égalité stricte des pseudos : « Zerah » n'est pas « Zerah2 » */
export function isSameCitizenName(entry_name: string | null, citizen_name: string): boolean {
    return entry_name !== null && normalizeCitizenName(entry_name) === normalizeCitizenName(citizen_name);
}

function createPass(arrival_ms: number | null): DigPass {
    return { arrival_ms, departure_ms: null, fail_times_ms: [], hidden_entries: 0 };
}

/**
 * Découpe la journée du citoyen en passages. Les lignes sont rattachées dans l'ordre du registre,
 * pas à la minute : un échec écrit juste avant un départ, dans la même minute qu'un retour, reste
 * dans le passage précédent.
 */
function splitIntoPasses(log: DigLog, citizen_name: string): DigPass[] {
    let current: DigPass = createPass(null);
    const passes: DigPass[] = [current];
    for (const entry of log.entries) {
        if (entry.kind === 'hidden') {
            current.hidden_entries++;
            continue;
        }
        if (!isSameCitizenName(entry.citizen_name, citizen_name)) {
            continue;
        }
        if (entry.kind === 'arrival') {
            current = createPass(entry.time_ms);
            passes.push(current);
        } else if (entry.kind === 'departure') {
            current.departure_ms = entry.time_ms;
            // Un retour dont l'arrivée manque (ligne masquée) ouvre un passage de début inconnu
            current = createPass(null);
            passes.push(current);
        } else if (entry.kind === 'failed_dig') {
            current.fail_times_ms.push(entry.time_ms);
        }
    }
    return passes;
}

/**
 * Nombre minimal de fouilles dans [from_ms, to_ms]. Grille connue (prochaine fouille) : les
 * fouilles tombent à `next_dig_ms − j × intervalle`, j ≥ 1. Grille inconnue : un intervalle de
 * longueur L en contient au moins ⌊L / intervalle⌋, quel que soit son calage.
 */
function countCertainDigs(from_ms: number, to_ms: number, interval_ms: number, next_dig_ms: number | null): number {
    if (!Number.isFinite(from_ms) || to_ms < from_ms) {
        return 0;
    }
    if (next_dig_ms === null) {
        return Math.floor((to_ms - from_ms) / interval_ms);
    }
    const last_step: number = Math.floor((next_dig_ms - from_ms) / interval_ms);
    const first_step: number = Math.max(1, Math.ceil((next_dig_ms - to_ms) / interval_ms));
    return Math.max(0, last_step - first_step + 1);
}

function estimatePass(pass: DigPass, is_current: boolean, digger: Digger, log: DigLog): PassEstimate {
    const interval_ms: number = digger.dig_interval_ms;
    const fails: number = pass.fail_times_ms.length;
    const digging_now: boolean = is_current && digger.is_digging;
    if (fails === 0 && !digging_now) {
        // Rien ne prouve une fouille pendant ce passage
        return { success_digs: 0, total_digs: 0, exact: false, has_digs: false };
    }
    const next_dig_ms: number | null = digging_now ? digger.next_dig_ms : null;

    // Borne stricte du début des fouilles : T0 < t0_bound. Toute fouille à partir de là est automatique.
    let t0_bound: number = Infinity;
    if (pass.arrival_ms !== null) {
        t0_bound = pass.arrival_ms + interval_ms;
    }
    if (fails > 0) {
        // Un échec vient d'une fouille automatique, d'au moins un intervalle après T0, traitée avant son écriture
        t0_bound = Math.min(t0_bound, pass.fail_times_ms[0] + minute_ms - interval_ms);
    }

    // Jusqu'où les fouilles ont certainement eu lieu, et jusqu'où leurs échecs sont écrits : le départ,
    // traité par le jeu avant d'être écrit, couvre toutes les fouilles du passage (heure à la minute : borne basse)
    let logged_until: number | null = null;
    if (next_dig_ms !== null) {
        logged_until = next_dig_ms - 1;
    } else if (pass.departure_ms !== null) {
        logged_until = pass.departure_ms;
    } else if (fails > 0) {
        logged_until = pass.fail_times_ms[fails - 1];
    }
    const happened_until: number | null = next_dig_ms !== null ? next_dig_ms - 1 : (digging_now ? log.now_ms : logged_until);

    const logged_digs: number = logged_until === null ? 0 : countCertainDigs(t0_bound, logged_until, interval_ms, next_dig_ms);
    const happened_digs: number = happened_until === null ? 0 : countCertainDigs(t0_bound, happened_until, interval_ms, next_dig_ms);

    return {
        success_digs: Math.max(0, logged_digs - fails - pass.hidden_entries),
        total_digs: 1 + Math.max(happened_digs, fails),
        // Grille connue et arrivée visible : T0 est la seule fouille de la grille dans [arrivée, arrivée + intervalle[
        exact: next_dig_ms !== null && pass.arrival_ms !== null && pass.hidden_entries === 0,
        has_digs: true
    };
}

/**
 * Fouilles d'un citoyen sur la case, présent ou parti, pour toute la journée : somme de ses passages.
 * Un passage sans échec écrit ni fouille en cours ne compte pas : rien n'y prouve une fouille.
 */
export function estimateSuccessfulDigs(log: DigLog, digger: Digger): DigEstimate {
    const passes: DigPass[] = splitIntoPasses(log, digger.name);
    let success_digs: number = 0;
    let total_digs: number = 0;
    let exact: boolean = true;
    let has_digs: boolean = false;
    passes.forEach((pass: DigPass, index: number): void => {
        const estimate: PassEstimate = estimatePass(pass, index === passes.length - 1, digger, log);
        if (!estimate.has_digs) {
            return;
        }
        has_digs = true;
        exact = exact && estimate.exact;
        success_digs += estimate.success_digs;
        total_digs += estimate.total_digs;
    });
    return { citizen_id: digger.id, success_digs, total_digs, exact: has_digs && exact };
}

export function isSentDigsMemory(value: unknown): value is SentDigsMemory {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const memory: Partial<SentDigsMemory> = value as Partial<SentDigsMemory>;
    return typeof memory.town_id === 'number' && typeof memory.day === 'number'
        && !!memory.values && typeof memory.values === 'object'
        && Object.values(memory.values).every((pair: unknown): boolean => Array.isArray(pair) && pair.length === 2
            && pair.every((count: unknown): boolean => typeof count === 'number' && Number.isFinite(count)));
}

/**
 * Valeurs à envoyer, fusionnées au maximum avec celles déjà envoyées par ce navigateur pour la
 * même case, le même citoyen et le même jour. L'API remplace la valeur du jour et rend les
 * fouilles d'un écart négatif : une estimation plus pauvre (registre partiel, passage précédent
 * sorti du registre) ne doit pas effacer une meilleure. Un minorant nul qui n'est pas exact
 * n'apporte rien : il n'est pas envoyé, pour ne pas écraser la valeur d'un autre joueur.
 */
export function mergeWithSentDigs(estimates: DigEstimate[], memory: SentDigsMemory | undefined, town_id: number, day: number,
                                  x: number, y: number): { values: SuccessfulDigValue[]; memory: SentDigsMemory } {
    const values_memory: Record<string, [number, number]> = memory && memory.town_id === town_id && memory.day === day
        ? { ...memory.values }
        : {};
    const values: SuccessfulDigValue[] = [];
    for (const estimate of estimates) {
        if (estimate.success_digs <= 0 && !estimate.exact) {
            continue;
        }
        const key: string = `${x}:${y}:${estimate.citizen_id}`;
        const previous: [number, number] | undefined = values_memory[key];
        const success_digs: number = Math.max(estimate.success_digs, previous?.[0] ?? 0);
        const total_digs: number = Math.max(estimate.total_digs, previous?.[1] ?? 0, success_digs);
        values_memory[key] = [success_digs, total_digs];
        values.push({ citizenId: estimate.citizen_id, successDigs: success_digs, totalDigs: total_digs });
    }
    return { values, memory: { town_id, day, values: values_memory } };
}
