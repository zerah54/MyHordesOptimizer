import { describe, expect, it } from 'vitest';

import { isCitizenRowBanned } from './citizen-banned';

/** Ligne de la liste des citoyens avec ou sans l'icône de bannissement du jeu. */
function row(html: string): HTMLElement {
    const element: HTMLElement = document.createElement('div');
    element.innerHTML = `<div class="userCell"><a class="username">Zerah</a>${html}</div>`;
    return element;
}

describe('isCitizenRowBanned', () => {
    it('returns true when the row shows the banishment icon', () => {
        expect(isCitizenRowBanned(row('<div class="inline"><img alt="" src="/build/images/icons/banished.gif"></div>'))).toBe(true);
    });

    it('returns false without the banishment icon', () => {
        expect(isCitizenRowBanned(row('<img alt="" src="/build/images/professions/void.gif">'))).toBe(false);
    });
});
