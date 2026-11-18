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
});
