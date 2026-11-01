import { MapThemeToken } from '../../_abstract_model/types/map-theme.class';

/** Convertit `rgb(…)` / `rgba(…)` (alpha ignoré) en `#rrggbb` ; `null` pour tout autre format. */
export function cssColorToHex(value: string): string | null {
    const match: RegExpExecArray | null = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i.exec(value.trim());
    if (match === null) {
        return null;
    }
    const channels: number[] = [match[1], match[2], match[3]].map((c: string): number => Math.min(255, +c));
    return `#${channels.map((c: number): string => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Couleur réelle d'un jeton de carte : `getComputedStyle` sur la variable renverrait le texte brut
 * (`light-dark(…)`), il faut donc faire lire la variable par la propriété `color` d'une sonde.
 */
export function resolveTokenColor(token: MapThemeToken): string | null {
    const probe: HTMLElement = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(--mho-${token})`;
    document.body.appendChild(probe);
    const resolved: string = getComputedStyle(probe).color;
    probe.remove();
    return cssColorToHex(resolved);
}
