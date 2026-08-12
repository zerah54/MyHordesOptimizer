import { getMyCitizenNotes, getMyTownNotes, getMyUserNotes, upsertCitizenNote, upsertTownNote, upsertUserNote } from '../api/notes';
import { mho_town_external_links_id, mho_town_note_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { pageIsTownHistory } from '../utils/page';

const citizen_note_icon_class: string = 'mho-citizen-note-icon';
const user_note_block_class: string = 'mho-user-note-block';

/**
 * Icône unique (crayon MyHordes) partagée par les 3 surfaces : opacité et `title` reflètent
 * la présence d'une note, clic = `prompt()` natif (rung 4 ponytail — pas de popup maison).
 */
function createNoteIcon(
    getCurrentNote: () => string | undefined,
    onSave: (value: string) => Promise<void>,
    onRefresh?: (note: string) => void
): HTMLImageElement {
    const icon: HTMLImageElement = document.createElement('img');
    icon.classList.add('mho-note-icon');
    icon.src = repo_img_hordes_url + 'forum/edit.png';
    icon.alt = 'note';

    const refresh = (): void => {
        const current: string = (getCurrentNote() ?? '').trim();
        icon.classList.toggle('mho-note-icon-empty', current === '');
        icon.title = current === '' ? getI18N(texts.note_empty) : current;
        onRefresh?.(current);
    };

    icon.addEventListener('click', () => {
        const value: string | null = window.prompt(getI18N(texts.note_label), getCurrentNote() ?? '');
        if (value === null) return;
        onSave(value).finally(refresh);
    });

    refresh();
    return icon;
}

/** Bloc texte + icône, utilisé pour les surfaces où la note reste toujours visible (ville, joueur) */
function createNoteTextBlock(getCurrentNote: () => string | undefined, onSave: (value: string) => Promise<void>): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    container.classList.add('mho-note-block');

    const text: HTMLSpanElement = document.createElement('span');
    text.classList.add('mho-note-text');
    container.appendChild(text);

    const icon: HTMLImageElement = createNoteIcon(getCurrentNote, onSave, (note: string): void => {
        text.innerText = note === '' ? getI18N(texts.note_empty) : note;
        text.classList.toggle('mho-note-text-empty', note === '');
    });
    container.appendChild(icon);

    return container;
}

let is_loading_town_notes: boolean = false;

/** Note de ville, sous le bloc d'outils externes (ou à sa place, s'il est absent/désactivé) */
export function displayTownNote(): void {
    if (!pageIsTownHistory()) return;

    const view_town: HTMLElement | null = document.querySelector('.view-town');
    if (!view_town) return;

    const existing: HTMLElement | null = document.getElementById(mho_town_note_id);
    if (!state.mho_parameters.display_notes) {
        existing?.remove();
        return;
    }
    if (existing) return;

    const map_id_raw: string | null = view_town.getAttribute('data-town-id');
    if (!map_id_raw) return;
    const map_id: number = +map_id_raw;

    if (!state.town_notes) {
        if (!is_loading_town_notes) {
            is_loading_town_notes = true;
            getMyTownNotes()
                .catch(() => undefined)
                .finally(() => {
                    is_loading_town_notes = false;
                    displayTownNote();
                });
        }
        return;
    }

    const block: HTMLDivElement = createNoteTextBlock(
        () => state.town_notes?.[map_id]?.note,
        (value: string) => upsertTownNote(map_id, value)
    );
    block.id = mho_town_note_id;

    const anchor: HTMLElement | null = document.getElementById(mho_town_external_links_id);
    if (anchor) {
        anchor.insertAdjacentElement('afterend', block);
    } else {
        view_town.querySelector('button')?.parentElement?.appendChild(block);
    }
}

let is_loading_citizen_notes: boolean = false;

/** Icône de note à côté du pseudo de chaque citoyen de la ville consultée */
export function displayCitizenNoteIcons(): void {
    if (!pageIsTownHistory()) return;

    const view_town: HTMLElement | null = document.querySelector('.view-town');
    if (!view_town) return;

    if (!state.mho_parameters.display_notes) {
        view_town.querySelectorAll('.' + citizen_note_icon_class).forEach((icon: Element): void => icon.remove());
        return;
    }

    const map_id_raw: string | null = view_town.getAttribute('data-town-id');
    if (!map_id_raw) return;
    const map_id: number = +map_id_raw;

    if (!state.citizen_notes || state.citizen_notes_map_id !== map_id) {
        if (!is_loading_citizen_notes) {
            is_loading_citizen_notes = true;
            getMyCitizenNotes(map_id)
                .catch(() => undefined)
                .finally(() => {
                    is_loading_citizen_notes = false;
                    displayCitizenNoteIcons();
                });
        }
        return;
    }

    view_town.querySelectorAll<HTMLElement>('.row-table.citizens-list .row:not(.header) .username[x-user-id]').forEach((username: HTMLElement): void => {
        const cell: Element | null = username.closest('.cell');
        if (!cell || cell.querySelector('.' + citizen_note_icon_class)) return;

        const user_id_raw: string | null = username.getAttribute('x-user-id');
        if (!user_id_raw) return;
        const user_id: number = +user_id_raw;

        const icon: HTMLImageElement = createNoteIcon(
            () => state.citizen_notes?.[user_id]?.note,
            (value: string) => upsertCitizenNote(user_id, map_id, value)
        );
        icon.classList.add(citizen_note_icon_class);
        cell.appendChild(icon);
    });
}

let is_loading_user_notes: boolean = false;

/** Note globale du citoyen, dans sa bulle de survol, indépendante du bloc de liens externes */
export function displayUserGlobalNote(): void {
    const user_tooltip: HTMLElement | null = document.querySelector('#user-tooltip');
    if (!user_tooltip) return;

    const existing: Element | null = user_tooltip.querySelector('.' + user_note_block_class);
    if (!state.mho_parameters.display_notes) {
        existing?.remove();
        return;
    }
    /** ponytail: pas de garde anti-réutilisation de nœud ici, comme addExternalLinksToProfiles */
    if (existing) return;

    const user_id_raw: string | null | undefined = user_tooltip.querySelector('[x-ajax-href]')?.getAttribute('x-ajax-href')?.replace(/\D/g, '');
    if (!user_id_raw) return;
    const user_id: number = +user_id_raw;

    if (!state.user_notes) {
        if (!is_loading_user_notes) {
            is_loading_user_notes = true;
            getMyUserNotes()
                .catch(() => undefined)
                .finally(() => {
                    is_loading_user_notes = false;
                    displayUserGlobalNote();
                });
        }
        return;
    }

    const block: HTMLDivElement = createNoteTextBlock(
        () => state.user_notes?.[user_id]?.note,
        (value: string) => upsertUserNote(user_id, value)
    );
    block.classList.add(user_note_block_class);

    const dash_separators: NodeListOf<Element> = user_tooltip.querySelectorAll('hr.dashed');
    const last_separator: Element | undefined = Array.from(dash_separators).pop();
    if (last_separator?.parentNode) {
        const new_separator: HTMLHRElement = document.createElement('hr');
        new_separator.classList.add('dashed');
        last_separator.parentNode.insertBefore(new_separator, last_separator.nextSibling);
        last_separator.parentNode.insertBefore(block, new_separator.nextSibling);
    } else {
        user_tooltip.appendChild(block);
    }
}
