import { getMyCitizenNotes, getMyTownNotes, getMyUserNotes, upsertCitizenNote, upsertTownNote, upsertUserNote } from '../api/notes';
import { mh_optimizer_icon, mho_town_external_links_id, mho_town_note_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { ensureDashedSeparatorAfter } from '../utils/dom';
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

interface NoteBlockOptions {
    /** Icône MHO affichée devant le libellé, comme les autres en-têtes de section du tooltip (ex. « Profils externes ») */
    readonly header_icon_src?: string;
    /** Couleur du texte du tooltip (ses éléments ne l'héritent pas, cf. `span.link` dans soul.less) */
    readonly color?: string;
    /** En-tête à pleine opacité avec une icône plus grande, pour matcher le titre du bloc « Liens externes » de la page ville */
    readonly prominent_header?: boolean;
}

/**
 * Bloc note, utilisé pour les surfaces où la note reste toujours visible (ville, joueur) : un
 * en-tête icône + libellé (même schéma que les autres sections du tooltip, ex. « Profils externes »),
 * puis le texte de la note en dessous.
 */
function createNoteTextBlock(
    getCurrentNote: () => string | undefined,
    onSave: (value: string) => Promise<void>,
    options?: NoteBlockOptions
): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    container.classList.add('mho-note-block');
    if (options?.color) container.style.color = options.color;

    /** En contexte « prominent », l'en-tête est un vrai `h5` pour hériter du même style de titre que le bloc « Liens externes » de la page ville */
    const header: HTMLElement = document.createElement(options?.prominent_header ? 'h5' : 'div');
    header.classList.add('mho-note-header');
    if (options?.prominent_header) header.classList.add('mho-note-header-prominent');
    container.appendChild(header);

    if (options?.header_icon_src) {
        const header_icon: HTMLImageElement = document.createElement('img');
        header_icon.classList.add('mho-note-header-icon');
        header_icon.src = options.header_icon_src;
        header_icon.alt = '';
        header.appendChild(header_icon);
    }

    const label: HTMLSpanElement = document.createElement('span');
    label.innerText = getI18N(texts.note_label);
    header.appendChild(label);

    const text: HTMLSpanElement = document.createElement('span');
    text.classList.add('mho-note-text');
    container.appendChild(text);

    const icon: HTMLImageElement = createNoteIcon(getCurrentNote, onSave, (note: string): void => {
        text.innerText = note === '' ? getI18N(texts.note_empty) : note;
        text.classList.toggle('mho-note-text-empty', note === '');
    });
    header.appendChild(icon);

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
        (value: string) => upsertTownNote(map_id, value),
        { header_icon_src: mh_optimizer_icon, prominent_header: true }
    );
    block.id = mho_town_note_id;
    block.style.padding = '0.25em';
    block.style.border = '1px solid #ddab76';

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
        if (user_id === state.mh_user?.id) return;

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
        /** Le séparateur juste après le bloc est toujours le nôtre (créé par ensureDashedSeparatorAfter à la construction) */
        const trailing_separator: Element | null | undefined = existing?.nextElementSibling;
        if (trailing_separator?.tagName === 'HR') trailing_separator.remove();
        existing?.remove();
        return;
    }
    /** ponytail: pas de garde anti-réutilisation de nœud ici, comme addExternalLinksToProfiles */
    if (existing) return;

    /** Le tooltip peut aussi contenir un lien « Voir la maison » avant celui-ci (même ville, même zone) : son x-ajax-href porte l'id du Citizen, pas celui du User. */
    const link_element: HTMLElement | null = user_tooltip.querySelector('.link[x-ajax-href*="/soul/"]');
    const user_id_raw: string | null | undefined = link_element?.getAttribute('x-ajax-href')?.replace(/\D/g, '');
    if (!user_id_raw) return;
    const user_id: number = +user_id_raw;
    if (user_id === state.mh_user?.id) return;

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

    /** Les éléments du tooltip n'héritent pas d'une couleur de texte lisible par défaut (cf. `span.link` dans soul.less) : on reprend celle du lien de profil */
    const link_color: string = window.getComputedStyle(link_element ?? user_tooltip).getPropertyValue('color');

    const block: HTMLDivElement = createNoteTextBlock(
        () => state.user_notes?.[user_id]?.note,
        (value: string) => upsertUserNote(user_id, value),
        { header_icon_src: mh_optimizer_icon, color: link_color }
    );
    block.classList.add(user_note_block_class);

    /**
     * S'ancre après le bloc « Profils externes » (mho-link-blocks) s'il existe déjà : s'ancrer sur
     * le dernier hr.dashed le ferait atterrir juste avant ce bloc (son propre hr précédent), collant
     * les deux séparateurs l'un contre l'autre. `ensureDashedSeparatorAfter` réutilise en plus tout
     * séparateur déjà présent à cet endroit, au lieu d'en empiler un second.
     */
    const dash_separators: NodeListOf<Element> = user_tooltip.querySelectorAll('hr.dashed');
    const last_separator: Element | undefined = Array.from(dash_separators).pop();
    const anchor: Element | null = user_tooltip.querySelector('.mho-link-blocks') ?? last_separator ?? null;
    if (anchor) {
        const separator_before: Element = ensureDashedSeparatorAfter(anchor);
        separator_before.insertAdjacentElement('afterend', block);
        ensureDashedSeparatorAfter(block);
    } else {
        const separator_before: HTMLHRElement = document.createElement('hr');
        separator_before.classList.add('dashed');
        const separator_after: HTMLHRElement = document.createElement('hr');
        separator_after.classList.add('dashed');
        user_tooltip.append(separator_before, block, separator_after);
    }
}
