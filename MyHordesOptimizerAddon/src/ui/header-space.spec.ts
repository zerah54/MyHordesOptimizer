import { beforeEach, describe, expect, it } from 'vitest';

import { mh_optimizer_icon_flat, mho_header_space_id } from '../config/constants';
import { createHeaderButton, createMhoHeaderSpace, getHeaderButtonsContainer, mho_header_logo_class } from './header-space';

describe('header-space', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="header"><div id="postbox"><img></div></div>';
    });

    it('crée un cadre header-icon avec un seul enfant .mho-header-inner qui commence par le logo', () => {
        createMhoHeaderSpace();
        const space = document.getElementById(mho_header_space_id);
        const frame = space.querySelector('#mho-header-frame') as HTMLDivElement;
        expect(frame.parentElement).toBe(space);
        expect(frame.classList.contains('header-icon')).toBe(true);
        expect(frame.children.length).toBe(1);
        const inner = getHeaderButtonsContainer();
        expect(inner).toBe(frame.firstElementChild);
        expect(inner.classList.contains('mho-header-inner')).toBe(true);
        const logo = inner.firstElementChild as HTMLDivElement;
        expect(logo.classList.contains(mho_header_logo_class)).toBe(true);
        expect(logo.classList.contains('header-icon')).toBe(false);
        const imgs = logo.querySelectorAll('img');
        expect(imgs.length).toBe(1);
        expect(imgs[0].src).toBe(mh_optimizer_icon_flat);
    });

    it('getHeaderButtonsContainer renvoie null sans espace en-tête', () => {
        expect(getHeaderButtonsContainer()).toBeNull();
    });

    it('ne duplique pas le logo si l\'encadré existe déjà', () => {
        createMhoHeaderSpace();
        createMhoHeaderSpace();
        expect(document.querySelectorAll(`.${mho_header_logo_class}`).length).toBe(1);
    });

    it('createHeaderButton crée un bouton avec un seul img, sans taille en ligne (laissée au CSS desktop/mobile)', () => {
        const btn = createHeaderButton('x', 'p.gif');
        expect(btn.id).toBe('x');
        expect(btn.classList.contains('header-icon')).toBe(false);
        expect(btn.querySelector('img').style.cursor).toBe('pointer');
        const imgs = btn.querySelectorAll('img');
        expect(imgs.length).toBe(1);
        expect(imgs[0].src).toContain('p.gif');
        expect(imgs[0].style.height).toBe('');
    });

    it('le logo n\'a pas de taille en ligne', () => {
        createMhoHeaderSpace();
        expect((document.querySelector('.mho-header-logo img') as HTMLImageElement).style.height).toBe('');
    });
});
