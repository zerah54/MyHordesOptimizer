import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import { areTownKeysMigrated, getViewTownKey, isImportedTownPage } from './town-page-key';

const imported_url: string = 'https://myhordes.eu/jx/soul/me/town/129/soul_me';

function createViewTown(imported: boolean, data_town_id?: string): HTMLElement {
    const view_town: HTMLElement = document.createElement('div');
    view_town.classList.add('view-town');
    if (data_town_id !== undefined) view_town.setAttribute('data-town-id', data_town_id);
    if (imported) view_town.innerHTML = '<div class="green-note"><img src="/build/images/badges/twinoid.png"></div>';
    return view_town;
}

describe('getViewTownKey', () => {
    it('ville importée, clés non migrées : renvoie null', () => {
        expect(getViewTownKey(createViewTown(true, '5'), imported_url, false)).toBeNull();
    });

    it('ville importée : renvoie -idtown lu dans l\'URL', () => {
        expect(getViewTownKey(createViewTown(true, '5'), imported_url, true)).toBe(-129);
    });

    it('ville importée, URL de joueur tiers et sans chemin de retour', () => {
        expect(getViewTownKey(createViewTown(true), 'https://myhordes.eu/jx/soul/42/town/129', true)).toBe(-129);
    });

    it('ville importée, URL sans id : renvoie null, jamais data-town-id', () => {
        expect(getViewTownKey(createViewTown(true, '5'), 'https://myhordes.eu/jx/town/home', true)).toBeNull();
    });

    it('autre ville : renvoie data-town-id', () => {
        expect(getViewTownKey(createViewTown(false, '5'), imported_url, false)).toBe(5);
    });

    it('autre ville sans data-town-id : renvoie null', () => {
        expect(getViewTownKey(createViewTown(false), imported_url, true)).toBeNull();
    });

    it('la clé reste celle du premier passage sur cet élément', () => {
        const view_town: HTMLElement = createViewTown(true);
        expect(getViewTownKey(view_town, imported_url, true)).toBe(-129);
        expect(getViewTownKey(view_town, 'https://myhordes.eu/jx/soul/me/town/777/soul_me', true)).toBe(-129);
    });

    it('un null n\'est pas mémorisé : l\'appel suivant recalcule', () => {
        const view_town: HTMLElement = createViewTown(true);
        expect(getViewTownKey(view_town, imported_url, false)).toBeNull();
        expect(getViewTownKey(view_town, imported_url, true)).toBe(-129);
    });

    it('marqueur absent prime sur une clé déjà mémorisée', () => {
        const view_town: HTMLElement = createViewTown(true, '5');
        expect(getViewTownKey(view_town, imported_url, true)).toBe(-129);
        view_town.querySelector('.green-note')?.remove();
        expect(getViewTownKey(view_town, imported_url, true)).toBe(5);
    });

    it('clés non migrées prime sur une clé déjà mémorisée', () => {
        const view_town: HTMLElement = createViewTown(true);
        expect(getViewTownKey(view_town, imported_url, true)).toBe(-129);
        expect(getViewTownKey(view_town, imported_url, false)).toBeNull();
    });
});

describe('isImportedTownPage', () => {
    it('vrai avec le bandeau Twinoid, faux sans', () => {
        expect(isImportedTownPage(createViewTown(true))).toBe(true);
        expect(isImportedTownPage(createViewTown(false))).toBe(false);
    });
});

describe('areTownKeysMigrated', () => {
    beforeEach(() => {
        state.parameters = undefined;
    });

    afterEach(() => {
        state.parameters = undefined;
    });

    it('faux si les paramètres ne sont pas chargés ou si TownKeysMigrated est absent', () => {
        expect(areTownKeysMigrated()).toBe(false);
        state.parameters = [{ name: 'ScriptVersion', value: '2.0.0' }];
        expect(areTownKeysMigrated()).toBe(false);
    });

    it('vrai si TownKeysMigrated vaut 1, faux sinon', () => {
        state.parameters = [{ name: 'TownKeysMigrated', value: '1' }];
        expect(areTownKeysMigrated()).toBe(true);
        state.parameters = [{ name: 'TownKeysMigrated', value: '0' }];
        expect(areTownKeysMigrated()).toBe(false);
    });
});
