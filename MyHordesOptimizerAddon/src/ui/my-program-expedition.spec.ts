import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { repo_img_hordes_url } from '../config/constants';
import type { ApiExpedition, ApiExpeditionOrder, ApiMapPoint } from '../types';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

vi.mock('./expedition-route', () => ({
    formatCell: (point: { x: number; y: number }): string => `[${point.x} / ${point.y}]`,
    townPosition: (): { x: number; y: number } => ({ x: 10, y: 10 })
}));

type Language = 'de' | 'en' | 'es' | 'fr';

type ProgramExpeditionModule = typeof import('./my-program-expedition');

const town: { x: number; y: number } = { x: 10, y: 10 };
const user_id: number = 7;

/** Nom officiel de l'objet `shoe_#00` (`translations/items+intl-icu.<lang>.yml` du jeu). */
const shoes_names: Record<Language, string> = {
    de: 'Ausgetretene Sportschuhe',
    en: 'Worn-out sports shoes',
    es: 'Zapatillas deportivas desgastadas',
    fr: 'Chaussures de sport usées'
};

/** Charge le module dans la langue donnée (`lang` est lu au chargement du module). */
async function load(language: Language): Promise<ProgramExpeditionModule> {
    document.documentElement.lang = language;
    vi.resetModules();
    return import('./my-program-expedition');
}

/** Expédition où je suis inscrit, avec une partie de libellé `part_label`. */
function expeditionOf(label: string, part_label: string): ApiExpedition {
    return { label, parts: [{ id: 1, label: part_label, citizens: [{ idUser: user_id }], orders: [] }] };
}

describe('createExpeditionTab — en-têtes du tableau', (): void => {
    beforeEach((): void => {
        document.body.innerHTML = '';
    });

    it.each<Language>(['de', 'en', 'es', 'fr'])('%s : la colonne PE porte l\'icône des points d\'effort du jeu, déclinée comme celle des PA', async (language: Language): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load(language);
        const suffix: string = language === 'de' ? '' : `_${language}`;

        const tab: HTMLElement = createExpeditionTab([expeditionOf('E', 'P')], [], user_id, town);

        const headers: HTMLTableCellElement[] = Array.from(tab.querySelectorAll<HTMLTableCellElement>('table.mho-table thead th'));
        expect(headers[3].querySelector('img')?.getAttribute('src')).toBe(`${repo_img_hordes_url}icons/sp_small${suffix}.gif`);
    });

    it.each<Language>(['de', 'en', 'es', 'fr'])('%s : la colonne chaussures porte l\'icône de l\'objet, avec son nom officiel en infobulle', async (language: Language): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load(language);

        const tab: HTMLElement = createExpeditionTab([expeditionOf('E', 'P')], [], user_id, town);

        const headers: HTMLTableCellElement[] = Array.from(tab.querySelectorAll<HTMLTableCellElement>('table.mho-table thead th'));
        const img: HTMLImageElement | null = headers[4].querySelector('img');
        expect(img?.getAttribute('src')).toBe(`${repo_img_hordes_url}item/item_shoe.gif`);
        expect(img?.title).toBe(shoes_names[language]);
        expect(headers[4].textContent).toBe('');
    });

    it('n\'a aucune colonne « Consignes »', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([expeditionOf('E', 'P')], [], user_id, town);

        const headers: string[] = Array.from(tab.querySelectorAll<HTMLElement>('table.mho-table thead th')).map((th: HTMLElement): string => th.textContent ?? '');
        expect(headers).not.toContain('Consignes');
        expect(headers).toHaveLength(6);
    });
});

describe('createExpeditionTab — titre d\'une partie', (): void => {
    it('donne le coût de la partie, détaillé quand une ruine est visitée', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const explore: ApiExpeditionOrder = { type: 'checkbox', text: '', isDone: false, position: 0, kind: 'explore', x: 3, y: 3 };
        const expedition: ApiExpedition = {
            parts: [{
                id: 1,
                orders: [],
                citizens: [{ idUser: user_id, orders: [explore] }],
                mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells: [], length: 10, version: 1 }
            }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        expect(tab.querySelector<HTMLElement>('.mho-expedition-route-name')?.textContent).toContain('Boucle · 11 PA (10 + 1)');
    });

    it('ajoute la flèche de direction après la ligne du tracé', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const expedition: ApiExpedition = {
            parts: [{ id: 1, orders: [], direction: 'Norden', citizens: [{ idUser: user_id }], mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells: [], length: 10, version: 1 } }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        expect(tab.querySelector<HTMLElement>('.mho-expedition-route-name')?.textContent).toMatch(/Boucle.*⇧$/);
    });

    it('sans tracé lié, affiche le texte hérité de `path`', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const expedition: ApiExpedition = { parts: [{ id: 1, orders: [], path: 'Vieux chemin', citizens: [{ idUser: user_id }] }] };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        expect(tab.textContent).toContain('Vieux chemin');
    });
});

describe('createExpeditionTab — ordre des consignes', (): void => {
    it('affiche les consignes de la partie dans l\'ordre du tracé, passage compris', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const at = (text: string, x: number, y: number, passage?: number): ApiExpeditionOrder => ({ type: 'text', text, isDone: false, position: 0, x: 10 + x, y: 10 - y, kind: null, passage });
        const cells: ApiMapPoint[] = [[0, 0], [0, 1], [0, 2], [0, 1], [0, 0]].map(([x, y]: number[]) => ({ x: 10 + x, y: 10 - y }));
        const expedition: ApiExpedition = {
            parts: [{
                id: 1,
                citizens: [{ idUser: user_id }],
                orders: [at('retour', 0, 1, 2), at('aller', 0, 1, 1)],
                mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells, length: 4, version: 1 }
            }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        const texts: string[] = Array.from(tab.querySelectorAll<HTMLElement>('.mho-order')).map((element: HTMLElement): string => element.textContent ?? '');
        expect(texts.findIndex((text: string): boolean => text.includes('aller'))).toBeLessThan(texts.findIndex((text: string): boolean => text.includes('retour')));
    });

    it('affiche les consignes case par case dans l\'ordre du tracé', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const at = (text: string, x: number, y: number): ApiExpeditionOrder => ({ type: 'text', text, isDone: false, position: 0, x: 10 + x, y: 10 - y, kind: null });
        const cells: ApiMapPoint[] = [[0, 0], [0, 1], [0, 2]].map(([x, y]: number[]) => ({ x: 10 + x, y: 10 - y }));
        const expedition: ApiExpedition = {
            parts: [{
                id: 1,
                citizens: [{ idUser: user_id }],
                orders: [at('loin', 0, 2), at('près', 0, 1)],
                mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells, length: 4, version: 1 }
            }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        const labels: string[] = Array.from(tab.querySelectorAll<HTMLElement>('.mho-program-expedition-cell')).map((element: HTMLElement): string => element.textContent ?? '');
        expect(labels).toEqual(['[0 / 1] · 1PA', '[0 / 2] · 2PA']);
    });

    it('chaque consigne, de la partie comme des citoyens, n\'apparaît qu\'une fois', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const at = (text: string, x: number | null, y: number | null): ApiExpeditionOrder => ({ type: 'text', text, isDone: false, position: 0, x: x === null ? null : 10 + x, y: y === null ? null : 10 - y, kind: null });
        const cells: ApiMapPoint[] = [[0, 0], [0, 1], [0, 2]].map(([x, y]: number[]) => ({ x: 10 + x, y: 10 - y }));
        const expedition: ApiExpedition = {
            parts: [{
                id: 1,
                citizens: [{ idUser: user_id, orders: [at('mienne', 0, 2)] }, { idUser: 8, orders: [at('autre', 0, 1)] }],
                orders: [at('partie-case', 0, 1), at('partie-generale', null, null)],
                mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells, length: 2, version: 1 }
            }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        const texts: string[] = Array.from(tab.querySelectorAll<HTMLElement>('.mho-order')).map((element: HTMLElement): string => element.textContent ?? '');
        ['mienne', 'autre', 'partie-case', 'partie-generale'].forEach((text: string): void => {
            expect(texts.filter((order_text: string): boolean => order_text.includes(text)), text).toHaveLength(1);
        });
    });
});

describe('createExpeditionTab — PA des cases', (): void => {
    it('case du tracé traversée une fois : PA depuis la ville ; case retraversée, hors tracé ou sans case : aucun', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const at = (text: string, x: number | null, y: number | null, passage?: number): ApiExpeditionOrder => ({ type: 'text', text, isDone: false, position: 0, x: x === null ? null : 10 + x, y: y === null ? null : 10 - y, kind: null, passage });
        const cells: ApiMapPoint[] = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [1, 2], [0, 2]].map(([x, y]: number[]) => ({ x: 10 + x, y: 10 - y }));
        const expedition: ApiExpedition = {
            parts: [{
                id: 1,
                citizens: [{ idUser: user_id }],
                orders: [at('une fois', 0, 3), at('retour', 0, 2, 2), at('hors tracé', 5, 5), at('générale', null, null)],
                mapRoute: { id: 5, label: 'Boucle', color: 'teal', cells, length: 6, version: 1 }
            }]
        };

        const tab: HTMLElement = createExpeditionTab([expedition], [], user_id, town);

        const labels: string[] = Array.from(tab.querySelectorAll<HTMLElement>('.mho-program-expedition-cell')).map((element: HTMLElement): string => element.textContent ?? '');
        expect(labels).toEqual(['[0 / 2]', '[0 / 3] · 3PA', '[5 / 5]', 'Sans case']);
    });
});

describe('createExpeditionTab — choix de l\'expédition', (): void => {
    it('une seule expédition : pas de liste', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([expeditionOf('A', 'Partie A')], [], user_id, town);

        expect(tab.querySelector('select.mho-program-expedition-choice')).toBeNull();
    });

    it('deux expéditions : la liste les propose et change le contenu', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([expeditionOf('A', 'Partie A'), { ...expeditionOf('', 'Partie B') }], [], user_id, town);

        const select: HTMLSelectElement | null = tab.querySelector<HTMLSelectElement>('select.mho-program-expedition-choice');
        expect(select?.options).toHaveLength(2);
        expect(select?.options[0].text).toBe('A');
        expect(select?.options[1].text).toBe('Mon expédition');
        expect(tab.querySelector('h2')?.textContent).toBe('Partie A');
        select.value = '1';
        select.dispatchEvent(new Event('change'));
        expect(tab.querySelector('h2')?.textContent).toBe('Partie B');
    });

    it('l\'expédition initiale est choisie si elle est encore dans la liste', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([{ ...expeditionOf('A', 'Partie A'), id: 1 }, { ...expeditionOf('B', 'Partie B'), id: 2 }], [], user_id, town, 2);

        expect(tab.querySelector<HTMLSelectElement>('select.mho-program-expedition-choice')?.value).toBe('1');
        expect(tab.querySelector('h2')?.textContent).toBe('Partie B');
    });

    it('une expédition initiale absente de la liste ouvre la première', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([{ ...expeditionOf('A', 'Partie A'), id: 1 }, { ...expeditionOf('B', 'Partie B'), id: 2 }], [], user_id, town, 99);

        expect(tab.querySelector<HTMLSelectElement>('select.mho-program-expedition-choice')?.value).toBe('0');
        expect(tab.querySelector('h2')?.textContent).toBe('Partie A');
    });

    it('changer d\'expédition appelle le rappel avec son id', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');
        const on_change: Mock = vi.fn();
        const tab: HTMLElement = createExpeditionTab([{ ...expeditionOf('A', 'Partie A'), id: 1 }, { ...expeditionOf('B', 'Partie B'), id: 2 }], [], user_id, town, null, on_change);

        const select: HTMLSelectElement = tab.querySelector<HTMLSelectElement>('select.mho-program-expedition-choice') as HTMLSelectElement;
        select.value = '1';
        select.dispatchEvent(new Event('change'));

        expect(on_change).toHaveBeenCalledWith(2);
    });
});

describe('createExpeditionTab — aucune expédition', (): void => {
    it('affiche le message d\'absence d\'inscription', async (): Promise<void> => {
        const { createExpeditionTab }: ProgramExpeditionModule = await load('fr');

        const tab: HTMLElement = createExpeditionTab([], [], user_id, town);

        expect(tab.textContent).toBe('Vous n\'êtes inscrit sur aucune expédition aujourd\'hui.');
    });
});
