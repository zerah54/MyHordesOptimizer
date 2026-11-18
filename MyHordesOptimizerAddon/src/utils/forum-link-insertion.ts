export interface LinkInsertionPoint {
    node: HTMLElement;
    position: InsertPosition;
}

/** Classe commune aux blocs image et vidéo injectés après un lien */
export const forum_media_block_class: string = 'mho-forum-media-block';

/**
 * Regroupe un lien avec les liens de même `href` qui le suivent sur la même ligne, séparés
 * uniquement par des éléments (ex. tag utilisateur) ou des blancs : le jeu coupe ainsi un lien
 * contenant un tag en plusieurs `<a>`. S'arrête au premier `<br>` ou texte non blanc.
 */
export function findSameHrefLinkRun(link: HTMLAnchorElement): HTMLAnchorElement[] {
    const href: string | null = link.getAttribute('href');
    const run: HTMLAnchorElement[] = [link];

    let sibling: ChildNode | null = link.nextSibling;
    while (sibling) {
        if (sibling instanceof HTMLElement) {
            if (sibling.tagName === 'BR') break;
            if (sibling instanceof HTMLAnchorElement && sibling.getAttribute('href') === href) run.push(sibling);
        } else if ((sibling.textContent ?? '').trim() !== '') {
            break;
        }
        sibling = sibling.nextSibling;
    }

    return run;
}

/** Texte affiché du premier au dernier lien d'un groupe, éléments intercalés (tags) compris */
export function getLinkRunText(run: HTMLAnchorElement[]): string {
    const range: Range = document.createRange();
    range.setStartBefore(run[0]);
    range.setEndAfter(run[run.length - 1]);
    return range.toString().trim();
}

/** Retire les blocs média injectés d'un HTML de post, pour qu'ils ne soient pas recopiés par Copier/Citer */
export function stripForumMediaBlocks(html: string): string {
    const template: HTMLTemplateElement = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll(`.${forum_media_block_class}`).forEach((block: Element) => block.remove());
    return template.innerHTML;
}

/**
 * Repère où poser un bloc après un lien sans jamais quitter son conteneur direct (celui-ci peut
 * être `.forum-post-content` lui-même, mais tout aussi bien un `<blockquote>` de citation ou le
 * `.collapsed` d'une section repliée — le bloc doit rester DEDANS pour, par exemple, rester masqué
 * avec une section repliée tant qu'elle ne s'ouvre pas).
 *
 * On ne remonte donc jamais au-delà de `link.parentElement` : on cherche le prochain `<br>` parmi
 * les frères directs du lien (un saut de paragraphe `<br><br>` est déjà couvert, on s'arrête au
 * premier des deux) et on se pose juste après ; s'il n'y en a pas (le lien est sur la toute
 * dernière ligne de son conteneur), on ajoute en tout dernier enfant de ce même conteneur plutôt
 * que juste après lui (ce qui en sortirait) — sauf si ce dernier enfant est la flèche de dépli
 * d'une section repliée (`div[data-etog]`, posée par le jeu en tout dernier), auquel cas on se
 * pose juste avant elle pour ne pas passer derrière.
 */
export function findLinkInsertionPoint(link: HTMLAnchorElement): LinkInsertionPoint {
    const parent: HTMLElement | null = link.parentElement;
    if (!parent) return { node: link, position: 'afterend' };

    let sibling: ChildNode | null = link.nextSibling;
    while (sibling) {
        if (sibling instanceof HTMLElement && sibling.tagName === 'BR') return { node: sibling, position: 'afterend' };
        sibling = sibling.nextSibling;
    }

    const collapse_toggle: Element | null = parent.lastElementChild;
    if (collapse_toggle instanceof HTMLElement && collapse_toggle.hasAttribute('data-etog')) {
        return { node: collapse_toggle, position: 'beforebegin' };
    }

    return { node: parent, position: 'beforeend' };
}
