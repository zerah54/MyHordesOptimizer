import { describe, expect, it } from 'vitest';

import type { DigEstimate, Digger, DigLog, DigLogEntry, DigLogEntryKind, SentDigsMemory, SuccessfulDigValue } from './successful-digs';
import { estimateSuccessfulDigs, isSameCitizenName, isSentDigsMemory, mergeWithSentDigs } from './successful-digs';

const midnight_ms: number = Date.UTC(2026, 8, 24);
const minute_ms: number = 60000;
const scavenger_interval_ms: number = 90 * minute_ms;
const default_interval_ms: number = 120 * minute_ms;

/** Instant du jour « H:MM », plus quelques secondes */
function at(clock: string, seconds: number = 0): number {
    const [hours, minutes]: number[] = clock.split(':').map(Number);
    return midnight_ms + ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function line(kind: DigLogEntryKind, citizen_name: string | null, clock: string): DigLogEntry {
    return { kind, citizen_name, time_ms: at(clock) };
}

function dayLog(now: string, entries: DigLogEntry[]): DigLog {
    return { entries, now_ms: at(now) };
}

function digger(overrides: Partial<Digger>): Digger {
    return { id: 1, name: 'Hélène', dig_interval_ms: default_interval_ms, is_digging: false, next_dig_ms: null, ...overrides };
}

describe('estimateSuccessfulDigs — soi-même (prochaine fouille connue)', () => {
    /**
     * Fouineuse arrivée à 8:00, première fouille (manuelle) à 8:00:30, puis 9:30:30 réussie,
     * 11:00:30 ratée (écrite au chargement de 11:20), 12:30:30 réussie, 14:00:30 ratée (écrite à 14:00),
     * prochaine à 15:30:30. Quatre fouilles automatiques, deux ratées : deux réussites certaines.
     */
    it('compte les fouilles automatiques depuis l\'arrivée, moins les échecs, sans la fouille manuelle', () => {
        const log: DigLog = dayLog('15:00', [
            line('arrival', 'Hélène', '8:00'),
            line('arrival', 'Toto', '9:00'),
            line('failed_dig', 'Hélène', '11:20'),
            line('failed_dig', 'Hélène', '14:00')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('15:30', 30) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 2, total_digs: 5, exact: true });
    });

    it('ne compte jamais la fouille manuelle comme réussie : son échec n\'est pas écrit (C1)', () => {
        const log: DigLog = dayLog('8:05', [line('arrival', 'Hélène', '8:00')]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('9:30', 30) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 0, total_digs: 1, exact: true });
    });

    it('compte toutes les fouilles automatiques quand aucune n\'a échoué', () => {
        const log: DigLog = dayLog('15:00', [line('arrival', 'Hélène', '8:00')]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('15:30', 30) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 4, total_digs: 5, exact: true });
    });

    /**
     * Nuit passée sur la case : aucune arrivée du jour. L'heure d'un échec est celle de son
     * traitement : elle borne le début des fouilles (au plus un intervalle avant), elle n'en est
     * pas le début (C2). Le début de journée n'est jamais pris pour début des fouilles.
     */
    it('sans arrivée, ne compte que ce que le premier échec prouve (C2)', () => {
        const log: DigLog = dayLog('15:00', [
            line('failed_dig', 'Hélène', '11:20'),
            line('failed_dig', 'Hélène', '14:00')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('15:30', 30) }));

        // Début au plus tard à 9:51 : fouilles automatiques certaines à 11:00:30, 12:30:30 et 14:00:30
        expect(estimate).toEqual({ citizen_id: 1, success_digs: 1, total_digs: 4, exact: false });
    });

    it('sans arrivée ni échec, ne compte aucune réussite', () => {
        const estimate: DigEstimate = estimateSuccessfulDigs(dayLog('15:00', []), digger({ is_digging: true, next_dig_ms: at('16:00') }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 0, total_digs: 1, exact: false });
    });

    it('compte chaque ligne masquée du passage comme un échec possible', () => {
        const log: DigLog = dayLog('15:00', [
            line('arrival', 'Hélène', '8:00'),
            line('hidden', null, '11:00'),
            line('failed_dig', 'Hélène', '14:00')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('15:30', 30) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 2, total_digs: 5, exact: false });
    });
});

describe('estimateSuccessfulDigs — pseudos', () => {
    it('distingue deux pseudos dont l\'un est le préfixe de l\'autre (C5)', () => {
        const log: DigLog = dayLog('15:00', [
            line('arrival', 'Zerah', '8:00'),
            line('arrival', 'Zerah2', '8:05'),
            line('failed_dig', 'Zerah', '10:01'),
            line('failed_dig', 'Zerah2', '10:10'),
            line('failed_dig', 'Zerah2', '12:15')
        ]);

        const zerah: DigEstimate = estimateSuccessfulDigs(log, digger({ id: 7, name: 'Zerah', is_digging: true, next_dig_ms: at('16:00', 20) }));
        const zerah2: DigEstimate = estimateSuccessfulDigs(log, digger({ id: 8, name: 'Zerah2', is_digging: true }));

        // Zerah : fouilles automatiques à 10:00:20 (ratée), 12:00:20 et 14:00:20
        expect(zerah).toEqual({ citizen_id: 7, success_digs: 2, total_digs: 4, exact: true });
        // Zerah2 : ses deux échecs couvrent tout ce qui est certain ; aucune réussite prouvée
        expect(zerah2).toEqual({ citizen_id: 8, success_digs: 0, total_digs: 4, exact: false });
    });

    it('compare les pseudos exactement, espaces et forme Unicode normalisés', () => {
        expect(isSameCitizenName('Zerah2', 'Zerah')).toBe(false);
        expect(isSameCitizenName(' Hélène ', 'Hélène'.normalize('NFC'))).toBe(true);
        expect(isSameCitizenName('Hélène', 'Hélène')).toBe(true);
        expect(isSameCitizenName(null, 'Hélène')).toBe(false);
    });
});

describe('estimateSuccessfulDigs — autres citoyens (prochaine fouille inconnue)', () => {
    /**
     * Arrivée 8:00, fouilles à 8:00 (manuelle), 10:00 ratée (écrite à 10:03), 12:00 et 14:00
     * réussies (rien d'écrit), 16:00 ratée (écrite à 16:02). Seules comptent les fouilles
     * traitées au dernier chargement de sa page, dans le pire calage de la grille.
     */
    it('minore les réussites jusqu\'au dernier échec écrit', () => {
        const log: DigLog = dayLog('17:00', [
            line('arrival', 'Toto', '8:00'),
            line('failed_dig', 'Toto', '10:03'),
            line('failed_dig', 'Toto', '16:02')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ id: 2, name: 'Toto', is_digging: true }));

        expect(estimate).toEqual({ citizen_id: 2, success_digs: 1, total_digs: 5, exact: false });
    });

    it('ne prouve aucune réussite sans échec écrit, même après des heures de fouille', () => {
        const log: DigLog = dayLog('17:00', [line('arrival', 'Toto', '8:00')]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ id: 2, name: 'Toto', is_digging: true }));

        // Fouilles certaines (hypothèse A1 : début avant 10:00) : la manuelle, puis 12:00, 14:00 et 16:00 au plus tôt
        expect(estimate).toEqual({ citizen_id: 2, success_digs: 0, total_digs: 4, exact: false });
    });

    /**
     * Toto, arrivé à 8:00, fouille à 8:00 (manuelle), 10:00 ratée (écrite à 10:03), 12:00 et 14:00
     * réussies, puis part à 15:10 : son départ a traité et écrit tout ce qui précède (C8).
     */
    it('borne un passage terminé par un départ à l\'heure du départ, pas au dernier échec (C8)', () => {
        const log: DigLog = dayLog('17:00', [
            line('arrival', 'Toto', '8:00'),
            line('failed_dig', 'Toto', '10:03'),
            line('departure', 'Toto', '15:10')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ id: 2, name: 'Toto' }));

        expect(estimate).toEqual({ citizen_id: 2, success_digs: 2, total_digs: 4, exact: false });
    });

    it('ignore un citoyen présent sans fouille en cours ni échec', () => {
        const estimate: DigEstimate = estimateSuccessfulDigs(dayLog('17:00', [line('arrival', 'Toto', '8:00')]), digger({ id: 2, name: 'Toto' }));

        expect(estimate).toEqual({ citizen_id: 2, success_digs: 0, total_digs: 0, exact: false });
    });
});

describe('estimateSuccessfulDigs — passages multiples', () => {
    /**
     * Arrivée 8:00, fouilles à 8:00:30, 10:00:30 et 12:00:30 ratées, départ 12:30, retour 16:00 et
     * nouvelle fouille (re-fouille permise). L'ancien calcul comptait les échecs de toute la
     * journée contre les fouilles du seul dernier passage : −1 réussite (C3).
     */
    it('rattache les échecs à leur passage et ne rend jamais de réussites négatives (C3)', () => {
        const log: DigLog = dayLog('17:00', [
            line('arrival', 'Hélène', '8:00'),
            line('failed_dig', 'Hélène', '10:05'),
            line('failed_dig', 'Hélène', '12:10'),
            line('departure', 'Hélène', '12:30'),
            line('arrival', 'Hélène', '16:00')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ is_digging: true, next_dig_ms: at('18:00', 40) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 0, total_digs: 4, exact: false });
    });

    it('additionne les passages de la journée (C4)', () => {
        const log: DigLog = dayLog('17:00', [
            line('arrival', 'Hélène', '6:00'),
            line('failed_dig', 'Hélène', '8:05'),
            line('failed_dig', 'Hélène', '12:10'),
            line('departure', 'Hélène', '12:30'),
            line('arrival', 'Hélène', '13:00')
        ]);

        // Premier passage : fouilles automatiques certaines à 8:00, 10:00, 12:00 → une réussite
        // Passage en cours, arrivée 13:00 : 15:00:30 → une réussite
        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ is_digging: true, next_dig_ms: at('17:00', 30) }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 2, total_digs: 6, exact: false });
    });

    it('garde dans son passage un échec écrit au départ, dans la même minute que le retour', () => {
        const log: DigLog = dayLog('15:00', [
            line('arrival', 'Hélène', '8:00'),
            line('failed_dig', 'Hélène', '12:30'),
            line('departure', 'Hélène', '12:30'),
            line('arrival', 'Hélène', '12:30')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ is_digging: true, next_dig_ms: at('16:30', 40) }));

        // Passage en cours : fouille automatique à 14:30:40, sans échec. Rattaché à ce passage,
        // l'échec de 12:30 l'aurait annulée ; le premier passage, lui, ne prouve aucune réussite.
        expect(estimate.success_digs).toBe(1);
    });

    /**
     * Citoyen toujours sur la case mais qui ne fouille plus (retour sans re-fouille, zone perdue) :
     * ses fouilles du jour comptent encore (C8).
     */
    it('compte les fouilles d\'un citoyen présent qui a cessé de fouiller (C8)', () => {
        const log: DigLog = dayLog('17:00', [
            line('arrival', 'Hélène', '8:00'),
            line('failed_dig', 'Hélène', '10:05'),
            line('failed_dig', 'Hélène', '14:10'),
            line('departure', 'Hélène', '14:30'),
            line('arrival', 'Hélène', '16:00')
        ]);

        const estimate: DigEstimate = estimateSuccessfulDigs(log, digger({ is_digging: false }));

        expect(estimate).toEqual({ citizen_id: 1, success_digs: 1, total_digs: 4, exact: false });
    });
});

describe('estimateSuccessfulDigs — registre incomplet', () => {
    /**
     * Fouilles à 8:00:30 (manuelle), 9:30:30 ratée (écrite à 9:35), 11:00:30 réussie, 12:30:30
     * ratée (écrite à 12:31), 14:00:30 réussie. Registre complet : deux réussites exactes.
     */
    const complete_entries: DigLogEntry[] = [
        line('arrival', 'Hélène', '8:00'),
        line('failed_dig', 'Hélène', '9:35'),
        line('other', 'Toto', '10:00'),
        line('failed_dig', 'Hélène', '12:31')
    ];
    const me: Digger = digger({ dig_interval_ms: scavenger_interval_ms, is_digging: true, next_dig_ms: at('15:30', 30) });

    it('registre complet : valeur exacte', () => {
        expect(estimateSuccessfulDigs(dayLog('15:00', complete_entries), me)).toEqual({ citizen_id: 1, success_digs: 2, total_digs: 5, exact: true });
    });

    it('arrivée et premier échec hors de la partie affichée : minorant, sans l\'échec invisible', () => {
        // Seules les lignes depuis 10:00 sont affichées
        const estimate: DigEstimate = estimateSuccessfulDigs(dayLog('15:00', complete_entries.slice(2)), me);

        // Début au plus tard à 11:02 : fouilles certaines à 12:30:30 (ratée) et 14:00:30
        expect(estimate).toEqual({ citizen_id: 1, success_digs: 1, total_digs: 3, exact: false });
    });
});

describe('mergeWithSentDigs', () => {
    const estimates: DigEstimate[] = [
        { citizen_id: 1, success_digs: 2, total_digs: 5, exact: true },
        { citizen_id: 2, success_digs: 0, total_digs: 3, exact: false },
        { citizen_id: 3, success_digs: 0, total_digs: 1, exact: true }
    ];

    it('n\'envoie pas un minorant nul inexact, qui écraserait la valeur d\'un autre joueur', () => {
        const merged: { values: SuccessfulDigValue[]; memory: SentDigsMemory } = mergeWithSentDigs(estimates, undefined, 42, 5, 3, -2);

        expect(merged.values).toEqual([
            { citizenId: 1, successDigs: 2, totalDigs: 5 },
            { citizenId: 3, successDigs: 0, totalDigs: 1 }
        ]);
        expect(merged.memory).toEqual({ town_id: 42, day: 5, values: { '3:-2:1': [2, 5], '3:-2:3': [0, 1] } });
    });

    it('garde le maximum déjà envoyé pour la même case, le même citoyen et le même jour (C4)', () => {
        const memory: SentDigsMemory = { town_id: 42, day: 5, values: { '3:-2:1': [4, 6], '1:1:1': [9, 9] } };

        const merged: { values: SuccessfulDigValue[]; memory: SentDigsMemory } = mergeWithSentDigs(estimates, memory, 42, 5, 3, -2);

        expect(merged.values[0]).toEqual({ citizenId: 1, successDigs: 4, totalDigs: 6 });
        expect(merged.memory.values).toEqual({ '3:-2:1': [4, 6], '1:1:1': [9, 9], '3:-2:3': [0, 1] });
        // La mémoire reçue n'est pas modifiée
        expect(memory.values['3:-2:3']).toBeUndefined();
    });

    it('repart de zéro sur un autre jour ou une autre ville', () => {
        const memory: SentDigsMemory = { town_id: 42, day: 4, values: { '3:-2:1': [4, 6] } };

        expect(mergeWithSentDigs(estimates, memory, 42, 5, 3, -2).values[0]).toEqual({ citizenId: 1, successDigs: 2, totalDigs: 5 });
        expect(mergeWithSentDigs(estimates, { ...memory, day: 5, town_id: 43 }, 42, 5, 3, -2).values[0]).toEqual({ citizenId: 1, successDigs: 2, totalDigs: 5 });
    });

    it('valide la mémoire relue du stockage', () => {
        expect(isSentDigsMemory({ town_id: 42, day: 5, values: { '3:-2:1': [4, 6] } })).toBe(true);
        expect(isSentDigsMemory({ town_id: 42, day: 5, values: {} })).toBe(true);
        expect(isSentDigsMemory(undefined)).toBe(false);
        expect(isSentDigsMemory({ town_id: '42', day: 5, values: {} })).toBe(false);
        expect(isSentDigsMemory({ town_id: 42, day: 5, values: { a: [1] } })).toBe(false);
        expect(isSentDigsMemory({ town_id: 42, day: 5, values: { a: [1, 'x'] } })).toBe(false);
    });
});
