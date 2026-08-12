import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyCitizenNotes, getMyTownNotes, getMyUserNotes, upsertCitizenNote, upsertTownNote, upsertUserNote } from '../api/notes';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { displayCitizenNoteIcons, displayTownNote, displayUserGlobalNote } from './notes';

vi.mock('../api/notes', () => ({
    getMyTownNotes: vi.fn(),
    upsertTownNote: vi.fn(),
    getMyUserNotes: vi.fn(),
    upsertUserNote: vi.fn(),
    getMyCitizenNotes: vi.fn(),
    upsertCitizenNote: vi.fn()
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
});
