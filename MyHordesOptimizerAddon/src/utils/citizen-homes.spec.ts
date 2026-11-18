import { describe, expect, it } from 'vitest';

import type { CitizenHomeRow, HomeColumn, HomeUpdate } from './citizen-homes';
import { filterHomeRows, HOME_COLUMNS, homeCellText, isStale, passesHomeFilter, readCitizenHomeRows, relativeUpdate, sortHomeRows, } from './citizen-homes';

const LEVEL: HomeColumn = HOME_COLUMNS.find((c: HomeColumn): boolean => c.key === 'houseLevel') as HomeColumn;
const FLAG: HomeColumn = HOME_COLUMNS.find((c: HomeColumn): boolean => c.key === 'hasRescue') as HomeColumn;

function row(id: number, name: string, houseLevel: number | null, update: HomeUpdate | null = null): CitizenHomeRow {
    return { id, name, home: { houseLevel }, heroic: {}, homeUpdate: update, heroicUpdate: null };
}

function upd(iso: string): HomeUpdate {
    return { userName: 'Zerah', updateTime: new Date(iso) };
}

describe('readCitizenHomeRows', () => {
    it('lit un citoyen complet', () => {
        const rows: CitizenHomeRow[] = readCitizenHomeRows({
            citizens: [{
                id: 1, name: 'Zerah',
                home: { content: { houseLevel: 4, hasAlarm: 'x' }, lastUpdateInfo: { userName: 'Zerah', updateTime: '2026-11-15T10:00:00Z' } },
                actionsHeroic: { content: { hasRescue: true, apagCharges: 2 } },
            }],
        });
        expect(rows.length).toBe(1);
        expect(rows[0].home['houseLevel']).toBe(4);
        expect(rows[0].home['hasAlarm']).toBeNull();
        expect(rows[0].heroic['hasRescue']).toBe(true);
        expect(rows[0].heroic['apagCharges']).toBe(2);
        expect(rows[0].homeUpdate).toEqual({ userName: 'Zerah', updateTime: new Date('2026-11-15T10:00:00Z') });
        expect(rows[0].heroicUpdate).toBeNull();
    });

    it('lit -1 comme inconnu', () => {
        const rows: CitizenHomeRow[] = readCitizenHomeRows({ citizens: [{ id: 3, name: 'B', home: { content: { laboLevel: -1, kitchenLevel: 0 } } }] });
        expect(rows[0].home['laboLevel']).toBeNull();
        expect(rows[0].home['kitchenLevel']).toBe(0);
    });

    it('accepte une entrée sans blocs', () => {
        const rows: CitizenHomeRow[] = readCitizenHomeRows({ citizens: [{ id: 2, name: 'A' }] });
        expect(rows).toEqual([{ id: 2, name: 'A', home: {}, heroic: {}, homeUpdate: null, heroicUpdate: null }]);
    });

    it('rejette les dates invalides ou absentes', () => {
        const rows: CitizenHomeRow[] = readCitizenHomeRows({
            citizens: [{
                id: 3, name: 'B',
                home: { lastUpdateInfo: { userName: 'u', updateTime: 'pas une date' } },
                actionsHeroic: { lastUpdateInfo: { userName: 'u' } },
            }],
        });
        expect(rows[0].homeUpdate).toBeNull();
        expect(rows[0].heroicUpdate).toBeNull();
    });

    it('exclut morts et entrées sans id, et gère un corps invalide', () => {
        expect(readCitizenHomeRows({ citizens: [{ id: 1, name: 'M', dead: true }, { name: 'X' }, { id: 4, name: 'V', dead: false }] }).map((r: CitizenHomeRow): number => r.id)).toEqual([4]);
        expect(readCitizenHomeRows('nope')).toEqual([]);
        expect(readCitizenHomeRows(null)).toEqual([]);
    });
});

describe('homeCellText', () => {
    it('formate niveaux, flags et vides', () => {
        expect(homeCellText(LEVEL, 3)).toEqual({ text: '3', empty: false });
        expect(homeCellText(FLAG, true)).toEqual({ text: '✓', empty: false });
        expect(homeCellText(FLAG, false)).toEqual({ text: '✗', empty: false });
        expect(homeCellText(FLAG, null)).toEqual({ text: '—', empty: true });
        expect(homeCellText(LEVEL, undefined)).toEqual({ text: '—', empty: true });
    });
});

describe('HOME_COLUMNS', () => {
    it('porte l\'icône du jeu de chaque colonne', () => {
        const icon: (key: string) => string | undefined = (key: string): string | undefined => HOME_COLUMNS.find((c: HomeColumn): boolean => c.key === key)?.icon;
        expect(icon('renfortLevel')).toBe('home/defense.gif');
        expect(icon('laboLevel')).toBe('home/lab.gif');
        expect(icon('hasBreakThrough')).toBe('icons/small_arma.gif');
        expect(icon('apagCharges')).toBe('heroskill/f_cam.gif');
    });
});

describe('relativeUpdate', () => {
    const now: Date = new Date('2026-11-17T12:00:00Z');
    /** Intl sépare par des espaces insécables. */
    const spaced: (text: string) => string = (text: string): string => text.replace(/\s/g, ' ');

    it('choisit la plus grande unité qui convient', () => {
        expect(spaced(relativeUpdate(new Date('2026-11-17T11:30:00Z'), now, 'fr'))).toBe('il y a 30 min');
        expect(spaced(relativeUpdate(new Date('2026-11-17T07:00:00Z'), now, 'fr'))).toBe('il y a 5 h');
        expect(spaced(relativeUpdate(new Date('2026-11-14T12:00:00Z'), now, 'fr'))).toBe('il y a 3 j');
        expect(spaced(relativeUpdate(new Date('2026-11-14T12:00:00Z'), now, 'en'))).toBe('3 days ago');
    });

    it('ne descend pas sous la minute', () => {
        expect(spaced(relativeUpdate(new Date('2026-11-17T11:59:50Z'), now, 'fr'))).toBe('il y a 0 min');
    });
});

describe('isStale', () => {
    it('détecte les données périmées', () => {
        const now: Date = new Date('2026-11-17T00:00:00Z');
        expect(isStale(upd('2026-11-11T00:00:00Z'), now)).toBe(true);
        expect(isStale(upd('2026-11-13T00:00:00Z'), now)).toBe(false);
        expect(isStale(null, now)).toBe(false);
    });
});

describe('sortHomeRows / filterHomeRows', () => {
    const rows: CitizenHomeRow[] = [row(1, 'B', 2), row(2, 'C', null), row(3, 'A', 4)];

    it('trie par niveau, vides en dernier dans les deux sens', () => {
        expect(sortHomeRows(rows, 'houseLevel', 'asc').map((r: CitizenHomeRow): number => r.id)).toEqual([1, 3, 2]);
        expect(sortHomeRows(rows, 'houseLevel', 'desc').map((r: CitizenHomeRow): number => r.id)).toEqual([3, 1, 2]);
    });

    it('trie par nom sans accent et par mise à jour', () => {
        const names: CitizenHomeRow[] = [row(1, 'Zoe', 1), row(2, 'Élodie', 1), row(3, 'Eve', 1)];
        expect(sortHomeRows(names, 'name', 'asc').map((r: CitizenHomeRow): string => r.name)).toEqual(['Élodie', 'Eve', 'Zoe']);
        const dated: CitizenHomeRow[] = [row(1, 'a', 1, upd('2026-11-12T00:00:00Z')), row(2, 'b', 1), row(3, 'c', 1, upd('2026-11-10T00:00:00Z'))];
        expect(sortHomeRows(dated, 'homeUpdate', 'asc').map((r: CitizenHomeRow): number => r.id)).toEqual([3, 1, 2]);
        expect(sortHomeRows(dated, 'homeUpdate', 'desc').map((r: CitizenHomeRow): number => r.id)).toEqual([1, 3, 2]);
        expect(sortHomeRows(dated, 'heroicUpdate', 'asc').map((r: CitizenHomeRow): number => r.id)).toEqual([1, 2, 3]);
    });

    it('trie les booléens true avant false', () => {
        const flags: CitizenHomeRow[] = [
            { ...row(1, 'a', 1), heroic: { hasRescue: false } },
            { ...row(2, 'b', 1), heroic: { hasRescue: true } },
        ];
        expect(sortHomeRows(flags, 'hasRescue', 'asc').map((r: CitizenHomeRow): number => r.id)).toEqual([2, 1]);
    });

    it('filtre sans accent', () => {
        expect(filterHomeRows([row(1, 'Élodie', 1), row(2, 'Bob', 1)], 'elodie').map((r: CitizenHomeRow): number => r.id)).toEqual([1]);
    });
});

describe('passesHomeFilter', () => {
    const ALARM: HomeColumn = HOME_COLUMNS.find((c: HomeColumn): boolean => c.key === 'hasAlarm') as HomeColumn;

    it('oui/non : tout passe sans choix, sinon la valeur doit correspondre et l\'inconnu est exclu', () => {
        expect(passesHomeFilter(ALARM, null, 'all')).toBe(true);
        expect(passesHomeFilter(ALARM, true, 'yes')).toBe(true);
        expect(passesHomeFilter(ALARM, false, 'yes')).toBe(false);
        expect(passesHomeFilter(ALARM, false, 'no')).toBe(true);
        expect(passesHomeFilter(ALARM, null, 'no')).toBe(false);
    });

    it('niveaux : tout passe sans choix, sinon le niveau doit être coché', () => {
        expect(passesHomeFilter(LEVEL, null, [])).toBe(true);
        expect(passesHomeFilter(LEVEL, 2, ['2', '3'])).toBe(true);
        expect(passesHomeFilter(LEVEL, 1, ['2', '3'])).toBe(false);
        expect(passesHomeFilter(LEVEL, null, ['2'])).toBe(false);
    });
});
