// `as const` : c'est cette liste qui définit l'union MapThemeToken.
const TOKENS = [
    'map-l0',
    'map-l1',
    'map-l2',
    'map-l3',
    'map-unknown',
    'map-hatch',
    'map-fg',
    'map-marker',
    'map-marker-ink',
    'map-me',
    'map-sel',
    'map-sel-fg',
    'map-age-green',
    'map-age-yellow',
    'map-age-orange',
    'map-age-red'
] as const;

export type MapThemeToken = typeof TOKENS[number];
export type MapThemeColors = Partial<Record<MapThemeToken, string>>;

export const MAP_THEME_TOKENS: readonly MapThemeToken[] = TOKENS;
