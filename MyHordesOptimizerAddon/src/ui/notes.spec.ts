import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyCitizenNotes, getMyTownNotes, getMyUserNotes, upsertCitizenNote, upsertTownNote, upsertUserNote } from '../api/notes';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { addExternalLinksToProfiles } from './external-links';
import { displayCitizenNoteIcons, displayTownNote, displayUserGlobalNote } from './notes';

vi.mock('../api/notes', () => ({
    getMyTownNotes: vi.fn(),
    upsertTownNote: vi.fn(),
    getMyUserNotes: vi.fn(),
    upsertUserNote: vi.fn(),
    getMyCitizenNotes: vi.fn(),
    upsertCitizenNote: vi.fn()
}));

/** `external-links.ts` appelle `getScriptInfo()`, indisponible en environnement jsdom (pas de `GM_info`/`browser`/`chrome`) */
vi.mock('../utils/version', () => ({
    getScriptInfo: (): { name: string; version: string; updateURL: string } => ({ name: 'MyHordes Optimizer', version: '0.0.0', updateURL: 'about:blank' })
}));

const getMyTownNotesMock = getMyTownNotes as unknown as ReturnType<typeof vi.fn>;
const upsertTownNoteMock = upsertTownNote as unknown as ReturnType<typeof vi.fn>;
const getMyUserNotesMock = getMyUserNotes as unknown as ReturnType<typeof vi.fn>;
const upsertUserNoteMock = upsertUserNote as unknown as ReturnType<typeof vi.fn>;
const getMyCitizenNotesMock = getMyCitizenNotes as unknown as ReturnType<typeof vi.fn>;
const upsertCitizenNoteMock = upsertCitizenNote as unknown as ReturnType<typeof vi.fn>;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    document.body.innerHTML = '';
    state.mho_parameters = { display_notes: true };
    state.mh_user = { id: 1 } as typeof state.mh_user;
    state.town_notes = undefined;
    state.user_notes = undefined;
    state.citizen_notes = undefined;
    state.citizen_notes_map_id = undefined;
    getMyTownNotesMock.mockReset().mockResolvedValue({});
    upsertTownNoteMock.mockReset().mockResolvedValue(undefined);
    getMyUserNotesMock.mockReset().mockResolvedValue({});
    upsertUserNoteMock.mockReset().mockResolvedValue(undefined);
    getMyCitizenNotesMock.mockReset().mockResolvedValue({});
    upsertCitizenNoteMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
    window.history.pushState({}, '', '/');
    vi.restoreAllMocks();
});

describe('displayTownNote', () => {
    beforeEach(() => window.history.pushState({}, '', '/town/me'));

    it('does nothing outside a town history page', () => {
        window.history.pushState({}, '', '/town/watchtower');
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();

        expect(document.querySelector('.mho-note-block')).toBeNull();
    });

    it('does nothing while the option is off', async () => {
        state.mho_parameters.display_notes = false;
        state.town_notes = { 789: { note: 'ville sympa' } };
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();
        await flush();

        expect(document.querySelector('.mho-note-block')).toBeNull();
    });

    it('fetches the notes once, then renders once they resolve', async () => {
        getMyTownNotesMock.mockResolvedValue({ 789: { note: 'ville sympa' } });
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();
        expect(getMyTownNotesMock).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.mho-note-block')).toBeNull();

        state.town_notes = { 789: { note: 'ville sympa' } };
        await flush();
        displayTownNote();

        expect((document.querySelector('.mho-note-text') as HTMLElement)?.innerText).toBe('ville sympa');
    });

    it('shows the empty placeholder when no note exists for this town', () => {
        state.town_notes = {};
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();

        expect((document.querySelector('.mho-note-text') as HTMLElement)?.innerText).toBe(getI18N(texts.note_empty));
    });

    it('anchors right after the external links block when it exists', () => {
        state.town_notes = { 789: { note: 'ville sympa' } };
        document.body.innerHTML = `
            <div class="view-town" data-town-id="789">
                <div class="row"><button></button></div>
                <div id="mho-town-external-links"></div>
            </div>
        `;

        displayTownNote();

        expect(document.getElementById('mho-town-external-links')?.nextElementSibling?.classList.contains('mho-note-block')).toBe(true);
    });

    it('falls back to the buttons row when there is no external links block', () => {
        state.town_notes = { 789: { note: 'ville sympa' } };
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();

        expect(document.querySelector('.row .mho-note-block')).not.toBeNull();
    });

    it('saves the new note when the prompt is confirmed', () => {
        state.town_notes = { 789: { note: 'ancienne note' } };
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';
        vi.spyOn(window, 'prompt').mockReturnValue('nouvelle note');

        displayTownNote();
        (document.querySelector('.mho-note-icon') as HTMLElement).click();

        expect(upsertTownNoteMock).toHaveBeenCalledWith(789, 'nouvelle note');
    });

    it('does not save anything when the prompt is cancelled', () => {
        state.town_notes = { 789: { note: 'ancienne note' } };
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';
        vi.spyOn(window, 'prompt').mockReturnValue(null);

        displayTownNote();
        (document.querySelector('.mho-note-icon') as HTMLElement).click();

        expect(upsertTownNoteMock).not.toHaveBeenCalled();
    });

    it('frames the block like the external links block, with a header icon', () => {
        state.town_notes = { 789: { note: 'ville sympa' } };
        document.body.innerHTML = '<div class="view-town" data-town-id="789"><div class="row"><button></button></div></div>';

        displayTownNote();

        const block: HTMLElement | null = document.querySelector('.mho-note-block');
        expect(block?.querySelector('.mho-note-header-icon')).not.toBeNull();
        expect(block?.querySelector('.mho-note-header')?.tagName).toBe('H5');
        expect(block?.querySelector('.mho-note-header')?.classList.contains('mho-note-header-prominent')).toBe(true);
        expect(block?.style.border).toBe('1px solid rgb(221, 171, 118)');
    });
});

describe('displayCitizenNoteIcons', () => {
    beforeEach(() => window.history.pushState({}, '', '/town/me'));

    function setCitizensListDom(): void {
        document.body.innerHTML = `
            <div class="view-town" data-town-id="789">
                <div class="row-table citizens-list">
                    <div class="row-flex header"></div>
                    <div class="row">
                        <div class="cell"><span class="username" x-user-id="7">Zerah</span></div>
                    </div>
                    <div class="row">
                        <div class="cell"><span class="username" x-user-id="8">Toto</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    it('does nothing outside a town history page', () => {
        window.history.pushState({}, '', '/town/watchtower');
        setCitizensListDom();

        displayCitizenNoteIcons();

        expect(document.querySelectorAll('.mho-citizen-note-icon').length).toBe(0);
    });

    it('fetches citizen notes for the viewed town, then renders one icon per citizen once resolved', async () => {
        setCitizensListDom();

        displayCitizenNoteIcons();
        expect(getMyCitizenNotesMock).toHaveBeenCalledWith(789);
        expect(document.querySelectorAll('.mho-citizen-note-icon').length).toBe(0);

        state.citizen_notes = { 7: { note: 'a ouvert les portes' } };
        state.citizen_notes_map_id = 789;
        await flush();
        displayCitizenNoteIcons();

        const icons: NodeListOf<HTMLElement> = document.querySelectorAll('.mho-citizen-note-icon');
        expect(icons.length).toBe(2);
        expect(icons[0].title).toBe('a ouvert les portes');
        expect(icons[1].title).toBe(getI18N(texts.note_empty));
    });

    it('does not insert duplicate icons on repeated calls', () => {
        setCitizensListDom();
        state.citizen_notes = {};
        state.citizen_notes_map_id = 789;

        displayCitizenNoteIcons();
        displayCitizenNoteIcons();

        expect(document.querySelectorAll('.mho-citizen-note-icon').length).toBe(2);
    });

    it('removes the icons when the option is turned off', () => {
        setCitizensListDom();
        state.citizen_notes = {};
        state.citizen_notes_map_id = 789;
        displayCitizenNoteIcons();

        state.mho_parameters.display_notes = false;
        displayCitizenNoteIcons();

        expect(document.querySelectorAll('.mho-citizen-note-icon').length).toBe(0);
    });

    it('saves the note for the clicked citizen only', () => {
        setCitizensListDom();
        state.citizen_notes = {};
        state.citizen_notes_map_id = 789;
        vi.spyOn(window, 'prompt').mockReturnValue('a ouvert les portes');

        displayCitizenNoteIcons();
        const icons: NodeListOf<HTMLElement> = document.querySelectorAll('.mho-citizen-note-icon');
        icons[1].click();

        expect(upsertCitizenNoteMock).toHaveBeenCalledWith(8, 789, 'a ouvert les portes');
    });

    it('does not render an icon for the current player\'s own row', () => {
        state.mh_user = { id: 7 } as typeof state.mh_user;
        setCitizensListDom();
        state.citizen_notes = {};
        state.citizen_notes_map_id = 789;

        displayCitizenNoteIcons();

        expect(document.querySelectorAll('.mho-citizen-note-icon').length).toBe(1);
        expect(document.querySelector('.username[x-user-id="7"]')?.closest('.cell')?.querySelector('.mho-citizen-note-icon')).toBeNull();
    });
});

describe('displayUserGlobalNote', () => {
    it('does nothing without a user tooltip in the DOM', () => {
        displayUserGlobalNote();

        expect(document.querySelector('.mho-user-note-block')).toBeNull();
    });

    it('fetches the notes once, then renders once they resolve', async () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;

        displayUserGlobalNote();
        expect(getMyUserNotesMock).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.mho-user-note-block')).toBeNull();

        state.user_notes = { 456: { note: 'payeur fiable' } };
        await flush();
        displayUserGlobalNote();

        expect((document.querySelector('.mho-user-note-block .mho-note-text') as HTMLElement)?.innerText).toBe('payeur fiable');
    });

    it('saves the note for that user when confirmed', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;
        state.user_notes = {};
        vi.spyOn(window, 'prompt').mockReturnValue('payeur fiable');

        displayUserGlobalNote();
        (document.querySelector('.mho-note-icon') as HTMLElement).click();

        expect(upsertUserNoteMock).toHaveBeenCalledWith(456, 'payeur fiable');
    });

    it('wraps the block with a dashed separator before and after, and shows the MHO icon in the header', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
                <div class="after-hr">reste du tooltip natif</div>
            </div>
        `;
        state.user_notes = {};

        displayUserGlobalNote();

        const block: HTMLElement | null = document.querySelector('.mho-user-note-block');
        expect(block?.previousElementSibling?.tagName).toBe('HR');
        expect(block?.nextElementSibling?.tagName).toBe('HR');
        expect(block?.querySelector('.mho-note-header img')).not.toBeNull();
    });

    it('removes its two separators when the option is turned off, without touching the rest of the tooltip', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
                <div class="after-hr">reste du tooltip natif</div>
            </div>
        `;
        state.user_notes = {};
        displayUserGlobalNote();

        state.mho_parameters.display_notes = false;
        displayUserGlobalNote();

        expect(document.querySelector('.mho-user-note-block')).toBeNull();
        expect(document.querySelectorAll('hr.dashed').length).toBe(1);
        expect(document.querySelector('.after-hr')).not.toBeNull();
    });

    it('anchors after the external links block instead of its preceding separator, when it already exists', () => {
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
                <hr class="dashed">
                <div class="link-blocks mho-link-blocks"></div>
            </div>
        `;
        state.user_notes = {};

        displayUserGlobalNote();

        const mho_link_block: Element | null = document.querySelector('.mho-link-blocks');
        expect(mho_link_block?.nextElementSibling?.tagName).toBe('HR');
        expect(mho_link_block?.nextElementSibling?.previousElementSibling).toBe(mho_link_block);
        expect(document.querySelectorAll('hr.dashed').length).toBe(4);
    });

    it('places the links block before the note block, without stacking separators', () => {
        state.mho_parameters.display_external_links = true;
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;
        state.user_notes = {};

        /** Ordre réel : displayUserGlobalNote (initOptionsWithLoginNeeded) avant addExternalLinksToProfiles (initOptionsWithoutLoginNeeded) */
        displayUserGlobalNote();
        addExternalLinksToProfiles();

        const note_block: Element | null = document.querySelector('.mho-user-note-block');
        const link_block: Element | null = document.querySelector('.mho-link-blocks');
        expect(link_block?.previousElementSibling?.tagName).toBe('HR');
        expect(link_block?.nextElementSibling?.tagName).toBe('HR');
        expect(link_block?.nextElementSibling).toBe(note_block?.previousElementSibling);
        expect(note_block?.nextElementSibling?.tagName).toBe('HR');
        expect(document.querySelectorAll('hr.dashed').length).toBe(3);
    });

    it('leaves a single separator around the links block when the note option is turned off while both were shown', () => {
        state.mho_parameters.display_external_links = true;
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;
        state.user_notes = {};

        displayUserGlobalNote();
        addExternalLinksToProfiles();

        state.mho_parameters.display_notes = false;
        displayUserGlobalNote();

        const link_block: Element | null = document.querySelector('.mho-link-blocks');
        expect(document.querySelector('.mho-user-note-block')).toBeNull();
        expect(link_block?.previousElementSibling?.tagName).toBe('HR');
        expect(link_block?.nextElementSibling?.tagName).toBe('HR');
        expect(document.querySelectorAll('hr.dashed').length).toBe(2);
    });

    it('leaves a single separator around the note block when the links option is turned off while both were shown', () => {
        state.mho_parameters.display_external_links = true;
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;
        state.user_notes = {};

        displayUserGlobalNote();
        addExternalLinksToProfiles();

        state.mho_parameters.display_external_links = false;
        addExternalLinksToProfiles();

        const note_block: Element | null = document.querySelector('.mho-user-note-block');
        expect(document.querySelector('.mho-link-blocks')).toBeNull();
        expect(note_block?.previousElementSibling?.tagName).toBe('HR');
        expect(note_block?.nextElementSibling?.tagName).toBe('HR');
        expect(document.querySelectorAll('hr.dashed').length).toBe(2);
    });

    it('does nothing for the current player\'s own profile', () => {
        state.mh_user = { id: 456 } as typeof state.mh_user;
        document.body.innerHTML = `
            <div id="user-tooltip">
                <a class="link" x-ajax-href="/soul/456"></a>
                <hr class="dashed">
            </div>
        `;

        displayUserGlobalNote();

        expect(getMyUserNotesMock).not.toHaveBeenCalled();
        expect(document.querySelector('.mho-user-note-block')).toBeNull();
    });
});
