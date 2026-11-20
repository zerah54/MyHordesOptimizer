import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mh_optimizer_icon, mh_optimizer_icon_flat, mho_display_translate_input_id, mho_header_space_id } from '../config/constants';
import { state } from '../state';
import { createMhoHeaderSpace, getHeaderButtonsContainer } from './header-space';
import { displayTranslateTool, mho_translate_button_id } from './translate';

/** `texts.ts` appelle `getScriptInfo()` au chargement : absent en jsdom. */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    isScriptVersionLastVersion: (): boolean => true,
    isNewVersion: (): boolean => false,
    toggleNewChangelog: (): undefined => undefined,
    toggleNewVersion: (): undefined => undefined,
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' }),
    getChangelog: (): string => ''
}));

describe('displayTranslateTool', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="header"><div id="postbox"><img></div></div>';
        createMhoHeaderSpace();
        state.mho_parameters = { display_translate_tool: true } as typeof state.mho_parameters;
    });

    it('ajoute un bouton dans le cadre et un panneau masqué hors du cadre', () => {
        displayTranslateTool();
        const button: HTMLElement | null = document.getElementById(mho_translate_button_id);
        const panel: HTMLElement | null = document.getElementById(mho_display_translate_input_id);
        expect(button?.parentElement).toBe(getHeaderButtonsContainer());
        expect(panel?.parentElement?.id).toBe(mho_header_space_id);
        expect(panel?.classList.contains('hidden')).toBe(true);
    });

    it('le clic sur le bouton ouvre puis referme le panneau', () => {
        displayTranslateTool();
        const button: HTMLElement = document.getElementById(mho_translate_button_id) as HTMLElement;
        const panel: HTMLElement = document.getElementById(mho_display_translate_input_id) as HTMLElement;
        button.click();
        expect(panel.classList.contains('hidden')).toBe(false);
        button.click();
        expect(panel.classList.contains('hidden')).toBe(true);
    });

    it('n\'ajoute aucune icône MHO et reste idempotent', () => {
        displayTranslateTool();
        displayTranslateTool();
        const space: HTMLElement = document.getElementById(mho_header_space_id) as HTMLElement;
        expect(space.querySelectorAll(`#${mho_translate_button_id}`).length).toBe(1);
        expect(space.querySelectorAll(`img[src="${mh_optimizer_icon}"]`).length).toBe(0);
        expect(space.querySelectorAll(`img[src="${mh_optimizer_icon_flat}"]`).length).toBe(1);
    });

    it('retire bouton et panneau quand l\'option est désactivée', () => {
        displayTranslateTool();
        state.mho_parameters = { display_translate_tool: false } as typeof state.mho_parameters;
        displayTranslateTool();
        expect(document.getElementById(mho_translate_button_id)).toBeNull();
        expect(document.getElementById(mho_display_translate_input_id)).toBeNull();
    });
});
