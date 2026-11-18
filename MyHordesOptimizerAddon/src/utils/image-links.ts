/** Extensions d'image reconnues sur le `pathname` d'un lien (insensible à la casse) */
const image_url_pattern: RegExp = /\.(jpe?g|png|gif|webp|svg|bmp)$/i;
/** Page imgflip d'un mème : l'image est servie à `i.imgflip.com/{id}.jpg` */
const imgflip_page_pattern: RegExp = /^\/i\/([A-Za-z0-9]+)$/;

/** Album ou galerie imgur (`/a/{id}`, `/gallery/{id}` ou `/gallery/{titre}-{id}`) */
const imgur_album_pattern: RegExp = /^\/(?:a|gallery)\/(?:[^/]*-)?([A-Za-z0-9]{5,10})\/?$/;
/**
 * Image seule imgur (`/{id}`, 5 ou 7 caractères). ponytail: on exige une majuscule ou un chiffre
 * pour écarter les pages du site (`/privacy`, `/upload`…) ; un id tout en minuscules est ignoré.
 */
const imgur_image_pattern: RegExp = /^\/(?=[^/]*[A-Z0-9])([A-Za-z0-9]{5}|[A-Za-z0-9]{7})\/?$/;

/**
 * URL de l'iframe d'intégration imgur pour un lien d'album, de galerie ou d'image seule, sur le
 * modèle de leur `embed.js` (sans charger leur script), sinon `null`.
 */
export function getImgurEmbedUrl(href: string): string | null {
    let url: URL;
    try {
        url = new URL(href, document.baseURI);
    } catch {
        return null;
    }

    if (url.hostname.replace(/^(www|m)\./, '') !== 'imgur.com') return null;

    const album_match: RegExpMatchArray | null = url.pathname.match(imgur_album_pattern);
    const image_match: RegExpMatchArray | null = album_match ? null : url.pathname.match(imgur_image_pattern);
    const embed_id: string | null = album_match ? `a/${album_match[1]}` : image_match?.[1] ?? null;

    return embed_id ? `https://imgur.com/${embed_id}/embed?pub=true&context=false&analytics=false&w=540` : null;
}

/**
 * URL de l'image à afficher pour un lien de post : le lien lui-même s'il pointe vers un fichier
 * image, l'image déduite pour une page imgflip, sinon `null`.
 */
export function getForumImageUrl(href: string): string | null {
    let url: URL;
    try {
        url = new URL(href, document.baseURI);
    } catch {
        return null;
    }

    if (image_url_pattern.test(url.pathname)) return href;

    if (url.hostname.replace(/^www\./, '') === 'imgflip.com') {
        const match: RegExpMatchArray | null = url.pathname.match(imgflip_page_pattern);
        if (match) return `https://i.imgflip.com/${match[1]}.jpg`;
    }

    return null;
}
