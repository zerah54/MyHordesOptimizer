import { describe, expect, it } from 'vitest';

import { findLinkInsertionPoint, findSameHrefLinkRun, getLinkRunText, stripForumMediaBlocks } from './forum-link-insertion';

describe('findSameHrefLinkRun', () => {
    it('groups a link split around a user tag by the game into one run', () => {
        document.body.innerHTML = '<div><a href="x.gif">POV : Tu es </a><span class="tag">Colyseo</span><a href="x.gif"> hier</a><br></div>';
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a'));

        expect(findSameHrefLinkRun(links[0])).toEqual(links);
        expect(getLinkRunText(links)).toBe('POV : Tu es Colyseo hier');
    });

    it('stops at a <br>', () => {
        document.body.innerHTML = '<div><a href="x.gif">a</a><br><a href="x.gif">b</a></div>';
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a'));

        expect(findSameHrefLinkRun(links[0])).toEqual([links[0]]);
    });

    it('stops at non-blank text between two identical links', () => {
        document.body.innerHTML = '<div><a href="x.gif">a</a> et aussi <a href="x.gif">b</a></div>';
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a'));

        expect(findSameHrefLinkRun(links[0])).toEqual([links[0]]);
    });

    it('groups across a nested user link split out by the HTML parser', () => {
        document.body.innerHTML = '<div><a href="x.gif">a</a><a href="/soul/1">tag</a><a href="x.gif">c</a></div>';
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a'));

        expect(findSameHrefLinkRun(links[0])).toEqual([links[0], links[2]]);
    });
});

describe('stripForumMediaBlocks', () => {
    it('removes the injected media blocks from post html', () => {
        const html: string = '<a href="x.gif">lien</a><br><div class="mho-forum-media-block"><img src="x.gif"></div>texte';

        expect(stripForumMediaBlocks(html)).toBe('<a href="x.gif">lien</a><br>texte');
    });
});

describe('findLinkInsertionPoint', () => {
    it('stops at the next <br> sibling of the link', () => {
        document.body.innerHTML = '<div><a href="x">lien</a><br><span>reste</span></div>';
        const link: HTMLAnchorElement = document.querySelector('a') as HTMLAnchorElement;
        const br: HTMLElement = document.querySelector('br') as HTMLElement;

        expect(findLinkInsertionPoint(link)).toEqual({ node: br, position: 'afterend' });
    });

    it('inserts as the last child of the container when there is no <br> and no collapse toggle', () => {
        document.body.innerHTML = '<div><a href="x">lien</a></div>';
        const link: HTMLAnchorElement = document.querySelector('a') as HTMLAnchorElement;
        const parent: HTMLElement = link.parentElement as HTMLElement;

        expect(findLinkInsertionPoint(link)).toEqual({ node: parent, position: 'beforeend' });
    });

    it('inserts just before the collapse toggle when the link is the last child before it', () => {
        document.body.innerHTML = '<div><a href="x">lien</a><div data-etog></div></div>';
        const link: HTMLAnchorElement = document.querySelector('a') as HTMLAnchorElement;
        const toggle: HTMLElement = document.querySelector('[data-etog]') as HTMLElement;

        expect(findLinkInsertionPoint(link)).toEqual({ node: toggle, position: 'beforebegin' });
    });

    it('falls back to inserting after the link itself when it has no parent', () => {
        const link: HTMLAnchorElement = document.createElement('a');

        expect(findLinkInsertionPoint(link)).toEqual({ node: link, position: 'afterend' });
    });
});
