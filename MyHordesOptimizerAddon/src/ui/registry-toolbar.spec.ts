import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mh_optimizer_icon_flat } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { addCopyRegistryButton } from './registry';
import { ensureRegistryToolbar } from './registry-toolbar';
import { displaySearchFieldOnRegistry } from './search-fields';

/** `texts.ts` appelle `getScriptInfo()` au chargement : absent en jsdom. */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock: not used by this spec')),
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

/** jsdom n'implémente pas `innerText`, lu par le filtre du registre. */
Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true,
    get(): string {
        return this.textContent;
    }
});

function buildDom(title_tag: string): void {
    document.body.innerHTML = `<div><${title_tag}>Discussions</${title_tag}><div><hordes-log>
        <div class="log-entry"><span class="log-part-time">10:00</span><span class="log-part-content">pomme</span></div>
        <div class="log-entry"><span class="log-part-time">10:01</span><span class="log-part-content">poire</span></div>
    </hordes-log></div></div>`;
}

describe('registry toolbar', () => {
    beforeEach(() => {
        buildDom('h5');
        state.mho_parameters = { copy_registry: true, display_search_field_registry: true } as any;
    });

    function expectSingleToolbar(): void {
        expect(document.querySelectorAll('#mho-registry-toolbar')).toHaveLength(1);
        expect(document.querySelectorAll(`h5 img[src="${mh_optimizer_icon_flat}"]`)).toHaveLength(1);
        const toolbar: Element = document.querySelector('#mho-registry-toolbar');
        expect(toolbar.querySelector('#mho-copy-logs')).not.toBeNull();
        expect(toolbar.querySelector('#mho-search-registry-field')).not.toBeNull();
    }

    it('shares one toolbar and one icon, copy then search', () => {
        addCopyRegistryButton();
        displaySearchFieldOnRegistry();
        expectSingleToolbar();
    });

    it('shares one toolbar and one icon, search then copy', () => {
        displaySearchFieldOnRegistry();
        addCopyRegistryButton();
        expectSingleToolbar();
    });

    it('does not use the game header-icon class (it hides all but the first child)', () => {
        const toolbar: HTMLElement = ensureRegistryToolbar();
        expect(toolbar.classList.contains('header-icon')).toBe(false);
    });

    it('contains only the copy button when search is disabled', () => {
        state.mho_parameters = { copy_registry: true } as any;
        addCopyRegistryButton();
        displaySearchFieldOnRegistry();
        const toolbar: Element = document.querySelector('#mho-registry-toolbar');
        expect(toolbar.querySelector('#mho-copy-logs')).not.toBeNull();
        expect(toolbar.querySelector('#mho-search-registry-field')).toBeNull();
    });

    it('returns null and adds nothing without hordes-log', () => {
        document.body.innerHTML = '<div><h5>Discussions</h5></div>';
        expect(ensureRegistryToolbar()).toBeNull();
        expect(document.querySelector('#mho-registry-toolbar')).toBeNull();
        expect(document.querySelector('img')).toBeNull();
    });

    it('centers the toolbar under a non-H5 title', () => {
        buildDom('div');
        const toolbar: HTMLElement = ensureRegistryToolbar();
        expect(toolbar.style.display).toBe('flex');
        expect(toolbar.style.justifyContent).toBe('center');
    });

    it('filters entries on input and uses the short placeholder', () => {
        displaySearchFieldOnRegistry();
        const field: HTMLInputElement = document.querySelector('#mho-search-registry-field');
        expect(field.placeholder).toBe(getI18N(texts.search_short_placeholder));
        field.value = 'poire';
        field.dispatchEvent(new Event('keyup'));
        const entries: NodeListOf<Element> = document.querySelectorAll('.log-entry');
        expect(entries[0].classList.contains('hidden')).toBe(true);
        expect(entries[1].classList.contains('hidden')).toBe(false);
    });
});
