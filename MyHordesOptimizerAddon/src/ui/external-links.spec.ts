import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mh_optimizer_site_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { addExternalLinksColumnToWelcomeTowns, addExternalLinksToProfiles, addExternalLinksToTowns } from './external-links';

/**
 * `../utils/version` est importé transitivement par ce module : en environnement Tampermonkey
 * réel, `GM_info`/`browser`/`chrome` existent toujours. En jsdom (Vitest), aucun des trois n'est
 * défini, ce qui fait planter l'import si `getScriptInfo()` n'est pas mocké.
 */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock: not used by this spec')),
    getErrorFromApi: (error: unknown): unknown => error,
    isScriptVersionLastVersion: (): boolean => true,
    isNewVersion: (): boolean => false,
    toggleNewChangelog: (): undefined => undefined,
    toggleNewVersion: (): undefined => undefined,
    getOrigin: (): string => 'script',
    isScript: (): boolean => true,
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MyHordes Optimizer', version: '0.0.0', updateURL: 'about:blank' }),
    getChangelog: (): string => ''
}));

beforeEach(() => {
    document.body.innerHTML = '';
    state.mho_parameters = { display_external_links: true };
});

afterEach(() => {
    window.history.pushState({}, '', '/');
    vi.restoreAllMocks();
});

describe('addExternalLinksToProfiles', () => {
    it('places the MHO profile link before BigBroth\'Hordes and Gest\'Hordes', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;

        addExternalLinksToProfiles();

        const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.mho-link-blocks a.link-block');
        expect(links.length).toBe(3);
        expect(links[0].href).toBe(`${mh_optimizer_site_url}/profile/456`);
    });

    it('wraps the links block with a dashed separator before and after', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;

        addExternalLinksToProfiles();

        const link_block: Element | null = document.querySelector('.mho-link-blocks');
        expect(link_block?.previousElementSibling?.tagName).toBe('HR');
        expect(link_block?.nextElementSibling?.tagName).toBe('HR');
    });

    it('removes its two separators when the option is turned off, without touching the rest of the tooltip', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
                <div class="after-hr">reste du tooltip natif</div>
            </div>
        `;
        addExternalLinksToProfiles();

        state.mho_parameters.display_external_links = false;
        addExternalLinksToProfiles();

        expect(document.querySelector('.mho-link-blocks')).toBeNull();
        expect(document.querySelectorAll('hr.dashed').length).toBe(1);
        expect(document.querySelector('.after-hr')).not.toBeNull();
    });
});

describe('addExternalLinksToTowns', () => {
    beforeEach(() => window.history.pushState({}, '', '/town/me'));

    it('opens the MHO town page first among the external tool buttons', () => {
        document.body.innerHTML = `
            <div class="view-town" data-town-id="789">
                <div class="row"><button></button></div>
            </div>
        `;
        const open_spy = vi.spyOn(window, 'open').mockReturnValue(null);

        addExternalLinksToTowns();

        const buttons: NodeListOf<HTMLButtonElement> = document.querySelectorAll('#mho-town-external-links button');
        expect(buttons.length).toBe(3);

        buttons[0].click();
        expect(open_spy).toHaveBeenCalledWith(`${mh_optimizer_site_url}/town/789`, '_blank');
    });

    it('titles the block with the external links label, not the script name', () => {
        document.body.innerHTML = `
            <div class="view-town" data-town-id="789">
                <div class="row"><button></button></div>
            </div>
        `;

        addExternalLinksToTowns();

        expect((document.querySelector('#mho-town-external-links h5 text') as HTMLElement | null)?.innerText).toBe(getI18N(texts.external_links));
    });
});

describe('addExternalLinksColumnToWelcomeTowns', () => {
    beforeEach(() => window.history.pushState({}, '', '/welcome'));

    it('opens the MHO town page first among the welcome list buttons', () => {
        document.body.innerHTML = `
            <hordes-game-onboarding>
                <div class="row-flex header"></div>
                <div class="town-row" data-town-id="321"></div>
            </hordes-game-onboarding>
        `;
        const open_spy = vi.spyOn(window, 'open').mockReturnValue(null);

        addExternalLinksColumnToWelcomeTowns();

        const buttons: NodeListOf<HTMLButtonElement> = document.querySelectorAll('.mho-town-list-link-panel button');
        expect(buttons.length).toBe(3);

        buttons[0].click();
        expect(open_spy).toHaveBeenCalledWith(`${mh_optimizer_site_url}/town/321`, '_blank');
    });
});
