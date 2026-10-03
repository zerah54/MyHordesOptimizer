import type { DigEstimate, Digger, DigLog, DigLogEntry, DigLogEntryKind } from './successful-digs';
import { estimateSuccessfulDigs, isSameCitizenName } from './successful-digs';

/**
 * Lecture, sur la page du désert, de ce qu'il faut pour estimer les fouilles réussies :
 * registre de la case (`hordes-log#beyond-log`), citoyens présents, comptes à rebours.
 * Structure vérifiée sur la source MyHordes (`templates/ajax/game/beyond/desert.html.twig`,
 * `assets/ts/react/log/Wrapper.tsx`, `LogTemplateHandler`).
 */

const minute_ms: number = 60000;
const day_minutes: number = 1440;
/** Avance tolérée des heures du registre (horloge du serveur) sur l'horloge du navigateur */
const clock_skew_tolerance_min: number = 5;
/** Réglages par défaut du jeu (`times.digging.collec`, `times.digging.normal`) */
const scavenger_dig_interval_ms: number = 90 * minute_ms;
const default_dig_interval_ms: number = 120 * minute_ms;

/**
 * Fragments distinctifs, sur le texte normalisé, des lignes utiles dans les quatre langues du jeu
 * (`translations/game+intl-icu.*.yml`). Le texte français s'écrit avec « ’ » et « … », que la
 * normalisation ramène à « ' » et « ... ».
 */
const log_patterns: { kind: DigLogEntryKind; pattern: RegExp }[] = [
    { kind: 'failed_dig', pattern: /n'a rien trouve|found nothing during|no encontro nada|durch graben nichts gefunden/ },
    { kind: 'arrival', pattern: /\best arrivee? depuis\b|\bhas arrived from\b|\bha llegado desde\b|\bist aus .*\bangekommen\b/ },
    { kind: 'departure', pattern: /\best partie? vers\b|\bhas set out towards\b|\bse fue hacia\b|\bist richtung .*\baufgebrochen\b/ }
];

/** Citoyen de la page, pour le repli quand la liste des citoyens de la case est absente (citoyen seul) */
export interface PageUser {
    id: number;
    name: string;
    /** Métier (nom de l'icône du jeu, `dig` pour le fouineur) */
    job: string;
}

/** Citoyen de la ville (liste MHO), pour identifier ceux qui ont quitté la case */
export interface TownCitizenRef {
    id: number;
    name: string;
    /** Métier (`jobUid` de l'API : nom de l'icône du jeu, `dig` pour le fouineur), `null` s'il est inconnu */
    job: string | null;
}

export function normalizeLogText(text: string): string {
    return text.normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[‘’ʼ]/g, '\'')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

export function classifyLogText(text: string): DigLogEntryKind {
    const normalized: string = normalizeLogText(text);
    const match: { kind: DigLogEntryKind; pattern: RegExp } | undefined = log_patterns.find((log_pattern: { kind: DigLogEntryKind; pattern: RegExp }): boolean => log_pattern.pattern.test(normalized));
    return match ? match.kind : 'other';
}

/** Minutes du jour d'une heure « H:MM », `null` si illisible */
export function parseClockMinutes(text: string): number | null {
    const match: RegExpMatchArray | null = text.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return null;
    }
    const hours: number = +match[1];
    const minutes: number = +match[2];
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/**
 * Décalage (min) de l'heure de la ville sur UTC. L'horloge du jeu l'affiche d'après l'horloge du
 * navigateur et le fuseau du serveur, celui des heures du registre : l'arrondi au quart d'heure
 * absorbe la minute qui a pu passer depuis son affichage.
 */
export function computeTownOffsetMinutes(town_minutes: number, now_ms: number): number {
    const utc_minutes: number = Math.floor(now_ms / minute_ms) % day_minutes;
    const offset: number = ((Math.round((town_minutes - utc_minutes) / 15) * 15) % day_minutes + day_minutes) % day_minutes;
    return offset > day_minutes / 2 ? offset - day_minutes : offset;
}

/**
 * Horodatages des lignes du jour, données de la plus récente à la plus ancienne (ordre du
 * registre). On remonte le temps depuis maintenant, ligne après ligne : le passage de minuit est
 * absorbé, et l'ordre du registre respecté. La plus récente peut devancer un peu l'horloge du
 * navigateur.
 */
export function resolveLogTimes(minutes_newest_first: number[], now_ms: number, offset_min: number): number[] {
    const now_minute: number = Math.floor(now_ms / minute_ms);
    let previous: number = ((now_minute + offset_min) % day_minutes + day_minutes) % day_minutes;
    let minutes_back: number = 0;
    return minutes_newest_first.map((minutes: number, index: number): number => {
        let step: number = ((previous - minutes) % day_minutes + day_minutes) % day_minutes;
        if (index === 0 && step > day_minutes - clock_skew_tolerance_min) {
            step -= day_minutes;
        }
        minutes_back += step;
        previous = minutes;
        return (now_minute - minutes_back) * minute_ms;
    });
}

/**
 * Lignes d'événements divers (`log-entry-type-0`) : arrivées, départs et fouilles. Une ligne de
 * discussion (`log-entry-type-11`) ne l'est pas, même si son texte ressemble à un échec.
 */
function isVariousEventEntry(node: Element): boolean {
    const type_class: string | undefined = Array.from(node.classList).find((class_name: string): boolean => class_name.startsWith('log-entry-type-'));
    return type_class === undefined || type_class === 'log-entry-type-0';
}

function readLogEntry(node: Element): { kind: DigLogEntryKind; citizen_name: string | null } {
    const content: Element | null = node.querySelector('.log-part-content');
    const various: boolean = isVariousEventEntry(node);
    if (content?.classList.contains('log-part-entry-hidden')) {
        return { kind: various ? 'hidden' : 'other', citizen_name: null };
    }
    const container: Element | null = content?.querySelector('.container') ?? content;
    // Le citoyen est la première variable de ces lignes, rendue en `<span>` : on garde son texte exact
    const citizen_name: string | null = container?.querySelector('span')?.textContent?.trim() || null;
    return { kind: various ? classifyLogText(container?.textContent ?? '') : 'other', citizen_name };
}

function parseFirstInteger(text: string | null): number | null {
    const match: RegExpMatchArray | null = (text ?? '').match(/\d+/);
    return match ? +match[0] : null;
}

/**
 * Lignes du jour du registre de la case. Le registre du désert affiche tous les jours à la suite,
 * séparés par un en-tête « Jour N » : seules comptent celles du jour (`today`, à défaut celui du
 * premier en-tête). `null` quand le registre est absent, en chargement, ou qu'une heure est
 * illisible (un échec ignoré surestimerait les réussites).
 */
export function readZoneDigLog(root: ParentNode, today: number | null, now_ms: number, offset_min: number): DigLog | null {
    if (!root.querySelector('.log-content') || root.querySelector('.log-spinner')) {
        return null;
    }
    let section_day: number | null = today;
    const minutes: number[] = [];
    const rows: { kind: DigLogEntryKind; citizen_name: string | null }[] = [];
    for (const node of Array.from(root.querySelectorAll('.log-day-header, .log-entry'))) {
        if (node.classList.contains('log-day-header')) {
            const day: number | null = parseFirstInteger(node.textContent);
            if (day === null) {
                continue;
            }
            if (section_day === null) {
                section_day = day;
            } else if (day !== section_day) {
                break;
            }
            continue;
        }
        const time: number | null = parseClockMinutes(node.querySelector('.log-part-time')?.textContent ?? '');
        if (time === null) {
            return null;
        }
        minutes.push(time);
        rows.push(readLogEntry(node));
    }
    const times: number[] = resolveLogTimes(minutes, now_ms, offset_min);
    const entries: DigLogEntry[] = rows
        .map((row: { kind: DigLogEntryKind; citizen_name: string | null }, index: number): DigLogEntry => ({ kind: row.kind, citizen_name: row.citizen_name, time_ms: times[index] }))
        .reverse();
    return { entries, now_ms };
}

/** Horodatage (ms) d'un compte à rebours du jeu (`x-countdown-to`, en secondes), `null` s'il est illisible */
function readCountdownMs(element: Element | null | undefined): number | null {
    const seconds: number = parseInt(element?.getAttribute('x-countdown-to') ?? '', 10);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function digIntervalFor(job: string): number {
    return job === 'dig' ? scavenger_dig_interval_ms : default_dig_interval_ms;
}

/**
 * Citoyens présents sur la case, identifiés par `x-user-id`. Fouille en cours : pour soi, la note
 * `#mgd-digging-note` porte le compte à rebours de la prochaine fouille (`span`, un `b` étant celui
 * d'une re-fouille possible, minuteur passif) ; pour les autres, l'icône `small_gather` de leurs
 * statuts, dont l'infobulle porte aussi le compte à rebours pour son escorte.
 */
export function readZoneDiggers(user: PageUser): Digger[] {
    const own_countdown: Element | null = document.querySelector('#mgd-digging-note span[x-countdown-to]');
    const diggers: Digger[] = [];
    for (const username of Array.from(document.querySelectorAll('.citizen-box .username[x-user-id]'))) {
        const id: number = parseInt(username.getAttribute('x-user-id') ?? '', 10);
        if (!Number.isFinite(id)) {
            continue;
        }
        const box: Element | null = username.closest('.citizen-box');
        const job_match: RegExpMatchArray | null | undefined = box?.querySelector('img[src*="professions/"]')?.getAttribute('src')?.match(/professions\/(\w+)/);
        const job: string = job_match?.[1] ?? (id === user.id ? user.job : '');
        const row: Element | null = username.closest('.beyond-escort-on, .beyond-escort-off') ?? box?.parentElement ?? null;
        let is_digging: boolean;
        let next_dig_ms: number | null = null;
        if (id === user.id) {
            is_digging = !!own_countdown;
            next_dig_ms = readCountdownMs(own_countdown);
        } else {
            const gather_status: Element | null | undefined = row?.querySelector('li.status img[src*="small_gather"]')?.closest('li');
            is_digging = !!gather_status;
            // Escorte : le chargement de ma page traite et écrit aussi ses fouilles
            if (gather_status && row?.classList.contains('beyond-escort-on')) {
                next_dig_ms = readCountdownMs(gather_status.querySelector('[x-countdown-to]'));
            }
        }
        diggers.push({ id, name: username.textContent?.trim() ?? '', dig_interval_ms: digIntervalFor(job), is_digging, next_dig_ms });
    }
    if (diggers.length === 0) {
        // Seul sur la case : le jeu n'affiche pas la liste des citoyens
        diggers.push({ id: user.id, name: user.name, dig_interval_ms: digIntervalFor(user.job), is_digging: !!own_countdown, next_dig_ms: readCountdownMs(own_countdown) });
    }
    return diggers.filter((digger: Digger): boolean => digger.name !== '');
}

/**
 * Pseudos des citoyens partis de la case dans la journée : auteurs d'un échec de fouille au registre,
 * absents de la case. Seul un échec prouve qu'ils ont fouillé.
 */
export function readAbsentDiggerNames(log: DigLog, present: Digger[]): string[] {
    const names: string[] = [];
    for (const entry of log.entries) {
        const name: string | null = entry.citizen_name;
        if (entry.kind !== 'failed_dig' || name === null) {
            continue;
        }
        const is_known: boolean = present.some((digger: Digger): boolean => isSameCitizenName(name, digger.name))
            || names.some((other: string): boolean => isSameCitizenName(name, other));
        if (!is_known) {
            names.push(name);
        }
    }
    return names;
}

/**
 * Citoyens partis, identifiés par la liste des citoyens de la ville : le registre n'écrit que leur pseudo.
 * Un pseudo introuvable, ambigu, ou déjà présent sous un autre nom est ignoré. Pas de compte à rebours
 * pour eux (grille inconnue) ; un métier inconnu prend l'intervalle le plus long, qui minore.
 */
export function resolveAbsentDiggers(names: string[], present: Digger[], town_citizens: TownCitizenRef[]): Digger[] {
    const present_ids: Set<number> = new Set<number>(present.map((digger: Digger): number => digger.id));
    return names.flatMap((name: string): Digger[] => {
        const matches: TownCitizenRef[] = town_citizens.filter((citizen: TownCitizenRef): boolean => isSameCitizenName(name, citizen.name));
        if (matches.length !== 1 || present_ids.has(matches[0].id)) {
            return [];
        }
        const [citizen]: TownCitizenRef[] = matches;
        return [{ id: citizen.id, name: citizen.name, dig_interval_ms: digIntervalFor(citizen.job ?? ''), is_digging: false, next_dig_ms: null }];
    });
}

/** Minutes du jour affichées par l'horloge du jeu (le texte contient aussi celui de son infobulle) */
function readTownClockMinutes(): number | null {
    const matches: RegExpMatchArray | null = (document.querySelector('.game-clock .town-time')?.textContent ?? '').match(/\d{1,2}:\d{2}/g);
    return matches ? parseClockMinutes(matches[matches.length - 1]) : null;
}

/**
 * Fouilles réussies des citoyens de la case, présents puis partis dans la journée, `null` quand
 * l'horloge du jeu ou le registre manquent. La liste des citoyens de la ville (`loadTownCitizens`)
 * n'est chargée que si un citoyen parti a un échec au registre ; sans elle, seuls les présents
 * sont comptés.
 */
export async function collectSuccessfulDigs(user: PageUser, today: number | null, now_ms: number,
                                            loadTownCitizens: () => Promise<TownCitizenRef[]>): Promise<DigEstimate[] | null> {
    const town_minutes: number | null = readTownClockMinutes();
    if (town_minutes === null) {
        return null;
    }
    // Registre de la case (`hordes-log#beyond-log`) ; à défaut, la page, qui n'en affiche pas d'autre
    const log_root: Element | null = document.querySelector('#beyond-log');
    const root: ParentNode = log_root?.querySelector('.log-content') ? log_root : document;
    const log: DigLog | null = readZoneDigLog(root, today, now_ms, computeTownOffsetMinutes(town_minutes, now_ms));
    if (!log) {
        return null;
    }
    const present: Digger[] = readZoneDiggers(user);
    const absent_names: string[] = readAbsentDiggerNames(log, present);
    const absent: Digger[] = absent_names.length === 0
        ? []
        : resolveAbsentDiggers(absent_names, present, await loadTownCitizens().catch((): TownCitizenRef[] => []));
    return present.concat(absent).map((digger: Digger): DigEstimate => estimateSuccessfulDigs(log, digger));
}
