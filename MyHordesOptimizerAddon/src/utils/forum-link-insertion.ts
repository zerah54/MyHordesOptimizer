export interface LinkInsertionPoint {
    node: HTMLElement;
    position: InsertPosition;
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
