import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DigEstimate, Digger, DigLog } from './successful-digs';
import type { TownCitizenRef } from './successful-digs-page';
import {
    classifyLogText,
    collectSuccessfulDigs,
    computeTownOffsetMinutes,
    parseClockMinutes,
    readZoneDiggers,
    readZoneDigLog,
    resolveLogTimes
} from './successful-digs-page';

/** Heure de la ville : UTC+2 */
const offset_min: number = 120;
const midnight_utc_ms: number = Date.UTC(2026, 8, 24);

/** Instant (ms) d'une heure de la ville « H:MM » */
function townMs(clock: string, seconds: number = 0): number {
    const [hours, minutes]: number[] = clock.split(':').map(Number);
    return midnight_utc_ms + ((hours * 60 + minutes - offset_min) * 60 + seconds) * 1000;
}

/** Valeur d'un attribut `x-countdown-to` (secondes) */
function countdown(clock: string, seconds: number): string {
    return String(townMs(clock, seconds) / 1000);
}

// Rendu des variables par le jeu (`ICUTranslator`, `LogTemplateHandler::wrap`)
function citizen(name: string): string {
    return `<span  class="">${name}</span>`;
}

const profession: string = '<span  class=""><img alt="" src="/build/images/professions/basic.4f2a.gif" /></span>';

function failFr(name: string): string {
    return `Lors de sa dernière fouille, ${citizen(name)} n’a rien trouvé…`;
}

function arrivalFr(name: string): string {
    return `${citizen(name)} (${profession}) est arrivé depuis <span>le Nord</span>.`;
}

function departureFr(name: string): string {
    return `${citizen(name)} (${profession}) est parti vers <span>le Sud</span>…`;
}

function entry(time: string, content: string, type: number = 0): string {
    return `<div class="log-entry log-entry-type-${type} log-entry-class-0" data-template-id="12">`
        + `<span class="log-part-time">${time}</span>`
        + `<span class="log-part-content"><span class="container">${content}</span></span></div>`;
}

function hiddenEntry(time: string): string {
    return '<div class="log-entry log-entry-type-0 log-entry-class-3">'
        + `<span class="log-part-time">${time}</span>`
        + '<span class="log-part-content log-part-entry-hidden"><img alt="" src="/build/images/icons/warning.gif" /><span class="container">Ce contenu a été masqué.</span></span></div>';
}

function log(content: string): string {
    return `<hordes-log id="beyond-log"><div class="log-container"><div class="log days-inline"><div class="log-content">${content}</div></div></div></hordes-log>`;
}

/** Registre du jour 5 (du plus récent au plus ancien), puis la veille */
const zone_log: string = log(
    '<div class="log-day-header">Jour 5 (aujourd\'hui)</div>'
    + entry('14:02', `${citizen('Zerah')}: Lors de sa dernière fouille, Hélène n’a rien trouvé…`, 11)
    + entry('14:00', failFr('Hélène'))
    + entry('12:15', failFr('Zerah2'))
    + '<div class="log-silence">Silence depuis 1 heure</div>'
    + entry('11:20', failFr('Hélène'))
    + hiddenEntry('10:30')
    + entry('10:10', failFr('Zerah2'))
    + entry('10:01', failFr('Zerah'))
    + entry('9:00', departureFr('Parti'))
    + entry('8:50', failFr('Parti'))
    + entry('8:05', arrivalFr('Zerah2'))
    + entry('8:00', arrivalFr('Hélène'))
    + entry('8:00', arrivalFr('Zerah'))
    + entry('6:00', arrivalFr('Parti'))
    + '<div class="log-day-header">Jour 4</div>'
    + entry('23:50', failFr('Hélène'))
    + entry('20:00', arrivalFr('Hélène'))
    + '<div class="log-complete-link">Afficher toutes les entrées</div>'
);

function citizenRow(id: number, name: string, job: string, status: string, escorted: boolean = false): string {
    const box: string = '<div class="padded cell rw-4 citizen-box">'
        + '<img src="/build/images/icons/player_online.gif" alt="En ligne">'
        + `<img alt="" src="/build/images/professions/${job}.a1b2.gif">`
        + `<div class="inline"><span class="username" x-user-id="${id}">${name}</span><hordes-tooltip class="normal"><span class="warning">${name} : </span></hordes-tooltip></div></div>`
        + `<div class="padded cell rw-3"><ul class="status">${status}</ul></div>`;
    return escorted
        ? `<div class="beyond-escort-on"><div class="row-flex wrap">${box}</div></div>`
        : `<div class="row beyond-escort-off">${box}</div>`;
}

const digging_status: string = '<li class="status"><img src="/build/images/icons/small_gather.9c8d.gif" alt="Fouiller"><hordes-tooltip>Ce citoyen fouille actuellement une zone.</hordes-tooltip></li>';

function escortDiggingStatus(next: string): string {
    return '<li class="status"><img src="/build/images/icons/small_gather.9c8d.gif" alt="Fouiller">'
        + `<hordes-tooltip><b>Prochaine fouille automatique :</b><div class="center"><span x-countdown-to="${next}" x-on-expire="">1:00:00</span></div></hordes-tooltip></li>`;
}

const clock: string = '<div class="game-clock" data-town-id="42"><div class="town-day"><span class="day-number">Jour 5</span></div>'
    + '<div class="town-time"><hordes-tooltip class="help">Heure actuelle de la ville</hordes-tooltip>15:00</div></div>';

function ownDiggingNote(next: string): string {
    return '<div class="note note-light" id="mgd-digging-note"><img class="icon left" alt="" src="/build/images/icons/small_gather.gif" />'
        + `Prochaine fouille automatique : <span x-countdown-to="${next}" x-on-expire="reload">...</span></div>`;
}

const me: { id: number; name: string; job: string } = { id: 1, name: 'Hélène', job: 'dig' };

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('classifyLogText', () => {
    it.each([
        ['Lors de sa dernière fouille, Zerah n’a rien trouvé…', 'failed_dig'],
        ['Lors de sa dernière fouille, Zerah n\'a rien trouvé...', 'failed_dig'],
        ['Zerah found nothing during their last search...', 'failed_dig'],
        ['En su última búsqueda, Zerah no encontró nada...', 'failed_dig'],
        ['Zerah hat hier durch Graben nichts gefunden...', 'failed_dig'],
        ['Zerah () est arrivé depuis le Nord.', 'arrival'],
        ['Zerah () has arrived from the North.', 'arrival'],
        ['Zerah () ha llegado desde el Norte.', 'arrival'],
        ['Zerah () ist aus dem Norden angekommen.', 'arrival'],
        ['Zerah () est parti vers le Sud…', 'departure'],
        ['Zerah () has set out towards the South.', 'departure'],
        ['Zerah () se fue hacia el Sur...', 'departure'],
        ['Zerah () ist Richtung Süden aufgebrochen.', 'departure'],
        ['Zerah a trouvé Ferraille.', 'other'],
        ['Perte de contrôle : les fouilles de Zerah ont été interrompues !', 'other']
    ])('« %s » → %s', (text: string, kind: string) => {
        expect(classifyLogText(text)).toBe(kind);
    });
});

describe('heures', () => {
    it('lit une heure « H:MM » du jeu', () => {
        expect(parseClockMinutes('8:05')).toBe(485);
        expect(parseClockMinutes(' 23:59 ')).toBe(1439);
        expect(parseClockMinutes('24:00')).toBeNull();
        expect(parseClockMinutes('8h05')).toBeNull();
    });

    it('déduit le fuseau de la ville de son horloge, arrondi au quart d\'heure', () => {
        expect(computeTownOffsetMinutes(900, Date.UTC(2026, 8, 24, 13, 0, 20))).toBe(120);
        // Horloge affichée juste avant le changement de minute, et passage de minuit UTC
        expect(computeTownOffsetMinutes(69, Date.UTC(2026, 8, 24, 23, 10, 0, 300))).toBe(120);
        expect(computeTownOffsetMinutes(1350, Date.UTC(2026, 8, 24, 3, 30))).toBe(-300);
    });

    it('situe les lignes en remontant le temps, à travers minuit', () => {
        const now_ms: number = Date.UTC(2026, 8, 24, 0, 30, 15);

        const times: number[] = resolveLogTimes([5, 1435, 1390], now_ms, 0);

        expect(times).toEqual([Date.UTC(2026, 8, 24, 0, 5), Date.UTC(2026, 8, 23, 23, 55), Date.UTC(2026, 8, 23, 23, 10)]);
    });

    it('tolère une ligne récente un peu en avance sur l\'horloge du navigateur', () => {
        const now_ms: number = Date.UTC(2026, 8, 24, 14, 0, 30);

        const times: number[] = resolveLogTimes([842, 830], now_ms, 0);

        expect(times).toEqual([Date.UTC(2026, 8, 24, 14, 2), Date.UTC(2026, 8, 24, 13, 50)]);
    });
});

describe('readZoneDigLog', () => {
    const now_ms: number = townMs('15:00', 20);

    it('ne garde que les lignes du jour, dans l\'ordre chronologique', () => {
        document.body.innerHTML = zone_log;

        const day_log: DigLog | null = readZoneDigLog(document, 5, now_ms, offset_min);

        expect(day_log?.now_ms).toBe(now_ms);
        expect(day_log?.entries.map((line: { kind: string; citizen_name: string | null }): string => `${line.kind}:${line.citizen_name}`)).toEqual([
            'arrival:Parti', 'arrival:Zerah', 'arrival:Hélène', 'arrival:Zerah2', 'failed_dig:Parti', 'departure:Parti', 'failed_dig:Zerah',
            'failed_dig:Zerah2', 'hidden:null', 'failed_dig:Hélène', 'failed_dig:Zerah2', 'failed_dig:Hélène', 'other:Zerah'
        ]);
        expect(day_log?.entries[0].time_ms).toBe(townMs('6:00'));
        expect(day_log?.entries[12].time_ms).toBe(townMs('14:02'));
    });

    it('prend le jour du premier en-tête quand celui de la page est inconnu', () => {
        document.body.innerHTML = zone_log;

        expect(readZoneDigLog(document, null, now_ms, offset_min)?.entries).toHaveLength(13);
    });

    it('ne rend rien d\'un registre absent, en chargement, ou dont une heure est illisible', () => {
        expect(readZoneDigLog(document, 5, now_ms, offset_min)).toBeNull();

        document.body.innerHTML = log(entry('8:00', arrivalFr('Hélène')) + '<div class="log-spinner"><i class="fa fa-pulse fa-spinner"></i></div>');
        expect(readZoneDigLog(document, 5, now_ms, offset_min)).toBeNull();

        document.body.innerHTML = log(entry('8h00', arrivalFr('Hélène')));
        expect(readZoneDigLog(document, 5, now_ms, offset_min)).toBeNull();
    });
});

describe('readZoneDiggers', () => {
    it('identifie les citoyens par x-user-id et lit leur fouille en cours', () => {
        document.body.innerHTML = ownDiggingNote(countdown('15:30', 30))
            + citizenRow(7, 'Zerah', 'basic', escortDiggingStatus(countdown('16:00', 20)), true)
            + citizenRow(1, 'Hélène', 'dig', digging_status)
            + citizenRow(9, 'Toto', 'guardian', '')
            + citizenRow(8, 'Zerah2', 'dig', digging_status);

        const diggers: Digger[] = readZoneDiggers(me);

        expect(diggers).toEqual([
            { id: 7, name: 'Zerah', dig_interval_ms: 7200000, is_digging: true, next_dig_ms: townMs('16:00', 20) },
            { id: 1, name: 'Hélène', dig_interval_ms: 5400000, is_digging: true, next_dig_ms: townMs('15:30', 30) },
            { id: 9, name: 'Toto', dig_interval_ms: 7200000, is_digging: false, next_dig_ms: null },
            { id: 8, name: 'Zerah2', dig_interval_ms: 5400000, is_digging: true, next_dig_ms: null }
        ]);
    });

    it('ne prend pas le délai de re-fouille (minuteur passif) pour une fouille en cours', () => {
        document.body.innerHTML = '<div class="note note-light" id="mgd-digging-note"><img class="icon left" src="/build/images/icons/lock.gif" />'
            + `Vous avez déjà fouillé ici récemment. Prochaine fouille possible dans : <b x-countdown-to="${countdown('16:00', 0)}" x-on-expire="reload">...</b></div>`
            + citizenRow(1, 'Hélène', 'dig', '');

        expect(readZoneDiggers(me)).toEqual([{ id: 1, name: 'Hélène', dig_interval_ms: 5400000, is_digging: false, next_dig_ms: null }]);
    });

    it('seul sur la case (pas de liste de citoyens) : se prend soi-même', () => {
        document.body.innerHTML = ownDiggingNote(countdown('15:30', 30)) + '<div class="other_citizens"><em>Vous êtes seul dans cette zone...</em></div>';

        expect(readZoneDiggers(me)).toEqual([{ id: 1, name: 'Hélène', dig_interval_ms: 5400000, is_digging: true, next_dig_ms: townMs('15:30', 30) }]);
    });
});

describe('collectSuccessfulDigs', () => {
    it('estime les fouilles des citoyens présents d\'après le registre du jour', async () => {
        document.body.innerHTML = clock + ownDiggingNote(countdown('15:30', 30))
            + citizenRow(7, 'Zerah', 'basic', escortDiggingStatus(countdown('16:00', 20)), true)
            + citizenRow(1, 'Hélène', 'dig', digging_status)
            + citizenRow(9, 'Toto', 'guardian', '')
            + citizenRow(8, 'Zerah2', 'basic', digging_status)
            + zone_log;

        // « Parti » a un échec au registre mais n'est plus sur la case, ni dans la liste : ignoré
        const estimates: DigEstimate[] | null = await collectSuccessfulDigs(me, 5, townMs('15:00', 20), async (): Promise<TownCitizenRef[]> => []);

        expect(estimates).toEqual([
            // Escorte : fouilles à 10:00:20 (ratée), 12:00:20 et 14:00:20 ; la ligne masquée de 10:30 peut être un échec
            { citizen_id: 7, success_digs: 1, total_digs: 4, exact: false },
            // Soi : 9:30:30, 11:00:30 (ratée), 12:30:30, 14:00:30 (ratée) ; ligne masquée possible
            { citizen_id: 1, success_digs: 1, total_digs: 5, exact: false },
            { citizen_id: 9, success_digs: 0, total_digs: 0, exact: false },
            // Autre citoyen : ses échecs couvrent tout ce qui est certain
            { citizen_id: 8, success_digs: 0, total_digs: 4, exact: false }
        ]);
    });

    it('ne rend rien sans horloge du jeu', async () => {
        document.body.innerHTML = ownDiggingNote(countdown('15:30', 30)) + zone_log;

        expect(await collectSuccessfulDigs(me, 5, townMs('15:00', 20), async (): Promise<TownCitizenRef[]> => [])).toBeNull();
    });

    /** « Parti » : arrivée 6:00, fouilles à 6:00 (manuelle), 8:00 ratée, 10:00 et 12:00, départ à 13:10 */
    const departed_log: string = log(
        '<div class="log-day-header">Jour 5 (aujourd\'hui)</div>'
        + entry('13:10', departureFr('Parti'))
        + entry('8:05', failFr('Parti'))
        + entry('6:00', arrivalFr('Parti'))
    );

    it('compte un citoyen parti de la case, identifié par la liste des citoyens de la ville (C8)', async () => {
        document.body.innerHTML = clock + citizenRow(1, 'Hélène', 'dig', '') + departed_log;
        const load: Mock<() => Promise<TownCitizenRef[]>> = vi.fn(async (): Promise<TownCitizenRef[]> => [
            { id: 12, name: 'Parti', job: 'basic' },
            { id: 13, name: 'Autre', job: 'dig' }
        ]);

        const estimates: DigEstimate[] | null = await collectSuccessfulDigs(me, 5, townMs('15:00', 20), load);

        expect(load).toHaveBeenCalledTimes(1);
        expect(estimates).toEqual([
            { citizen_id: 1, success_digs: 0, total_digs: 0, exact: false },
            // Son départ a traité et écrit toutes ses fouilles : 8:00 ratée, 10:00 et 12:00 réussies
            { citizen_id: 12, success_digs: 2, total_digs: 4, exact: false }
        ]);
    });

    it('ne charge la liste des citoyens que pour un citoyen parti ayant un échec au registre', async () => {
        document.body.innerHTML = clock + citizenRow(1, 'Hélène', 'dig', '') + log(
            '<div class="log-day-header">Jour 5 (aujourd\'hui)</div>'
            + entry('13:10', departureFr('Parti'))
            + entry('11:20', failFr('Hélène'))
            + entry('6:00', arrivalFr('Parti'))
        );
        const load: Mock<() => Promise<TownCitizenRef[]>> = vi.fn(async (): Promise<TownCitizenRef[]> => []);

        await collectSuccessfulDigs(me, 5, townMs('15:00', 20), load);

        expect(load).not.toHaveBeenCalled();
    });

    it('ignore un citoyen parti si la liste échoue, ou si son pseudo y est absent ou ambigu', async () => {
        document.body.innerHTML = clock + citizenRow(1, 'Hélène', 'dig', '') + departed_log;
        const only_present: DigEstimate[] = [{ citizen_id: 1, success_digs: 0, total_digs: 0, exact: false }];

        expect(await collectSuccessfulDigs(me, 5, townMs('15:00', 20), async (): Promise<TownCitizenRef[]> => {
            throw new Error('API indisponible');
        })).toEqual(only_present);
        expect(await collectSuccessfulDigs(me, 5, townMs('15:00', 20), async (): Promise<TownCitizenRef[]> => [
            { id: 12, name: 'Parti', job: null },
            { id: 14, name: 'Parti', job: null }
        ])).toEqual(only_present);
    });
});
