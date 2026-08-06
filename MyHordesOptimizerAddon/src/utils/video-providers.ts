import { fetchJsonp } from './jsonp';

export interface VideoProvider {
    id: string;
    extractVideoId(url: URL): string | null;
    getEmbedUrl(videoId: string): string;
    /** Vignette disponible de façon synchrone (URL directement prévisible). */
    getThumbnailUrl?: (videoId: string) => string;
    /** Vignette nécessitant une résolution asynchrone. Résout `undefined` en cas d'échec/timeout. */
    resolveThumbnailUrl?: (videoId: string) => Promise<string | undefined>;
}

const youtube_id_pattern: RegExp = /^[A-Za-z0-9_-]{11}$/;

/** Extrait l'identifiant vidéo d'une URL YouTube (`watch`, `shorts`, `embed`, `youtu.be`), ou `null` si l'URL ne correspond pas. */
function extractYoutubeId(url: URL): string | null {
    const host: string = url.hostname.replace(/^(www|m)\./, '');

    if (host === 'youtu.be') {
        const id: string = url.pathname.slice(1);
        return youtube_id_pattern.test(id) ? id : null;
    }

    if (host !== 'youtube.com') return null;

    if (url.pathname === '/watch') {
        const id: string | null = url.searchParams.get('v');
        return id && youtube_id_pattern.test(id) ? id : null;
    }

    const embed_match: RegExpMatchArray | null = url.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})$/);
    return embed_match ? embed_match[1] : null;
}

export const youtubeProvider: VideoProvider = {
    id: 'youtube',
    extractVideoId: extractYoutubeId,
    getThumbnailUrl: (videoId: string): string => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    getEmbedUrl: (videoId: string): string => `https://www.youtube-nocookie.com/embed/${videoId}`,
};

/** Extrait l'identifiant vidéo d'une URL Dailymotion (`dailymotion.com/video/...` ou `dai.ly/...`), ou `null` si l'URL ne correspond pas. */
function extractDailymotionId(url: URL): string | null {
    const host: string = url.hostname.replace(/^www\./, '');

    if (host === 'dai.ly') {
        const id: string = url.pathname.slice(1);
        return id.length > 0 ? id : null;
    }

    if (host !== 'dailymotion.com') return null;

    const match: RegExpMatchArray | null = url.pathname.match(/^\/video\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
}

export const dailymotionProvider: VideoProvider = {
    id: 'dailymotion',
    extractVideoId: extractDailymotionId,
    getEmbedUrl: (videoId: string): string => `https://www.dailymotion.com/embed/video/${videoId}`,
    resolveThumbnailUrl: (videoId: string): Promise<string | undefined> =>
        fetchJsonp(`https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(`https://www.dailymotion.com/video/${videoId}`)}&format=json`)
            .then((data: unknown) => (data as { thumbnail_url?: string } | undefined)?.thumbnail_url),
};

const video_providers: VideoProvider[] = [youtubeProvider, dailymotionProvider];

export interface MatchedVideo {
    provider: VideoProvider;
    videoId: string;
}

/** Reconnaît un lien de post pointant vers une vidéo YouTube ou Dailymotion et en extrait l'identifiant. */
export function matchVideoLink(href: string): MatchedVideo | null {
    let url: URL;
    try {
        url = new URL(href, document.baseURI);
    } catch {
        return null;
    }

    for (const provider of video_providers) {
        const videoId: string | null = provider.extractVideoId(url);
        if (videoId) return { provider, videoId };
    }

    return null;
}
