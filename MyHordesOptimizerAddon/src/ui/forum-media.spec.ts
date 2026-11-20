import { beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import { displayForumLinkImages } from './forum';

describe('displayForumLinkImages', () => {
    beforeEach(() => {
        state.mho_parameters = { ...state.mho_parameters, forum_options: true, forum_auto_display_images: true } as typeof state.mho_parameters;
    });

    it('does not treat the link inside an injected block as a new post link on replay', () => {
        document.body.innerHTML = '<div class="forum-post-content"><a href="https://imgflip.com/i/b5khez">Nous sachons !</a></div>';

        displayForumLinkImages();
        displayForumLinkImages();

        expect(document.querySelectorAll('.mho-forum-media-block')).toHaveLength(1);
    });

    it('crops the imgur Share and logo bars out of the embed frame', () => {
        document.body.innerHTML = '<div class="forum-post-content"><a href="https://imgur.com/a/BZhvwwb">Hate club</a></div>';

        displayForumLinkImages();

        const iframe: HTMLIFrameElement = document.querySelector('.mho-forum-imgur-frame iframe') as HTMLIFrameElement;
        expect(iframe.style.height).toBe('500px');
        expect((iframe.parentElement as HTMLElement).style.height).toBe('385px');
    });

    it('keeps injected blocks out of the html imported by the game editor, even when the event detail is not mutable', () => {
        document.body.innerHTML = '<hordes-twino-editor></hordes-twino-editor><div class="forum-post-content"><a href="https://imgflip.com/i/b5khez">Nous sachons !</a></div>';
        displayForumLinkImages();

        const editor: Element = document.querySelector('hordes-twino-editor') as Element;
        const received: string[] = [];
        editor.addEventListener('import', (event: Event) => received.push((event as CustomEvent<{ html: string }>).detail.html));

        const html: string = (document.querySelector('.forum-post-content') as HTMLElement).innerHTML;
        expect(html).toContain('mho-forum-media-block');
        editor.dispatchEvent(new CustomEvent('import', { detail: Object.freeze({ html, insert: true }) }));

        expect(received).toHaveLength(1);
        expect(received[0]).not.toContain('mho-forum-media-block');
        expect(received[0]).toContain('Nous sachons !');
    });
});
