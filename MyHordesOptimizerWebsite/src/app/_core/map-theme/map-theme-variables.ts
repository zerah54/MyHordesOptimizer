import { MAP_THEME_TOKENS, MapThemeColors, MapThemeToken } from '../../_abstract_model/types/map-theme.class';

/** Jetons stockés en couleur opaque mais rendus avec une opacité fixe. */
const TOKEN_ALPHA: Partial<Record<MapThemeToken, number>> = { 'map-hatch': 0.08, 'map-marker': 0.85 };

/** Convertit `#rrggbb` en `rgba(r, g, b, alpha)` ; valeur inchangée si ce n'est pas un hexadécimal à 6 chiffres. */
function withAlpha(hex: string, alpha: number): string {
    const match: RegExpMatchArray | null = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!match) {
        return hex;
    }
    return `rgba(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}, ${alpha})`;
}

/** Variables CSS `--mho-*` d'un thème personnalisé ; les jetons absents ne produisent aucune variable. */
export function mapThemeVariables(colors: MapThemeColors): Record<string, string> {
    const variables: Record<string, string> = {};
    for (const token of MAP_THEME_TOKENS) {
        const value: string | undefined = colors[token];
        if (value === undefined) {
            continue;
        }
        const alpha: number | undefined = TOKEN_ALPHA[token];
        variables[`--mho-${token}`] = alpha === undefined ? value : withAlpha(value, alpha);
        if (token === 'map-fg') {
            variables['--mho-map-bare-fg'] = value;
        }
    }
    return variables;
}
