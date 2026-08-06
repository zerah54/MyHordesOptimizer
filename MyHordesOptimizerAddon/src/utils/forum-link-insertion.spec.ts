import { describe, expect, it } from 'vitest';

import { findLinkInsertionPoint } from './forum-link-insertion';

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
