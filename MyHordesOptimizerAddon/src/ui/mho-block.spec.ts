import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mh_optimizer_icon_flat } from '../config/constants';
import { ensureMhoSection, mho_block_id, type MhoSection, removeMhoSection } from './mho-block';

let script_info: { name: string; version?: string } | undefined = { name: 'MHO Test', version: '1.2.3' };

vi.mock('../utils/version', () => ({
    getScriptInfo: (): { name: string; version?: string } | undefined => script_info
}));

/** `.map-box` et ses deux parents, où le bloc se monte */
function buildMapBox(): HTMLElement {
    document.body.innerHTML = '';
    const grandparent: HTMLDivElement = document.createElement('div');
    const parent: HTMLDivElement = document.createElement('div');
    const map_box: HTMLDivElement = document.createElement('div');
    map_box.classList.add('map-box');
    parent.appendChild(map_box);
    grandparent.appendChild(parent);
    document.body.appendChild(grandparent);
    return grandparent;
}

function sectionIds(): string[] {
    return Array.from(document.querySelectorAll('#mho-block-content > .mho-block-section')).map((section: Element): string => section.id);
}

describe('mho-block', (): void => {
    beforeEach((): void => {
        script_info = { name: 'MHO Test', version: '1.2.3' };
        buildMapBox();
    });

    it('sans conteneur de carte : null et aucun bloc', (): void => {
        document.body.innerHTML = '';

        expect(ensureMhoSection('a', 'A', 'last')).toBeNull();
        expect(document.getElementById(mho_block_id)).toBeNull();
    });

    it('titre : icône flat, nom et version du script', (): void => {
        ensureMhoSection('a', 'A', 'last');

        const title: HTMLElement = document.querySelector(`#${mho_block_id} > .background > h5`);
        expect(title.textContent).toContain('MHO Test v1.2.3');
        expect(title.querySelector('img').src).toBe(mh_optimizer_icon_flat);
    });

    it('titre : sans marge haute', (): void => {
        ensureMhoSection('a', 'A', 'last');

        const title: HTMLElement = document.querySelector(`#${mho_block_id} > .background > h5`);
        expect(title.style.marginTop).toBe('0px');
    });

    it('sans version : le nom seul', (): void => {
        script_info = { name: 'MHO Test' };

        ensureMhoSection('a', 'A', 'last');

        expect(document.querySelector(`#${mho_block_id} > .background > h5`).textContent.trim()).toBe('MHO Test');
    });

    it('informations du script indisponibles : titre « MHO Addon »', (): void => {
        script_info = undefined;

        ensureMhoSection('a', 'A', 'last');

        expect(document.querySelector(`#${mho_block_id} > .background > h5`).textContent.trim()).toBe('MHO Addon');
    });

    it('section : en-tête titré, contenu, idempotente, un seul bloc et une seule icône', (): void => {
        const first: MhoSection = ensureMhoSection('a', 'Titre A', 'last');
        const again: MhoSection = ensureMhoSection('a', 'Titre A', 'last');
        ensureMhoSection('b', 'B', 'last');

        expect(again.root).toBe(first.root);
        expect(first.header.id).toBe('a-header');
        expect(first.header.textContent).toContain('Titre A');
        expect(first.content.id).toBe('a-content');
        expect(first.root.contains(first.content)).toBe(true);
        expect(document.querySelectorAll(`#${mho_block_id}`)).toHaveLength(1);
        expect(document.querySelectorAll(`#${mho_block_id} img`)).toHaveLength(1);
        expect(document.querySelectorAll('#a')).toHaveLength(1);
    });

    it('position : « first » passe avant les autres, quel que soit l\'ordre d\'appel', (): void => {
        ensureMhoSection('infos', 'I', 'last');
        ensureMhoSection('expe', 'E', 'first');
        expect(sectionIds()).toEqual(['expe', 'infos']);

        buildMapBox();
        ensureMhoSection('expe', 'E', 'first');
        ensureMhoSection('infos', 'I', 'last');
        expect(sectionIds()).toEqual(['expe', 'infos']);
    });

    it('retrait : le bloc reste tant qu\'il a une section, puis disparaît', (): void => {
        ensureMhoSection('a', 'A', 'last');
        ensureMhoSection('b', 'B', 'last');

        removeMhoSection('a');
        expect(sectionIds()).toEqual(['b']);
        expect(document.getElementById(mho_block_id)).not.toBeNull();

        removeMhoSection('b');
        expect(document.getElementById(mho_block_id)).toBeNull();
    });

    it('retrait d\'une section absente : sans effet', (): void => {
        expect((): void => removeMhoSection('absente')).not.toThrow();
    });
});
