/** Paramètre de requête qui porte un snapshot partagé. */
export const TOOL_SNAPSHOT_PARAM: string = 'c';

/** Encode un snapshot en base64url (UTF-8), sûr dans une URL. */
export function encodeSnapshot(snapshot: object): string {
    const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(snapshot));
    let binary: string = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Décode un snapshot produit par {@link encodeSnapshot}, ou `null` si la chaîne n'en est pas un (non fiable : vient d'une URL). */
export function decodeSnapshot(encoded: string): Record<string, unknown> | null {
    try {
        const binary: string = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes: Uint8Array = Uint8Array.from(binary, (char: string): number => char.charCodeAt(0));
        const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? <Record<string, unknown>>parsed : null;
    } catch {
        return null;
    }
}

/** URL de `page_url` portant le snapshot dans {@link TOOL_SNAPSHOT_PARAM} ; les autres paramètres sont conservés, le fragment retiré. */
export function buildShareUrl(page_url: string, snapshot: object): string {
    const url: URL = new URL(page_url);
    url.searchParams.set(TOOL_SNAPSHOT_PARAM, encodeSnapshot(snapshot));
    url.hash = '';
    return url.toString();
}

/** Valeur numérique bornée à `[min, max]`, ou `fallback` si `value` n'est pas un nombre fini. */
export function toBoundedNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, value));
}
