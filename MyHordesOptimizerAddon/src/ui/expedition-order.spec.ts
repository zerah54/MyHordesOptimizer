import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { repo_img_hordes_url } from '../config/constants';
import { state } from '../state';
import type { ApiExpeditionOrder, MhoItem } from '../types';
import { createOrderElement, describeOrder } from './expedition-order';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

/** Langue de la page en jsdom : `lang` vaut `en` (navigator.language) */
const PLANK: MhoItem = { id: 3, img: 'item/item_wood_bad.gif', label: { fr: 'Planche tordue', en: 'Twisted Plank', de: 'Verbogenes Brett', es: 'Tabla torcida' } };

function order(overrides: Partial<ApiExpeditionOrder>): ApiExpeditionOrder {
    return { type: 'checkbox', text: '', isDone: false, position: 0, kind: null, ...overrides };
}

describe('describeOrder', (): void => {
    beforeEach((): void => {
        state.items = [PLANK];
    });

    afterEach((): void => {
        state.items = undefined;
    });

    it('Ramasser : quantité, objet localisé et son image', (): void => {
        expect(describeOrder(order({ kind: 'pick', itemId: 3, quantity: 2 }))).toEqual({
            verb: 'Pick up', rest: '×2 Twisted Plank', img: repo_img_hordes_url + PLANK.img, glyph: '✋', note: null
        });
    });

    it('Action héroïque : libellé du jeu et image de l\'action', (): void => {
        expect(describeOrder(order({ kind: 'hero', heroSkill: 'secondwind' }))).toMatchObject({ rest: 'Second wind', img: repo_img_hordes_url + 'heroskill/small_pa.gif' });
    });

    it('Attendre : le groupe, ou le citoyen nommé', (): void => {
        expect(describeOrder(order({ kind: 'wait' }))?.rest).toBe('the group');
        expect(describeOrder(order({ kind: 'wait', targetUserId: 9 }), new Map<number, string>([[9, 'Zerah']]))?.rest).toBe('Zerah');
    });

    it('Attendre une autre expédition : son nom, sinon « une autre expédition »', (): void => {
        expect(describeOrder(order({ kind: 'wait', targetExpeditionId: 4, targetExpeditionLabel: 'Expé Z' }))?.rest).toBe('Expé Z');
        expect(describeOrder(order({ kind: 'wait', targetExpeditionId: 4, targetExpeditionLabel: null }))?.rest).toBe('another expedition');
    });

    it('note d\'une consigne typée, sans espaces autour ; aucune si vide', (): void => {
        expect(describeOrder(order({ kind: 'explore', note: '  wait for X  ' }))?.note).toBe('wait for X');
        expect(describeOrder(order({ kind: 'explore', note: ' ' }))?.note).toBeNull();
    });

    it('Déblayer : nombre de tas, pictogramme', (): void => {
        expect(describeOrder(order({ kind: 'clear', quantity: 3 }))).toMatchObject({ rest: '3 pile(s)', img: null, glyph: '⛏️' });
    });

    it('Excaver : sans paramètre, image du fouineur', (): void => {
        expect(describeOrder(order({ kind: 'excavate' }))).toEqual({
            verb: 'Excavate the zone', rest: '', img: repo_img_hordes_url + 'professions/dig.gif', glyph: '🕳️', note: null
        });
    });

    it('texte libre ou type inconnu : rien à décrire', (): void => {
        expect(describeOrder(order({ text: '<p>Libre</p>' }))).toBeNull();
        expect(describeOrder(order({ kind: 'dance' as never }))).toBeNull();
    });
});

describe('createOrderElement', (): void => {
    it('consigne typée cochée : case cochée, barrée, verbe en gras, case et destinataire', (): void => {
        const element: HTMLDivElement = createOrderElement(order({ kind: 'camp', isDone: true }), { cell_label: '[1 / 2]', owner_label: '— Zerah' });
        expect(element.classList).toContain('mho-order-done');
        expect(element.querySelector('.mho-order-mark')?.textContent).toBe('☑');
        expect(element.querySelector('.mho-order-cell')?.textContent).toBe('[1 / 2]');
        expect(element.querySelector('strong')?.textContent).toBe('Camp');
        expect(element.querySelector('.mho-order-owner')?.textContent).toBe('— Zerah');
    });

    it('note d\'une consigne typée : après un tiret, en italique et en texte brut', (): void => {
        const element: HTMLDivElement = createOrderElement(order({ kind: 'camp', note: 'with <b>X</b>' }));
        expect(element.querySelector('.mho-order-content')?.textContent).toBe('⛺Camp — with <b>X</b>');
        expect(element.querySelector('em.mho-order-note')?.textContent).toBe('with <b>X</b>');
        expect(element.querySelector('em.mho-order-note b')).toBeNull();
    });

    it('information en texte libre : puce et texte mis en forme, sans script', (): void => {
        const element: HTMLDivElement = createOrderElement(order({ type: 'text', text: '<p>Passer <b>vite</b><script>alert(1)</script></p>' }));
        expect(element.querySelector('.mho-order-mark')?.textContent).toBe('•');
        expect(element.querySelector('.mho-order-text')?.innerHTML).toBe('<p>Passer <b>vite</b></p>');
    });
});
