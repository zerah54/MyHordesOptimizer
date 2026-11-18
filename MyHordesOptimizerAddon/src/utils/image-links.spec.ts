import { describe, expect, it } from 'vitest';

import { getForumImageUrl, getImgurEmbedUrl } from './image-links';

describe('getImgurEmbedUrl', () => {
    it.each([
        ['https://imgur.com/a/BZhvwwb', 'a/BZhvwwb'],
        ['https://imgur.com/gallery/un-titre-BZhvwwb', 'a/BZhvwwb'],
        ['https://imgur.com/gallery/BZhvwwb', 'a/BZhvwwb'],
        ['https://imgur.com/N3p1WX4', 'N3p1WX4'],
        ['https://m.imgur.com/a/BZhvwwb', 'a/BZhvwwb'],
    ])('builds the embed iframe url for %s', (href: string, id: string) => {
        expect(getImgurEmbedUrl(href)).toBe(`https://imgur.com/${id}/embed?pub=true&context=false&analytics=false&w=540`);
    });

    it.each([
        'https://imgur.com/',
        'https://imgur.com/upload',
        'https://i.imgur.com/N3p1WX4.png',
        'https://example.com/a/BZhvwwb',
    ])('returns null for %s', (href: string) => {
        expect(getImgurEmbedUrl(href)).toBeNull();
    });
});

describe('getForumImageUrl', () => {
    it.each([
        ['https://example.com/a.png', 'https://example.com/a.png'],
        ['https://example.com/a.JPG?v=2', 'https://example.com/a.JPG?v=2'],
        ['https://imgflip.com/i/b5khez', 'https://i.imgflip.com/b5khez.jpg'],
        ['https://www.imgflip.com/i/b5khez', 'https://i.imgflip.com/b5khez.jpg'],
    ])('resolves %s to %s', (href: string, expected: string) => {
        expect(getForumImageUrl(href)).toBe(expected);
    });

    it.each([
        'https://example.com/page',
        'https://imgflip.com/memegenerator',
        'https://imgflip.com/i/',
        'https://files.catbox.moe/a7axe7.mp4',
    ])('returns null for %s', (href: string) => {
        expect(getForumImageUrl(href)).toBeNull();
    });
});
