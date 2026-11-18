import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CitizenHomeRow, HomeColumnBlock, HomeUpdate } from '../utils/citizen-homes';
import { buildHomesTable, enabledCitizenTabs, graftHomesTab } from './citizen-homes-tab';

const NOW: Date = new Date('2026-11-17T12:00:00Z');
const BOTH: HomeColumnBlock[] = ['home', 'heroic'];

/** Mise à jour datée. */
function upd(iso: string): HomeUpdate {
    return { userName: 'Zerah', updateTime: new Date(iso) };
}

/** Ligne de test. */
function row(id: number, name: string, houseLevel: number | null, update: HomeUpdate | null): CitizenHomeRow {
    return { id, name, home: { houseLevel, hasAlarm: true, hasLock: false }, heroic: { hasRescue: true }, homeUpdate: update, heroicUpdate: null };
}

const ROWS: CitizenHomeRow[] = [
    row(1, 'Bob', 2, upd('2026-11-16T12:00:00Z')),
    row(2, 'Élodie', 4, upd('2026-11-11T12:00:00Z')),
    row(3, 'Zoe', null, null),
];

/** Lignes de citoyens, dans l'ordre affiché. */
function lines(root: Element): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('.row-table > .row-flex:not(.header)'));
}

/** Noms des lignes visibles, dans l'ordre. */
function names(root: Element): string[] {
    return lines(root)
        .filter((line: HTMLElement): boolean => !line.classList.contains('mho-hidden'))
        .map((line: HTMLElement): string => line.querySelector('.cell')?.textContent ?? '');
}

/** En-tête de la colonne de cette clé. */
function header(root: Element, key: string): HTMLElement {
    return root.querySelector(`.row-flex.header > .cell[data-key="${key}"]`) as HTMLElement;
}

/** Cellule d'une ligne pour la clé de colonne donnée. */
function cell(root: Element, index: number, key: string): HTMLElement {
    const headers: Element[] = Array.from(root.querySelectorAll('.row-flex.header > .cell'));
    return lines(root)[index].children[headers.indexOf(header(root, key))] as HTMLElement;
}

/** jsdom ne fournit pas `ResizeObserver`, utilisé par les volets à cases à cocher. */
class FakeResizeObserver {
    /** Ne fait rien. */
    public observe(): void { /* jsdom : pas de mise en page */ }
    /** Ne fait rien. */
    public disconnect(): void { /* jsdom : pas de mise en page */ }
}

beforeEach((): void => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach((): void => {
    vi.unstubAllGlobals();
});

describe('buildHomesTable', () => {
    it('reprend la structure de la liste des citoyens du jeu', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        expect(root.id).toBe('mho-citizen-homes');
        expect(root.querySelector('.row-table > .row-flex.header')).not.toBeNull();
        expect(lines(root).length).toBe(3);
    });

    it('ne montre que les colonnes de son bloc, avec l\'icône du jeu en en-tête', () => {
        const homes: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        const heroics: HTMLElement = buildHomesTable(ROWS, NOW, 'heroic');
        expect(header(homes, 'hasRescue')).toBeNull();
        expect(header(heroics, 'houseLevel')).toBeNull();
        expect(heroics.id).toBe('mho-citizen-heroics');
        const img: HTMLImageElement = header(homes, 'hasAlarm').querySelector('img') as HTMLImageElement;
        expect(img.src).toContain('hordes_img/home/alarm.gif');
        expect(header(homes, 'hasAlarm').title).toMatch(/Alarm/);
    });

    it('reprend les bordures du jeu et le fond de la cellule du nom, violet pour soi', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home', 2);
        expect(cell(root, 0, 'hasAlarm').classList.contains('citizen-box')).toBe(true);
        expect(cell(root, 0, 'homeUpdate').classList.contains('citizen-box')).toBe(true);
        expect(cell(root, 0, 'name').classList.contains('citizen-box-name')).toBe(true);
        expect(cell(root, 1, 'name').classList.contains('citizen-box-name-me')).toBe(true);
        expect(cell(root, 1, 'name').classList.contains('citizen-box-name')).toBe(false);
        for (const key of ['name', 'houseLevel', 'hasAlarm', 'homeUpdate']) {
            expect(cell(root, 0, key).classList.contains('content-center-vertical')).toBe(true);
        }
    });

    it('affiche le niveau, les coches du jeu et un tiret si inconnu', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        expect(cell(root, 0, 'houseLevel').textContent).toBe('');
        expect(cell(root, 0, 'houseLevel').querySelector('img')?.alt).toBe('2');
        expect(cell(root, 0, 'kitchenLevel').textContent).toBe('—');
        expect(cell(root, 0, 'houseLevel').querySelector('img')?.getAttribute('src')).toContain('home/home_lv2.gif');
        expect(cell(root, 0, 'hasAlarm').querySelector('img')?.getAttribute('src')).toContain('icons/tickOn.gif');
        expect(cell(root, 0, 'hasLock').querySelector('img')?.getAttribute('src')).toContain('icons/tickOff.gif');
        expect(cell(root, 0, 'hasFence').textContent).toBe('—');
        expect(cell(root, 2, 'houseLevel').classList.contains('mho-homes-empty')).toBe(true);
    });

    it('date la mise à jour de son bloc et signale les données périmées', () => {
        const homes: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        expect(cell(homes, 0, 'houseLevel').title).toContain('Zerah');
        expect(cell(homes, 1, 'homeUpdate').classList.contains('mho-homes-stale')).toBe(true);
        expect(cell(homes, 0, 'homeUpdate').classList.contains('mho-homes-stale')).toBe(false);
        expect(cell(homes, 0, 'homeUpdate').textContent).toMatch(/il y a|ago/);
        const heroics: HTMLElement = buildHomesTable(ROWS, NOW, 'heroic');
        expect(cell(heroics, 0, 'heroicUpdate').title).toMatch(/jamais|never/);
    });

    it('trie au clic puis inverse, vides en bas', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        header(root, 'houseLevel').click();
        expect(names(root)).toEqual(['Bob', 'Élodie', 'Zoe']);
        header(root, 'houseLevel').click();
        expect(names(root)).toEqual(['Élodie', 'Bob', 'Zoe']);
    });

    it('filtre par nom', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        const input: HTMLInputElement = root.querySelector('.mho-filter-bar .mho-search-input') as HTMLInputElement;
        expect(root.querySelector('.mho-filter-bar .mho-search-icon')).not.toBeNull();
        input.value = 'elodie';
        input.dispatchEvent(new Event('input'));
        expect(names(root)).toEqual(['Élodie']);
    });

    it('libelle chaque filtre par l’icône de sa colonne', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'heroic');
        const label: HTMLElement = (root.querySelector('#mho-citizen-heroics-filter-hasRescue') as HTMLElement).parentElement?.querySelector('.mho-filter-label') as HTMLElement;
        expect(label.textContent).toBe('');
        expect(label.querySelector('img')?.getAttribute('src')).toContain('emotes/gate.gif');
        expect(label.title).toMatch(/Sauvetage|Rescue/);
        const level: HTMLElement = (buildHomesTable(ROWS, NOW, 'home').querySelector('#mho-citizen-homes-filter-houseLevel') as HTMLElement)
            .parentElement?.querySelector('.mho-filter-label') as HTMLElement;
        expect(level.querySelector('img')?.getAttribute('src')).toContain('home/home_lv1.gif');
    });

    it('filtre un oui/non avec la sélection Tous / Oui / Non', () => {
        const rows: CitizenHomeRow[] = [{ ...ROWS[0], home: { hasAlarm: false } }, ROWS[1], ROWS[2]];
        const root: HTMLElement = buildHomesTable(rows, NOW, 'home');
        const select: HTMLSelectElement = root.querySelector('#mho-citizen-homes-filter-hasAlarm') as HTMLSelectElement;
        select.value = 'no';
        select.dispatchEvent(new Event('change'));
        expect(names(root)).toEqual(['Bob']);
    });

    it('filtre un niveau avec les cases des niveaux présents', () => {
        const root: HTMLElement = buildHomesTable(ROWS, NOW, 'home');
        expect(root.querySelector('#mho-citizen-homes-filter-houseLevel-opt-3')).toBeNull();
        const box: HTMLInputElement = root.querySelector('#mho-citizen-homes-filter-houseLevel-opt-4') as HTMLInputElement;
        box.checked = true;
        box.dispatchEvent(new Event('change'));
        expect(names(root)).toEqual(['Élodie']);
    });
});

describe('graftHomesTab', () => {
    let main: HTMLElement;

    beforeEach((): void => {
        document.body.innerHTML = '<div class="town-main-content"><div class="row town-banner"></div><ul class="tabs plain"><li class="tab selected"><div class="tab-link">Liste</div></li></ul><div class="note warning">Ghoul</div><div id="mho-filter-citizen-list"></div><div class="row-table citizens-list"><div class="row-flex"><div class="userCell citizen-box"><div><div><img src="/build/images/professions/tamer.gif"><a class="username" x-user-id="1">Bob</a></div><div><span class="cite">Annonce</span></div></div></div></div></div></div>';
        main = document.querySelector('.town-main-content') as HTMLElement;
    });

    it('ajoute les onglets Maisons et Actions héroïques une seule fois', () => {
        graftHomesTab(main, ROWS, NOW, BOTH);
        graftHomesTab(main, ROWS, NOW, BOTH);
        expect(document.querySelectorAll('#mho-citizen-homes-tab').length).toBe(1);
        expect(document.querySelectorAll('#mho-citizen-heroics-tab').length).toBe(1);
        expect(document.querySelectorAll('#mho-citizen-homes').length).toBe(1);
        expect(document.querySelectorAll('#mho-citizen-heroics').length).toBe(1);
        expect(document.querySelector('#mho-citizen-homes-tab .tab-link img')).not.toBeNull();
        expect(document.querySelector('#mho-citizen-heroics-tab .tab-link img')).not.toBeNull();
    });

    it('déplace le bloc citoyen du jeu dans l’onglet affiché, le texte seul à défaut', () => {
        graftHomesTab(main, ROWS, NOW, BOTH);
        const username: Element = document.querySelector('.username[x-user-id="1"]') as Element;
        (document.querySelector('#mho-citizen-homes-tab') as HTMLElement).click();
        expect(document.querySelector('#mho-citizen-homes .username[x-user-id="1"]')).toBe(username);
        // `update.ts` lit le métier deux niveaux au-dessus de chaque `.citizen-box .username`.
        expect(document.querySelectorAll('.citizen-box .username[x-user-id="1"]').length).toBe(1);
        expect(username.parentElement?.parentElement?.querySelector('img[src*=professions]')).not.toBeNull();
        expect(document.querySelector('#mho-citizen-homes .cite')).toBeNull();
        (document.querySelector('#mho-citizen-heroics-tab') as HTMLElement).click();
        expect(document.querySelector('#mho-citizen-heroics .username[x-user-id="1"]')).toBe(username);
        expect(document.querySelector('#mho-citizen-homes .username')).toBeNull();
        expect(names(document.querySelector('#mho-citizen-homes') as Element)).toEqual(['Bob', 'Élodie', 'Zoe']);
    });

    it('n’ajoute que les onglets demandés', () => {
        graftHomesTab(main, ROWS, NOW, ['heroic']);
        expect(document.querySelector('#mho-citizen-homes-tab')).toBeNull();
        expect(document.querySelector('#mho-citizen-homes')).toBeNull();
        expect(document.querySelector('#mho-citizen-heroics-tab')).not.toBeNull();
        graftHomesTab(main, ROWS, NOW, ['heroic']);
        expect(document.querySelectorAll('#mho-citizen-heroics-tab').length).toBe(1);
    });

    it('au clic, masque la liste native et l\'autre onglet', () => {
        graftHomesTab(main, ROWS, NOW, BOTH);
        (document.querySelector('#mho-citizen-homes-tab') as HTMLElement).click();
        expect(document.querySelector('.citizens-list')?.classList.contains('mho-hidden')).toBe(true);
        expect(document.querySelector('.note.warning')?.classList.contains('mho-hidden')).toBe(true);
        expect(document.querySelector('#mho-filter-citizen-list')?.classList.contains('mho-hidden')).toBe(true);
        expect(document.querySelector('ul.tabs')?.classList.contains('mho-hidden')).toBe(false);
        expect(document.querySelector('.town-banner')?.classList.contains('mho-hidden')).toBe(false);
        expect(document.querySelector('#mho-citizen-homes')?.classList.contains('mho-hidden')).toBe(false);
        expect(document.querySelector('.tab:not([id])')?.classList.contains('selected')).toBe(false);

        (document.querySelector('#mho-citizen-heroics-tab') as HTMLElement).click();
        expect(document.querySelector('#mho-citizen-homes')?.classList.contains('mho-hidden')).toBe(true);
        expect(document.querySelector('#mho-citizen-heroics')?.classList.contains('mho-hidden')).toBe(false);
        expect(document.querySelector('#mho-citizen-homes-tab')?.classList.contains('selected')).toBe(false);
        expect(document.querySelector('#mho-citizen-heroics-tab')?.classList.contains('selected')).toBe(true);
    });
});

describe('enabledCitizenTabs', () => {
    it('suit l’option parente puis chaque sous-option', () => {
        expect(enabledCitizenTabs({ citizen_tabs: true, citizen_tab_homes: true, citizen_tab_heroics: true })).toEqual(['home', 'heroic']);
        expect(enabledCitizenTabs({ citizen_tabs: true, citizen_tab_heroics: true })).toEqual(['heroic']);
        expect(enabledCitizenTabs({ citizen_tabs: false, citizen_tab_homes: true, citizen_tab_heroics: true })).toEqual([]);
    });
});
