import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJsonp } from './jsonp';
import { dailymotionProvider, type MatchedVideo, matchVideoLink, youtubeProvider } from './video-providers';

vi.mock('./jsonp', () => ({ fetchJsonp: vi.fn() }));

describe('matchVideoLink', () => {
    it('matches a YouTube watch URL', () => {
        const result: MatchedVideo | null = matchVideoLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result?.provider).toBe(youtubeProvider);
        expect(result?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('matches a youtu.be short URL', () => {
        const result: MatchedVideo | null = matchVideoLink('https://youtu.be/dQw4w9WgXcQ');
        expect(result?.provider).toBe(youtubeProvider);
        expect(result?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('matches a YouTube shorts URL', () => {
        const result: MatchedVideo | null = matchVideoLink('https://www.youtube.com/shorts/dQw4w9WgXcQ');
        expect(result?.provider).toBe(youtubeProvider);
        expect(result?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('matches a YouTube embed URL', () => {
        const result: MatchedVideo | null = matchVideoLink('https://www.youtube.com/embed/dQw4w9WgXcQ');
        expect(result?.provider).toBe(youtubeProvider);
        expect(result?.videoId).toBe('dQw4w9WgXcQ');
    });

    it('matches a Dailymotion video URL with a trailing slug', () => {
        const result: MatchedVideo | null = matchVideoLink('https://www.dailymotion.com/video/x7tgcev-some-title');
        expect(result?.provider).toBe(dailymotionProvider);
        expect(result?.videoId).toBe('x7tgcev');
    });

    it('matches a dai.ly short URL', () => {
        const result: MatchedVideo | null = matchVideoLink('https://dai.ly/x7tgcev');
        expect(result?.provider).toBe(dailymotionProvider);
        expect(result?.videoId).toBe('x7tgcev');
    });

    it('returns null for a non-video link', () => {
        expect(matchVideoLink('https://myhordes.eu/forum/thread/42')).toBeNull();
    });

    it('returns null for an image link (no false positive)', () => {
        expect(matchVideoLink('https://example.com/photo.png')).toBeNull();
    });

    it('returns null for a malformed URL instead of throwing (a relative path like "not a url" would resolve fine against document.baseURI, so this needs a string invalid even as a relative reference)', () => {
        expect(matchVideoLink('http://[invalid')).toBeNull();
    });
});

describe('youtubeProvider', () => {
    it('builds a predictable thumbnail URL', () => {
        expect(youtubeProvider.getThumbnailUrl?.('dQw4w9WgXcQ')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('builds a nocookie embed URL', () => {
        expect(youtubeProvider.getEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });

    it('has no async thumbnail resolver (thumbnail is always synchronous)', () => {
        expect(youtubeProvider.resolveThumbnailUrl).toBeUndefined();
    });
});

describe('dailymotionProvider', () => {
    afterEach(() => {
        vi.mocked(fetchJsonp).mockReset();
    });

    it('builds the embed URL', () => {
        expect(dailymotionProvider.getEmbedUrl('x7tgcev')).toBe('https://www.dailymotion.com/embed/video/x7tgcev');
    });

    it('has no synchronous thumbnail getter (thumbnail requires oEmbed)', () => {
        expect(dailymotionProvider.getThumbnailUrl).toBeUndefined();
    });

    it('resolves the thumbnail_url from the oEmbed JSONP response', async () => {
        vi.mocked(fetchJsonp).mockResolvedValue({ thumbnail_url: 'https://s1.dmcdn.net/v/abc/x240' });

        await expect(dailymotionProvider.resolveThumbnailUrl?.('x7tgcev')).resolves.toBe('https://s1.dmcdn.net/v/abc/x240');
        expect(fetchJsonp).toHaveBeenCalledWith('https://www.dailymotion.com/services/oembed?url=https%3A%2F%2Fwww.dailymotion.com%2Fvideo%2Fx7tgcev&format=json');
    });

    it('resolves undefined when the JSONP call fails', async () => {
        vi.mocked(fetchJsonp).mockResolvedValue(undefined);

        await expect(dailymotionProvider.resolveThumbnailUrl?.('x7tgcev')).resolves.toBeUndefined();
    });
});
