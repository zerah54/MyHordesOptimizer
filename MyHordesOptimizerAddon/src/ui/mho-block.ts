import { mh_optimizer_icon_flat } from '../config/constants';
import { getScriptInfo } from '../utils/version';

/** Bloc unique « MHO Addon » sous la carte du désert : chaque module y monte sa section. */

export const mho_block_id: string = 'mho-block';
const mho_block_content_id: string = `${mho_block_id}-content`;
const section_class: string = 'mho-block-section';

/** Section montée dans le bloc : `header` reçoit les boutons de l'appelant, `content` son contenu */
export interface MhoSection {
    root: HTMLElement;
    header: HTMLElement;
    content: HTMLElement;
}

/** Titre du bloc : icône, nom du script et sa version si elle est connue. */
function blockTitle(): string {
    const info: { name?: string; version?: string } | undefined = getScriptInfo();
    return `${info?.name ?? 'MHO Addon'}${info?.version ? ` v${info.version}` : ''}`;
}

/** Zone de contenu du bloc, créée au besoin ; `null` sans carte du désert. */
function ensureBlockContent(): HTMLElement | null {
    const existing: HTMLElement | null = document.getElementById(mho_block_content_id);
    if (existing) return existing;

    const container: HTMLElement | null | undefined = document.querySelector('.map-box')?.parentElement?.parentElement;
    if (!container) return null;
    document.getElementById(mho_block_id)?.remove();

    const block: HTMLDivElement = document.createElement('div');
    block.id = mho_block_id;
    block.classList.add('row');

    const inner: HTMLDivElement = document.createElement('div');
    inner.classList.add('background', 'cell');
    inner.style.width = '100%';
    block.appendChild(inner);

    const title: HTMLHeadingElement = document.createElement('h5');
    const icon: HTMLImageElement = document.createElement('img');
    icon.src = mh_optimizer_icon_flat;
    icon.alt = '';
    icon.classList.add('mho-block-icon');
    title.style.marginTop = '0';
    title.appendChild(icon);
    title.appendChild(document.createTextNode(blockTitle()));
    inner.appendChild(title);

    const content: HTMLDivElement = document.createElement('div');
    content.id = mho_block_content_id;
    inner.appendChild(content);

    container.appendChild(block);
    return content;
}

/**
 * Section `id` du bloc, créée au besoin (le bloc aussi) ; la même si elle existe déjà.
 * @param id Identifiant de la section, suffixé `-header` et `-content` pour ses zones
 * @param title Titre affiché en gras dans l'en-tête
 * @param position `first` la place avant les autres sections, `last` après
 * @returns `null` sans carte du désert
 */
export function ensureMhoSection(id: string, title: string, position: 'first' | 'last'): MhoSection | null {
    const blocks_content: HTMLElement | null = ensureBlockContent();
    if (!blocks_content) return null;

    let root: HTMLElement | null = document.getElementById(id);
    if (!root || root.parentElement !== blocks_content) {
        root?.remove();
        root = document.createElement('div');
        root.id = id;
        root.classList.add(section_class);

        const header: HTMLHeadingElement = document.createElement('h5');
        header.id = `${id}-header`;
        header.classList.add('mho-block-section-header');
        const label: HTMLSpanElement = document.createElement('span');
        label.classList.add('mho-block-section-title');
        label.textContent = title;
        header.appendChild(label);
        root.appendChild(header);

        const content: HTMLDivElement = document.createElement('div');
        content.id = `${id}-content`;
        root.appendChild(content);

        if (position === 'first') blocks_content.prepend(root);
        else blocks_content.appendChild(root);
    }

    return {
        root,
        header: root.querySelector<HTMLElement>(`:scope > #${id}-header`) as HTMLElement,
        content: root.querySelector<HTMLElement>(`:scope > #${id}-content`) as HTMLElement
    };
}

/** Retire la section `id`, et le bloc s'il n'en garde aucune. */
export function removeMhoSection(id: string): void {
    document.getElementById(id)?.remove();
    const blocks_content: HTMLElement | null = document.getElementById(mho_block_content_id);
    if (blocks_content && !blocks_content.querySelector(`:scope > .${section_class}`)) {
        document.getElementById(mho_block_id)?.remove();
    }
}
